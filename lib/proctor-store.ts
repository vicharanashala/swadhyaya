import "server-only";

// Server-side proctoring store — modelled on vibe's `anomalies` module
// (backend/src/modules/anomalies), adapted to swadhyaya's constraints.
//
// vibe persists anomalies to MongoDB and evidence to cloud storage,
// keyed by an authenticated userId. swadhyaya has neither a database
// nor user auth (lib/auth.ts is a disabled stub), so this is a
// filesystem store with pseudonymous subjects:
//
//   <PROCTOR_DATA_DIR>/attempts/<attemptId>.json   one file per attempt
//   <PROCTOR_DATA_DIR>/evidence/<evidenceId>.jpg   snapshot bytes
//
// One file per attempt keeps writes from different students off each
// other's toes; a per-id mutex serialises the read-modify-write that
// appending a violation requires. That is safe for a single Node
// process — behind a multi-instance deployment two servers can still
// interleave appends to the same attempt, which is the point at which
// this should be swapped for a real database.
//
// Evidence is stored as bytes on disk and referenced by id, replacing
// the base64 data-URLs the client used to inline into localStorage.

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AttemptStatus, ViolationType } from "./proctoring";

export interface ServerViolation {
  id: string;
  attemptId: string;
  type: ViolationType;
  timestamp: number;
  severity: number;
  durationMs?: number;
  context?: string;
  /** Pointer into the evidence store — never the image bytes themselves. */
  evidenceId?: string;
}

export interface ServerAttempt {
  id: string;
  /** Pseudonymous per-browser id. Not a real identity — see lib/auth.ts. */
  subjectId: string;
  conceptId: string;
  startedAt: number;
  endedAt?: number;
  status: AttemptStatus;
  violationCount: number;
  violations: ServerViolation[];
  lastHeartbeatAt: number;
  metadata: {
    userAgent: string;
    timezone: string;
    screen: string;
    language: string;
  };
  result?: { score: number; total: number; passed: boolean };
  /** Cumulative penalty score (severity-weighted anomaly tally).
   *  Drives FLAG_RESTART_THRESHOLD and PENALTY_EJECT_THRESHOLD. */
  penaltyScore?: number;
  /** Reason recorded when status === "ejected". */
  ejectionReason?: string;
  /** sha256 of the write token. The raw token is returned once, at
   *  creation, and never persisted — so a leaked attempt id alone
   *  does not let a third party forge violations against it. */
  writeTokenHash: string;
}

/** What we hand back to clients — the token hash stays server-side. */
export type PublicAttempt = Omit<ServerAttempt, "writeTokenHash">;

// ─────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────

function dataDir(): string {
  const configured = process.env.PROCTOR_DATA_DIR || ".proctor-data";
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

const attemptsDir = () => path.join(dataDir(), "attempts");
const evidenceDir = () => path.join(dataDir(), "evidence");

export function maxEvidenceBytes(): number {
  const n = Number(process.env.PROCTOR_MAX_EVIDENCE_BYTES);
  return Number.isFinite(n) && n > 0 ? n : 2 * 1024 * 1024;
}

function maxAttempts(): number {
  const n = Number(process.env.PROCTOR_MAX_ATTEMPTS);
  return Number.isFinite(n) && n > 0 ? n : 500;
}

/** Violations retained per attempt, matching the client-side cap. */
const VIOLATION_CAP = 50;

// ─────────────────────────────────────────────────────────────────────────
// Admin auth
// ─────────────────────────────────────────────────────────────────────────
//
// Every read endpoint is gated on a shared secret. Without user auth
// this token is the only thing between the public internet and student
// webcam footage, so a missing/blank token fails closed rather than
// falling back to "open".

export function adminTokenConfigured(): boolean {
  return Boolean(process.env.PROCTOR_ADMIN_TOKEN?.trim());
}

export function isAdminRequest(req: Request): boolean {
  const expected = process.env.PROCTOR_ADMIN_TOKEN?.trim();
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : (req.headers.get("x-proctor-admin-token") ?? "").trim();
  if (!presented) return false;
  const a = Buffer.from(sha256(presented), "hex");
  const b = Buffer.from(sha256(expected), "hex");
  return timingSafeEqual(a, b);
}

function sha256(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}

// ─────────────────────────────────────────────────────────────────────────
// Per-id mutex
// ─────────────────────────────────────────────────────────────────────────

const locks = new Map<string, Promise<unknown>>();

function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  // Keep the chain but don't retain rejections or grow unboundedly.
  locks.set(
    key,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  void next.catch(() => undefined);
  return next;
}

// ─────────────────────────────────────────────────────────────────────────
// Persistence primitives
// ─────────────────────────────────────────────────────────────────────────

async function ensureDirs(): Promise<void> {
  await fs.mkdir(attemptsDir(), { recursive: true });
  await fs.mkdir(evidenceDir(), { recursive: true });
}

/** Reject anything that isn't a plain uuid/hex id, so a crafted id can't
 *  escape the data directory via `../`. */
function assertSafeId(id: string): void {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
    throw new Error("invalid id");
  }
}

async function writeJsonAtomic(file: string, value: unknown): Promise<void> {
  const tmp = `${file}.${randomBytes(6).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value), "utf8");
  await fs.rename(tmp, file);
}

async function readAttemptFile(id: string): Promise<ServerAttempt | null> {
  try {
    const raw = await fs.readFile(path.join(attemptsDir(), `${id}.json`), "utf8");
    return JSON.parse(raw) as ServerAttempt;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

export interface CreateAttemptInput {
  subjectId: string;
  conceptId: string;
  metadata: ServerAttempt["metadata"];
}

export async function createAttempt(
  input: CreateAttemptInput,
): Promise<{ attempt: PublicAttempt; writeToken: string }> {
  await ensureDirs();
  const writeToken = randomBytes(24).toString("hex");
  const now = Date.now();
  const attempt: ServerAttempt = {
    id: randomUUID(),
    subjectId: input.subjectId,
    conceptId: input.conceptId,
    startedAt: now,
    status: "active",
    violationCount: 0,
    violations: [],
    lastHeartbeatAt: now,
    metadata: input.metadata,
    writeTokenHash: sha256(writeToken),
  };
  await writeJsonAtomic(
    path.join(attemptsDir(), `${attempt.id}.json`),
    attempt,
  );
  void pruneOldAttempts();
  return { attempt: toPublic(attempt), writeToken };
}

/** Verifies the caller holds the write token minted for this attempt. */
export async function authorizeWrite(
  attemptId: string,
  writeToken: string | null,
): Promise<ServerAttempt | null> {
  if (!writeToken) return null;
  assertSafeId(attemptId);
  const attempt = await readAttemptFile(attemptId);
  if (!attempt) return null;
  const a = Buffer.from(sha256(writeToken), "hex");
  const b = Buffer.from(attempt.writeTokenHash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return attempt;
}

export interface AppendViolationInput {
  type: ViolationType;
  severity?: number;
  durationMs?: number;
  context?: string;
  evidenceId?: string;
}

export async function appendViolation(
  attemptId: string,
  input: AppendViolationInput,
): Promise<ServerViolation | null> {
  assertSafeId(attemptId);
  return withLock(attemptId, async () => {
    const attempt = await readAttemptFile(attemptId);
    if (!attempt || attempt.status !== "active") return null;
    const violation: ServerViolation = {
      id: randomUUID(),
      attemptId,
      type: input.type,
      timestamp: Date.now(),
      severity: input.severity ?? 1,
      ...(input.durationMs !== undefined ? { durationMs: input.durationMs } : {}),
      ...(input.context ? { context: input.context.slice(0, 500) } : {}),
      ...(input.evidenceId ? { evidenceId: input.evidenceId } : {}),
    };
    const updated: ServerAttempt = {
      ...attempt,
      violationCount: attempt.violationCount + 1,
      violations: [...attempt.violations, violation].slice(-VIOLATION_CAP),
    };
    await writeJsonAtomic(
      path.join(attemptsDir(), `${attemptId}.json`),
      updated,
    );
    return violation;
  });
}


export async function bumpPenalty(
  attemptId: string,
  delta: number,
  eject: boolean = false,
  reason?: string,
): Promise<PublicAttempt | null> {
  assertSafeId(attemptId);
  return withLock(attemptId, async () => {
    const attempt = await readAttemptFile(attemptId);
    if (!attempt) return null;
    const nextScore = (attempt.penaltyScore ?? 0) + delta;
    const updated: ServerAttempt = {
      ...attempt,
      penaltyScore: Math.max(0, nextScore),
      ...(eject
        ? { status: "ejected" as const, endedAt: Date.now(), ejectionReason: reason ?? "penalty threshold" }
        : {}),
    };
    await writeJsonAtomic(
      path.join(attemptsDir(), `${attemptId}.json`),
      updated,
    );
    return toPublic(updated);
  });
}

export async function touchHeartbeat(attemptId: string): Promise<boolean> {
  assertSafeId(attemptId);
  return withLock(attemptId, async () => {
    const attempt = await readAttemptFile(attemptId);
    if (!attempt || attempt.status !== "active") return false;
    await writeJsonAtomic(path.join(attemptsDir(), `${attemptId}.json`), {
      ...attempt,
      lastHeartbeatAt: Date.now(),
    } satisfies ServerAttempt);
    return true;
  });
}

export async function endAttempt(
  attemptId: string,
  status: AttemptStatus,
  result?: ServerAttempt["result"],
): Promise<PublicAttempt | null> {
  assertSafeId(attemptId);
  return withLock(attemptId, async () => {
    const attempt = await readAttemptFile(attemptId);
    if (!attempt) return null;
    const ended: ServerAttempt = {
      ...attempt,
      status,
      endedAt: Date.now(),
      ...(result ? { result } : {}),
    };
    await writeJsonAtomic(path.join(attemptsDir(), `${attemptId}.json`), ended);
    return toPublic(ended);
  });
}

export async function getAttempt(
  attemptId: string,
): Promise<PublicAttempt | null> {
  assertSafeId(attemptId);
  const a = await readAttemptFile(attemptId);
  return a ? toPublic(a) : null;
}

export async function listAttempts(): Promise<PublicAttempt[]> {
  await ensureDirs();
  const files = await fs.readdir(attemptsDir()).catch(() => [] as string[]);
  const out: ServerAttempt[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const a = await readAttemptFile(f.slice(0, -5)).catch(() => null);
    if (a) out.push(a);
  }
  return out.sort((x, y) => y.startedAt - x.startedAt).map(toPublic);
}

/** Mirrors vibe's AnomalyStats — a count per violation type. */
export async function anomalyStats(): Promise<Record<string, number>> {
  const attempts = await listAttempts();
  const stats: Record<string, number> = {};
  for (const a of attempts) {
    for (const v of a.violations) {
      stats[v.type] = (stats[v.type] ?? 0) + 1;
    }
  }
  return stats;
}

function toPublic(a: ServerAttempt): PublicAttempt {
  const { writeTokenHash: _omit, ...rest } = a;
  void _omit;
  return rest;
}

// ─────────────────────────────────────────────────────────────────────────
// Evidence
// ─────────────────────────────────────────────────────────────────────────

export async function saveEvidence(bytes: Buffer): Promise<string> {
  await ensureDirs();
  const id = randomUUID();
  await fs.writeFile(path.join(evidenceDir(), `${id}.jpg`), bytes);
  return id;
}

export async function readEvidence(id: string): Promise<Buffer | null> {
  assertSafeId(id);
  try {
    return await fs.readFile(path.join(evidenceDir(), `${id}.jpg`));
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Retention
// ─────────────────────────────────────────────────────────────────────────
//
// Keeps the newest `maxAttempts()` attempts and deletes the evidence
// belonging to the ones it drops, so snapshots don't outlive the record
// that explains why they were taken.

async function pruneOldAttempts(): Promise<void> {
  try {
    const attempts = await listAttempts();
    const excess = attempts.slice(maxAttempts());
    for (const a of excess) {
      for (const v of a.violations) {
        if (!v.evidenceId) continue;
        await fs
          .unlink(path.join(evidenceDir(), `${v.evidenceId}.jpg`))
          .catch(() => undefined);
      }
      await fs
        .unlink(path.join(attemptsDir(), `${a.id}.json`))
        .catch(() => undefined);
    }
  } catch {
    // Pruning is best-effort — never fail a request because of it.
  }
}
