// Proctoring — types, persistence, helpers.
//
// Public surface lives behind a single env var:
//
//   NEXT_PUBLIC_PROCTORING=1   →  proctoring enabled for end users
//                                (admin route becomes reachable, student
//                                 panel mounts in every Test tab)
//
// When the env var is OFF, every public function returns its "no-op"
// shape and the admin route renders a "Proctoring is disabled" page.
// This makes proctoring opt-in by deployment, not by code-level flag.
//
// Storage: localStorage key `swadhyaya-proctoring`. We hold up to MAX_ATTEMPTS
// kept attempts in store; older ones are pruned.
//
// This is the *local mirror*, not the record of account. Attempts and
// violations are also written to the server via lib/proctor-client.ts,
// where lib/proctor-store.ts persists them outside the student's reach —
// a localStorage-only design meant any student could clear their own
// evidence with one devtools command, and the reviewer had to sit at the
// same physical browser to see anything.

export type ViolationType =
  | "focus_loss"      // window/iframe lost focus
  | "tab_switch"      // document.hidden flipped
  | "right_click"     // contextmenu (attempt to suppress)
  | "copy"            // copy attempt
  | "paste"           // paste attempt
  | "cut"             // cut attempt
  | "devtools_open"   // devtools detected by debugger timing
  | "long_idle"       // no input for > 5 min during the attempt
  | "no_face"         // face detector returned zero boxes
  | "multiple_faces"  // face detector returned more than one box
  | "looking_away"    // keypoint geometry indicates the head is turned
  | "face_mismatch"   // face doesn't match the registered descriptor
  | "blur_detected"   // Laplacian variance below threshold
  | "voice_detected"  // YAMNet classified the audio frame as speech
  | "motion_detected" // sudden whole-frame change
  | "camera_blocked"; // camera track ended, muted, or covered

export interface Violation {
  id: string;
  attemptId: string;
  type: ViolationType;
  timestamp: number;
  severity: number;
  // For focus_loss events: how long the window was unfocused, ms.
  durationMs?: number;
  context?: string;
  // Small JPEG snapshot captured at the moment of the violation.
  //
  // Only populated on the local (localStorage) record, and only when the
  // server round-trip failed — see lib/proctor-client.ts. The durable
  // copy is uploaded to /api/proctor/attempts/:id/violations and stored
  // on disk by lib/proctor-store.ts, which hands back an `evidenceId`
  // instead. Inlining base64 here was capping the store out at the ~5 MB
  // localStorage quota after a couple of dozen anomalies.
  snapshot?: string;
  /** Pointer to server-side evidence, when the upload succeeded. */
  evidenceId?: string;
}

export type AttemptStatus =
  | "active"      // currently in the test tab
  | "completed"   // reached threshold + submitted (honourable exit)
  | "abandoned";  // user closed without finishing

export interface Attempt {
  id: string;
  conceptId: string;
  startedAt: number;
  endedAt?: number;
  status: AttemptStatus;
  violationCount: number;
  violations: Violation[];
  // Heartbeat — bumped every ~10s while the attempt is active. The admin
  // dashboard uses this to distinguish live sessions (> 30 s since last
  // heartbeat) from ghost ones.
  lastHeartbeatAt: number;
  metadata: {
    userAgent: string;
    timezone: string;
    screen: string;
    language: string;
  };
  // Snapshot of the test outcome (when status === 'completed').
  result?: {
    score: number;
    total: number;
    passed: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Persistence layer
// ─────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "swadhyaya-proctoring";
const MAX_ATTEMPTS_KEPT = 200; // attempts kept per browser
const HEARTBEAT_INTERVAL_MS = 10_000;

interface ProctorStore {
  attempts: Record<string, Attempt>;
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadStore(): ProctorStore {
  if (!isBrowser()) return { attempts: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { attempts: {} };
    const parsed = JSON.parse(raw) as Partial<ProctorStore>;
    return { attempts: (parsed.attempts ?? {}) as Record<string, Attempt> };
  } catch {
    return { attempts: {} };
  }
}

function saveStore(s: ProctorStore): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // localStorage may be disabled (private mode). Silently ignore.
  }
}

export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `a${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function readMeta(): Attempt["metadata"] {
  if (!isBrowser()) {
    return {
      userAgent: "server",
      timezone: "UTC",
      screen: "0x0",
      language: "en",
    };
  }
  return {
    userAgent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown",
    screen: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

export function isProctoringEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PROCTORING === "1";
}

export function startAttempt(conceptId: string): Attempt {
  const store = loadStore();
  const meta = readMeta();
  const attempt: Attempt = {
    id: uid(),
    conceptId,
    startedAt: Date.now(),
    status: "active",
    violationCount: 0,
    violations: [],
    lastHeartbeatAt: Date.now(),
    metadata: meta,
  };
  store.attempts[attempt.id] = attempt;
  pruneOldAttempts(store);
  saveStore(store);
  return attempt;
}

export function getAttempt(id: string): Attempt | null {
  if (!id) return null;
  return loadStore().attempts[id] ?? null;
}

export function listAttempts(): Attempt[] {
  const store = loadStore();
  return Object.values(store.attempts).sort((a, b) => b.startedAt - a.startedAt);
}

export function listActiveAttempts(): Attempt[] {
  const now = Date.now();
  return listAttempts().filter(
    (a) =>
      a.status === "active" && now - a.lastHeartbeatAt < 30_000,
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Site-wide session proctoring
// ─────────────────────────────────────────────────────────────────────────
//
// One long-lived attempt that starts the moment the user opts in to
// proctoring site-wide and ends only when they opt out or close the
// browser. Concept-id "_session" so the admin dashboard can
// distinguish it from per-test attempts at a glance.

export const SESSION_CONCEPT_ID = "_session";
const SESSION_KEY = "swadhyaya-proctoring-session";

export function getOrCreateSiteSession(): Attempt {
  const store = loadStore();
  const savedId = (() => {
    try {
      return window.localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  })();
  if (savedId) {
    const existing = store.attempts[savedId];
    if (existing && existing.conceptId === SESSION_CONCEPT_ID) {
      // Bring it back to "active" if it had been marked complete/abandoned
      // by anything else — sessions are sticky.
      if (existing.status !== "active") {
        const revived: Attempt = {
          ...existing,
          status: "active",
          endedAt: undefined,
          lastHeartbeatAt: Date.now(),
        };
        store.attempts[savedId] = revived;
        saveStore(store);
        return revived;
      }
      return existing;
    }
  }
  // No session yet — create one.
  const meta = readMeta();
  const a: Attempt = {
    id: uid(),
    conceptId: SESSION_CONCEPT_ID,
    startedAt: Date.now(),
    status: "active",
    violationCount: 0,
    violations: [],
    lastHeartbeatAt: Date.now(),
    metadata: meta,
  };
  store.attempts[a.id] = a;
  pruneOldAttempts(store);
  saveStore(store);
  try {
    window.localStorage.setItem(SESSION_KEY, a.id);
  } catch {
    // ignore
  }
  return a;
}

export function clearSiteSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function endSiteSession(
  status: AttemptStatus = "completed",
): Attempt | null {
  const store = loadStore();
  let id: string | null = null;
  try {
    id = window.localStorage.getItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  if (!id) return null;
  const a = store.attempts[id];
  if (!a || a.conceptId !== SESSION_CONCEPT_ID) return null;
  const ended: Attempt = {
    ...a,
    status,
    endedAt: Date.now(),
  };
  store.attempts[id] = ended;
  saveStore(store);
  clearSiteSession();
  return ended;
}

export function endAttempt(
  id: string,
  status: AttemptStatus,
  result?: Attempt["result"],
): Attempt | null {
  if (!id) return null;
  const store = loadStore();
  const a = store.attempts[id];
  if (!a) return null;
  const ended: Attempt = {
    ...a,
    status,
    endedAt: Date.now(),
    result,
  };
  store.attempts[id] = ended;
  pruneOldAttempts(store);
  saveStore(store);
  return ended;
}

export function heartbeat(id: string): void {
  if (!id) return;
  const store = loadStore();
  const a = store.attempts[id];
  if (!a || a.status !== "active") return;
  store.attempts[id] = { ...a, lastHeartbeatAt: Date.now() };
  saveStore(store);
}

// Input the helper accepts — caller only names the type and any
// duration / context. Timestamp is stamped fresh.
export interface ViolationInput {
  type: ViolationType;
  severity?: number;
  durationMs?: number;
  context?: string;
  /** JPEG data-URL. Kept locally only as a fallback when the upload to
   *  /api/proctor/attempts/:id/violations failed; otherwise the bytes
   *  live server-side and `evidenceId` points at them. */
  snapshot?: string;
  evidenceId?: string;
}

export function logViolation(
  attemptId: string,
  v: ViolationInput,
): Violation | null {
  if (!attemptId) return null;
  const store = loadStore();
  const a = store.attempts[attemptId];
  if (!a || a.status !== "active") return null;
  const violation: Violation = {
    id: uid(),
    attemptId,
    timestamp: Date.now(),
    ...v,
    severity: v.severity ?? 1,
  };
  const updated: Attempt = {
    ...a,
    violationCount: a.violationCount + 1,
    violations: [...a.violations, violation].slice(-50), // keep last 50
  };
  store.attempts[attemptId] = updated;
  saveStore(store);
  return violation;
}

export function attemptDuration(a: Attempt, now: number = Date.now()): number {
  if (a.status === "completed" || a.status === "abandoned") {
    return (a.endedAt ?? now) - a.startedAt;
  }
  return now - a.startedAt;
}

// Older attempts get pruned — keep the most recent MAX_ATTEMPTS_KEPT.
function pruneOldAttempts(store: ProctorStore): void {
  const entries = Object.entries(store.attempts);
  if (entries.length <= MAX_ATTEMPTS_KEPT) return;
  entries
    .sort(([, a], [, b]) => a.startedAt - b.startedAt)
    .slice(0, entries.length - MAX_ATTEMPTS_KEPT)
    .forEach(([id]) => delete store.attempts[id]);
}

export const HEARTBEAT_MS = HEARTBEAT_INTERVAL_MS;
export const VIOLATION_CAP = 50; // max stored per attempt

// Human-readable label for a ViolationType — used in the admin dashboard.
export const VIOLATION_LABEL: Record<ViolationType, string> = {
  focus_loss: "Window lost focus",
  tab_switch: "Switched tabs / window",
  right_click: "Right-click attempt",
  copy: "Copy attempt",
  paste: "Paste attempt",
  cut: "Cut attempt",
  devtools_open: "DevTools likely open",
  long_idle: "Idle for 5+ minutes",
  no_face: "No face in frame",
  multiple_faces: "Multiple people in frame",
  looking_away: "Looking away from screen",
  face_mismatch: "Face does not match registration",
  blur_detected: "Camera feed too blurry",
  voice_detected: "Speech detected",
  motion_detected: "Sudden scene change",
  camera_blocked: "Camera blocked or covered",
};
