// POST /api/proctor/attempts   — student opens a session (unauthenticated;
//                                 returns a one-time write token)
// GET  /api/proctor/attempts   — admin lists every attempt (token-gated)
//
// The asymmetry is deliberate. Students have no identity to authenticate
// with (lib/auth.ts is a stub), so creating an attempt is open. Reading
// them back exposes webcam evidence, so it is not.

import { NextResponse } from "next/server";
import {
  adminTokenConfigured,
  createAttempt,
  isAdminRequest,
  listAttempts,
} from "@/lib/proctor-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function proctoringOff(): NextResponse | null {
  if (process.env.NEXT_PUBLIC_PROCTORING === "1") return null;
  return NextResponse.json(
    { error: "proctoring is disabled on this deployment" },
    { status: 404 },
  );
}

export async function POST(req: Request): Promise<NextResponse> {
  const off = proctoringOff();
  if (off) return off;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const subjectId = typeof b.subjectId === "string" ? b.subjectId.slice(0, 64) : "";
  const conceptId = typeof b.conceptId === "string" ? b.conceptId.slice(0, 128) : "";
  if (!subjectId || !conceptId) {
    return NextResponse.json(
      { error: "subjectId and conceptId are required" },
      { status: 400 },
    );
  }

  const rawMeta = (b.metadata ?? {}) as Record<string, unknown>;
  const str = (v: unknown, fallback: string) =>
    typeof v === "string" ? v.slice(0, 256) : fallback;

  const { attempt, writeToken } = await createAttempt({
    subjectId,
    conceptId,
    metadata: {
      userAgent: str(rawMeta.userAgent, "unknown"),
      timezone: str(rawMeta.timezone, "unknown"),
      screen: str(rawMeta.screen, "unknown"),
      language: str(rawMeta.language, "unknown"),
    },
  });

  // writeToken is returned exactly once — only the hash is persisted.
  return NextResponse.json({ attempt, writeToken }, { status: 201 });
}

export async function GET(req: Request): Promise<NextResponse> {
  const off = proctoringOff();
  if (off) return off;

  if (!adminTokenConfigured()) {
    return NextResponse.json(
      { error: "PROCTOR_ADMIN_TOKEN is not set — refusing to serve evidence" },
      { status: 503 },
    );
  }
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ attempts: await listAttempts() });
}
