// GET /api/proctor/stats — per-type anomaly counts.
//
// The swadhyaya equivalent of vibe's AnomalyStats endpoint
// (backend/src/modules/anomalies/controllers/AnomalyController.ts).

import { NextResponse } from "next/server";
import {
  adminTokenConfigured,
  anomalyStats,
  isAdminRequest,
  listAttempts,
} from "@/lib/proctor-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse> {
  if (process.env.NEXT_PUBLIC_PROCTORING !== "1") {
    return NextResponse.json(
      { error: "proctoring is disabled on this deployment" },
      { status: 404 },
    );
  }
  if (!adminTokenConfigured()) {
    return NextResponse.json(
      { error: "PROCTOR_ADMIN_TOKEN is not set" },
      { status: 503 },
    );
  }
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const attempts = await listAttempts();
  const now = Date.now();
  return NextResponse.json({
    byType: await anomalyStats(),
    totals: {
      attempts: attempts.length,
      active: attempts.filter(
        (a) => a.status === "active" && now - a.lastHeartbeatAt < 30_000,
      ).length,
      ejected: attempts.filter((a) => a.status === "ejected").length,
      violations: attempts.reduce((n, a) => n + a.violationCount, 0),
      subjects: new Set(attempts.map((a) => a.subjectId)).size,
      topPenalty: attempts.reduce((m, a) => Math.max(m, a.penaltyScore ?? 0), 0),
    },
  });
}
