// /admin/proctor — opt-in admin dashboard for the Proctoring feature.
// Gated by NEXT_PUBLIC_PROCTORING=1 so deployments that don't want
// proctoring can leave the env var unset and the route renders a
// "disabled" page (no 404 surprise).

import Link from "next/link";
import { EyeOff } from "lucide-react";
import { AdminProctorDashboard } from "@/components/proctor/AdminProctorDashboard";

export const metadata = {
  title: "Proctoring · Admin",
};

export default function AdminProctorPage() {
  const enabled = process.env.NEXT_PUBLIC_PROCTORING === "1";

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warn/15 text-warn border border-warn/30">
            admin
          </span>
          <span className="text-[10px] text-faint uppercase tracking-wider">
            Proctoring
          </span>
        </div>
        <h1 className="font-serif text-3xl text-ink">
          Proctored attempts
        </h1>
        <p className="mt-1 text-sm text-dim max-w-2xl">
          Read-only view of proctored sessions, served from the server
          store — attempts from every student on every machine, not just
          this browser. Access requires the{" "}
          <code className="text-ink font-mono">PROCTOR_ADMIN_TOKEN</code>.
        </p>
      </header>

      {enabled ? (
        <AdminProctorDashboard />
      ) : (
        <DisabledView />
      )}
    </div>
  );
}

function DisabledView() {
  return (
    <div className="bg-card border border-line rounded-xl p-8 max-w-2xl">
      <div className="flex items-center gap-2 text-faint">
        <EyeOff size={20} aria-hidden="true" />
        <h2 className="font-serif text-xl text-ink">
          Proctoring is disabled on this deployment
        </h2>
      </div>
      <p className="mt-3 text-sm text-dim leading-relaxed">
        The proctoring API, the student-side detectors and this dashboard
        are all gated on one flag. To enable them:
      </p>
      <pre className="mt-3 bg-canvas border border-line rounded p-3 text-xs font-mono overflow-x-auto">
{`# .env.local
NEXT_PUBLIC_PROCTORING=1
PROCTOR_ADMIN_TOKEN=$(openssl rand -hex 32)`}
      </pre>
      <p className="mt-3 text-sm text-dim leading-relaxed">
        then restart. Enabling the flag also relaxes the camera/mic
        Permissions-Policy and the CSP in{" "}
        <code className="text-ink font-mono">next.config.ts</code>, which
        otherwise block <code className="text-ink font-mono">getUserMedia</code>{" "}
        outright. Without{" "}
        <code className="text-ink font-mono">PROCTOR_ADMIN_TOKEN</code> the
        read endpoints fail closed and this dashboard stays locked.
      </p>
      <div className="mt-6">
        <Link href="/" className="text-xs text-accent hover:underline">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
