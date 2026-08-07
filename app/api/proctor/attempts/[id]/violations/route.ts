// POST /api/proctor/attempts/[id]/violations
//
// The student's detectors call this whenever an anomaly fires. An
// optional `snapshot` (JPEG data-URL) is decoded, written to the
// evidence store, and referenced by id — this is what replaces stuffing
// base64 images into localStorage, which capped out at ~5 MB per
// browser and left evidence stranded on the student's own machine.

import { NextResponse } from "next/server";
import {
  appendViolation,
  authorizeWrite,
  maxEvidenceBytes,
  saveEvidence,
} from "@/lib/proctor-store";
import { VIOLATION_LABEL, type ViolationType } from "@/lib/proctoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = new Set(Object.keys(VIOLATION_LABEL));

/** Accepts `data:image/jpeg;base64,...` and returns the raw bytes. */
function decodeSnapshot(snapshot: string): Buffer | null {
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.exec(snapshot);
  if (!m) return null;
  try {
    const buf = Buffer.from(m[2]!, "base64");
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  if (process.env.NEXT_PUBLIC_PROCTORING !== "1") {
    return NextResponse.json(
      { error: "proctoring is disabled on this deployment" },
      { status: 404 },
    );
  }

  const { id } = await ctx.params;

  const authorized = await authorizeWrite(
    id,
    req.headers.get("x-proctor-write-token"),
  ).catch(() => null);
  if (!authorized) {
    return NextResponse.json(
      { error: "unknown attempt or bad write token" },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const type = body.type;
  if (typeof type !== "string" || !VALID_TYPES.has(type)) {
    return NextResponse.json(
      { error: `unknown violation type: ${String(type)}` },
      { status: 400 },
    );
  }

  // Store the snapshot first so the violation can point at it. A
  // snapshot that fails to decode is dropped rather than rejecting the
  // violation — losing the image is better than losing the record.
  let evidenceId: string | undefined;
  if (typeof body.snapshot === "string" && body.snapshot) {
    const bytes = decodeSnapshot(body.snapshot);
    if (bytes && bytes.length <= maxEvidenceBytes()) {
      evidenceId = await saveEvidence(bytes).catch(() => undefined);
    }
  }

  const violation = await appendViolation(id, {
    type: type as ViolationType,
    severity: typeof body.severity === "number" ? body.severity : undefined,
    durationMs:
      typeof body.durationMs === "number" ? body.durationMs : undefined,
    context: typeof body.context === "string" ? body.context : undefined,
    evidenceId,
  });

  if (!violation) {
    return NextResponse.json(
      { error: "attempt is not active" },
      { status: 409 },
    );
  }

  return NextResponse.json({ violation }, { status: 201 });
}
