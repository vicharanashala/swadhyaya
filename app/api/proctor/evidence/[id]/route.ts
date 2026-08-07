// GET /api/proctor/evidence/[id] — serve a stored snapshot.
//
// Admin-only, and deliberately no-store: this is a photograph of a
// student taken in their own home. It should not sit in a CDN cache or
// a browser's disk cache after the reviewer closes the tab.

import { NextResponse } from "next/server";
import {
  adminTokenConfigured,
  isAdminRequest,
  readEvidence,
} from "@/lib/proctor-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  if (process.env.NEXT_PUBLIC_PROCTORING !== "1") {
    return NextResponse.json(
      { error: "proctoring is disabled on this deployment" },
      { status: 404 },
    );
  }
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
  const bytes = await readEvidence(id).catch(() => null);
  if (!bytes) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(bytes.length),
      "Cache-Control": "no-store, private",
      "Content-Disposition": "inline",
    },
  });
}
