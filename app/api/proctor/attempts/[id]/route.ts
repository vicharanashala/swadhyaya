// PATCH /api/proctor/attempts/[id]  — heartbeat, or end the attempt
// GET   /api/proctor/attempts/[id]  — admin reads one attempt
//
// PATCH is authorised by the write token minted when the attempt was
// created, so holding an attempt id alone is not enough to mutate it.

import { NextResponse } from "next/server";
import {
  adminTokenConfigured,
  authorizeWrite,
  endAttempt,
  getAttempt,
  isAdminRequest,
  touchHeartbeat,
} from "@/lib/proctor-store";
import type { AttemptStatus } from "@/lib/proctoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function proctoringOff(): NextResponse | null {
  if (process.env.NEXT_PUBLIC_PROCTORING === "1") return null;
  return NextResponse.json(
    { error: "proctoring is disabled on this deployment" },
    { status: 404 },
  );
}

function writeToken(req: Request): string | null {
  return req.headers.get("x-proctor-write-token");
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const off = proctoringOff();
  if (off) return off;

  const { id } = await ctx.params;

  const authorized = await authorizeWrite(id, writeToken(req)).catch(() => null);
  if (!authorized) {
    return NextResponse.json(
      { error: "unknown attempt or bad write token" },
      { status: 403 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    // An empty body means "just a heartbeat".
  }

  const action = typeof body.action === "string" ? body.action : "heartbeat";

  if (action === "heartbeat") {
    const ok = await touchHeartbeat(id);
    return NextResponse.json({ ok });
  }

  if (action === "end") {
    const status: AttemptStatus =
      body.status === "abandoned" ? "abandoned" : "completed";
    const r = body.result as Record<string, unknown> | undefined;
    const result =
      r && typeof r.score === "number" && typeof r.total === "number"
        ? { score: r.score, total: r.total, passed: Boolean(r.passed) }
        : undefined;
    const ended = await endAttempt(id, status, result);
    return NextResponse.json({ attempt: ended });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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

  const { id } = await ctx.params;
  const attempt = await getAttempt(id).catch(() => null);
  if (!attempt) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ attempt });
}
