"use client";

// ProctorGate — nothing renders until the camera AND microphone are
// live, and the app is re-hidden the moment either one stops.
//
// This is a hard gate, not a prompt: there is no "continue without",
// no dismiss, and no escape hatch in the UI. Access to the material is
// conditional on being monitored for the whole session.
//
// Two things are worth knowing about the failure modes, because they
// shape everything below:
//
//   • After a hard denial the browser will NOT show the permission
//     prompt again, no matter how many times getUserMedia is called.
//     Only the user can clear it from site settings. So a denied state
//     has to be an instructional screen, not a retry loop — otherwise
//     the user is stuck staring at a button that can never work.
//
//   • A device that doesn't exist can't be granted. On a machine with
//     no webcam or no mic this gate is a permanent wall by design.
//
// When NEXT_PUBLIC_PROCTORING is not "1" this component is a
// pass-through, so deployments that don't run proctoring are unaffected.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  Loader2,
  Mic,
  RefreshCw,
  ShieldCheck,
  VideoOff,
} from "lucide-react";
import {
  ProctorMediaProvider,
  useProctorMedia,
} from "./ProctorMediaProvider";

const PROCTORING_ON = process.env.NEXT_PUBLIC_PROCTORING === "1";

/** Routes that are never gated.
 *
 *  The dashboard is the instructor's review tool. Gating it meant a
 *  teacher opening /admin/proctor was told "Swadhyaya cannot be used
 *  without camera and microphone monitoring" and, having declined, was
 *  locked out of the very screen that shows the evidence. Reviewers are
 *  not the ones being proctored. */
const EXEMPT_PREFIXES = ["/admin"];

function isExempt(pathname: string | null): boolean {
  if (!pathname) return false;
  return EXEMPT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function ProctorGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!PROCTORING_ON || isExempt(pathname)) return <>{children}</>;
  return (
    <ProctorMediaProvider enabled>
      <GateBody>{children}</GateBody>
    </ProctorMediaProvider>
  );
}

function GateBody({ children }: { children: React.ReactNode }) {
  const media = useProctorMedia();
  const [mounted, setMounted] = useState(false);

  // The server can't know the permission state, so the gate screen is
  // client-only. Rendering it during hydration would flash the blocker
  // on every page load even for an already-granted user.
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <FullScreen><Booting /></FullScreen>;
  }

  if (media.healthy) {
    return (
      <>
        {/* Kept mounted and off-screen so the single shared stream always
            has a sink; the visible preview lives in ProctorFloatingPanel. */}
        <video
          ref={media.videoRef}
          className="pointer-events-none fixed h-px w-px opacity-0"
          muted
          playsInline
          aria-hidden="true"
        />
        {children}
      </>
    );
  }

  return (
    <>
      <video
        ref={media.videoRef}
        className="pointer-events-none fixed h-px w-px opacity-0"
        muted
        playsInline
        aria-hidden="true"
      />
      <FullScreen>
        <GateScreen />
      </FullScreen>
    </>
  );
}

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-canvas p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proctor-gate-title"
    >
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}

function Booting() {
  return (
    <div className="text-center">
      <Loader2 className="mx-auto h-6 w-6 animate-spin text-faint" aria-hidden="true" />
      <p id="proctor-gate-title" className="mt-3 text-sm text-faint">
        Starting secure session…
      </p>
    </div>
  );
}

function GateScreen() {
  const { status, error, request } = useProctorMedia();

  const requesting = status === "requesting" || status === "idle";
  const blocked = status === "denied" || status === "no-device";

  return (
    <div className="rounded-2xl border border-line bg-card p-8 shadow-2xl">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            blocked ? "bg-warn/15 text-warn" : "bg-accent/15 text-accent"
          }`}
        >
          {blocked ? (
            <VideoOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
        <div>
          <h1 id="proctor-gate-title" className="font-serif text-2xl text-ink">
            {blocked
              ? "Access blocked"
              : status === "interrupted"
                ? "Monitoring interrupted"
                : "This session is proctored"}
          </h1>
          <p className="mt-1 text-sm text-dim">
            {blocked
              ? "Swadhyaya cannot be used without camera and microphone monitoring."
              : status === "interrupted"
                ? "Your camera or microphone stopped. The session is paused until it returns."
                : "Your camera and microphone must stay on for the entire session."}
          </p>
        </div>
      </div>

      {!blocked && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Requirement
            icon={Camera}
            label="Camera"
            detail="Verifies you are present and alone"
          />
          <Requirement
            icon={Mic}
            label="Microphone"
            detail="Detects speech during the session"
          />
        </div>
      )}

      <div className="mt-6 rounded-lg border border-line bg-elev/40 px-4 py-3">
        <p className="text-xs leading-relaxed text-dim">
          {blocked ? (
            <RecoveryInstructions status={status} />
          ) : (
            <>
              Video and audio are analysed continuously. Snapshots are saved
              only when an anomaly is detected, and are visible to your
              instructor. Monitoring cannot be turned off while you are using
              the site — closing the tab ends the session.
            </>
          )}
        </p>
      </div>

      {error && (
        <p className="mt-4 flex items-start gap-2 text-sm text-warn">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <div className="mt-6">
        {requesting ? (
          <button
            disabled
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm text-paper opacity-60"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Waiting for camera and microphone…
          </button>
        ) : (
          <button
            onClick={() => void request()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm text-paper transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {blocked ? "I've enabled access — retry" : "Enable camera & microphone"}
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-[11px] text-faint">
        There is no option to continue without monitoring.
      </p>
    </div>
  );
}

function Requirement({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof Camera;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-line px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-dim" aria-hidden="true" />
      <div>
        <div className="text-sm text-ink">{label}</div>
        <div className="text-[11px] leading-snug text-faint">{detail}</div>
      </div>
    </div>
  );
}

/** A denied permission cannot be re-prompted, so tell the user exactly
 *  where the switch is instead of letting them mash a dead button. */
function RecoveryInstructions({ status }: { status: string }) {
  if (status === "no-device") {
    return (
      <>
        Connect a webcam and a microphone, then press retry. If they are
        already connected, another application may be holding them — close
        it and retry.
      </>
    );
  }
  return (
    <>
      Your browser is blocking access and will not ask again until you clear
      it. Click the{" "}
      <strong className="text-ink">camera or lock icon in the address bar</strong>
      , set Camera and Microphone to <strong className="text-ink">Allow</strong>,
      then press retry. On Safari, use{" "}
      <strong className="text-ink">Safari → Settings for This Website</strong>.
    </>
  );
}
