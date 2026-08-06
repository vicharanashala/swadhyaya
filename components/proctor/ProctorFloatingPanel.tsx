"use client";

// ProctorFloatingPanel — the always-on student-facing proctor UI
// modelled on vicharanashala/tenali/FloatingVideo.jsx. Shows the live
// webcam feed (THIS is the "photo" the user wants to see), face
// count + violation count badges, and a collapsible log.
//
// Mounted site-wide by SiteProctorController when the user has
// opted in. Designed to be small enough to stay out of the way (a
// 200px thumbnail by default), but always visible — the student
// can see exactly what the proctoring system sees, which matches
// Vibe's transparency principle.
//
// When a violation is detected, a transient toast slides in from
// the bottom-right (matches Tenali's proctor-toast pattern).

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Camera,
  CameraOff,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  X,
  AlertTriangle,
} from "lucide-react";
import type { Attempt, Violation } from "@/lib/proctoring";
import {
  attemptDuration,
  VIOLATION_LABEL,
} from "@/lib/proctoring";
import { cn } from "@/lib/cn";

interface ProctorFloatingPanelProps {
  attempt: Attempt;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraRunning: boolean;
  cameraError: string | null;
  faceCount: number | null;
  onCollapseChange?: (collapsed: boolean) => void;
  onAddSnapshot?: (violationId: string, dataUrl: string) => void;
}

const COLLAPSED_KEY = "swadhyaya-proctoring-collapsed";

export function ProctorFloatingPanel({
  attempt,
  videoRef,
  cameraRunning,
  cameraError,
  faceCount,
  onCollapseChange,
  onAddSnapshot,
}: ProctorFloatingPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeToasts, setActiveToasts] = useState<Violation[]>([]);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(COLLAPSED_KEY);
      setCollapsed(v === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    onCollapseChange?.(collapsed);
    try {
      window.localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed, onCollapseChange]);

  // When new violations appear, push them as toasts (and capture a
  // screenshot at the moment of violation, so the admin sees what
  // the camera saw).
  useEffect(() => {
    if (attempt.violations.length === 0) return;
    const latest = attempt.violations[attempt.violations.length - 1]!;
    if (seenIds.current.has(latest.id)) return;
    seenIds.current.add(latest.id);
    // Capture a frame for the new violation (if camera is up)
    if (
      onAddSnapshot &&
      videoRef.current &&
      cameraRunning &&
      (latest.type === "no_face" ||
        latest.type === "multiple_faces" ||
        latest.context?.includes("console probe"))
    ) {
      try {
        const c = document.createElement("canvas");
        c.width = videoRef.current.videoWidth || 320;
        c.height = videoRef.current.videoHeight || 240;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, c.width, c.height);
          onAddSnapshot(latest.id, c.toDataURL("image/jpeg", 0.4));
        }
      } catch {
        /* ignore */
      }
    }
    setActiveToasts((t) => [...t.slice(-3), latest]); // keep last 4
    const t = window.setTimeout(() => {
      setActiveToasts((tts) => tts.filter((x) => x.id !== latest.id));
    }, 5000);
    return () => window.clearTimeout(t);
  }, [attempt.violations, cameraRunning, videoRef, onAddSnapshot]);

  const latest = attempt.violations[attempt.violations.length - 1];
  const pillStyle: CSSProperties = {
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };

  // Collapsed: tiny chip bottom-right only
  if (collapsed) {
    return (
      <>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expand proctor panel"
          className={cn(
            "fixed bottom-4 right-4 z-30 w-11 h-11 rounded-full",
            "bg-card/90 border border-line backdrop-blur",
            "shadow-[0_4px_14px_rgba(0,0,0,0.35)]",
            "flex items-center justify-center text-accent hover:bg-elev hover:scale-105 transition",
            attempt.violationCount > 0 && "border-warn/60",
          )}
        >
          <ShieldCheck size={16} aria-hidden="true" />
          {attempt.violationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-warn text-canvas text-[10px] font-mono flex items-center justify-center">
              {attempt.violationCount}
            </span>
          )}
        </button>
        <Toasts toasts={activeToasts} onDismiss={(id) => setActiveToasts((t) => t.filter((x) => x.id !== id))} />
      </>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-30 w-[220px] max-w-[calc(100vw-2rem)] bg-card border border-line rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.4)] overflow-hidden text-xs">
        {/* Header */}
        <div
          style={pillStyle}
          className={cn(
            "flex items-center gap-2 px-3 py-2 border-b border-line",
            attempt.violationCount > 0
              ? "bg-warn/15 text-warn"
              : "bg-correct/10 text-correct",
          )}
        >
          {attempt.violationCount > 0 ? (
            <ShieldAlert size={14} aria-hidden="true" />
          ) : (
            <ShieldCheck size={14} aria-hidden="true" />
          )}
          <span className="font-medium flex-1 truncate">
            {attempt.violationCount === 0 ? "Live · clear" : "Live · flagged"}
          </span>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse proctor panel"
            className="text-faint hover:text-ink transition"
          >
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        </div>

        {/* Video */}
        <div className="relative bg-canvas aspect-video">
          {cameraRunning ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              aria-label="Proctor webcam preview"
              className="w-full h-full object-cover [transform:scaleX(-1)]" /* mirror */
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-faint flex-col gap-1.5">
              <CameraOff size={28} aria-hidden="true" />
              <span className="text-[10px] uppercase tracking-wider">
                {cameraError ? "Camera blocked" : "Initialising"}
              </span>
              {cameraError && (
                <span className="text-[9px] text-dim px-2 text-center">
                  Monitoring continues without video evidence.
                </span>
              )}
            </div>
          )}
          {/* Face count overlay */}
          {cameraRunning && (
            <div className="absolute top-1.5 left-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono border",
                  faceCount === 1
                    ? "bg-correct/15 border-correct/40 text-correct"
                    : faceCount === 0
                      ? "bg-warn/15 border-warn/40 text-warn"
                      : "bg-accent/15 border-accent/40 text-accent",
                )}
              >
                <span aria-hidden="true">
                  {faceCount === 1 ? "✓" : faceCount === 0 ? "👤" : "👥"}
                </span>
                {faceCount === null
                  ? "scanning…"
                  : faceCount === 0
                    ? "no face"
                    : faceCount === 1
                      ? "1 face"
                      : `${faceCount} faces`}
              </span>
            </div>
          )}
          {/* Recording dot */}
          {cameraRunning && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono border bg-warn/15 border-warn/40 text-warn">
              <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
              <span>REC</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="px-3 py-2 space-y-1 border-t border-line bg-elev/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-faint">
              Time
            </span>
            <span className="font-mono tabular-nums text-ink">
              {fmtDuration(attemptDuration(attempt))}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-faint">
              Violations
            </span>
            <span
              className={cn(
                "font-mono tabular-nums",
                attempt.violationCount > 0 ? "text-warn" : "text-ink",
              )}
            >
              {attempt.violationCount}
            </span>
          </div>
          {latest && (
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-[10px] uppercase tracking-wider text-faint truncate">
                Last
              </span>
              <span className="text-[10px] text-dim truncate max-w-[120px]">
                {VIOLATION_LABEL[latest.type]}
              </span>
            </div>
          )}
        </div>
      </div>

      <Toasts
        toasts={activeToasts}
        onDismiss={(id) => setActiveToasts((t) => t.filter((x) => x.id !== id))}
      />
    </>
  );
}

function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: Violation[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed right-4 top-20 z-40 flex flex-col gap-2 max-w-[280px]">
      {toasts.map((v) => (
        <div
          key={v.id}
          role="alert"
          className="bg-card border border-warn/40 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.35)] overflow-hidden animate-[a11y-slide_180ms_ease]"
        >
          <div className="flex items-start gap-2 p-2.5">
            <div className="shrink-0 w-7 h-7 rounded-full bg-warn/15 border border-warn/40 flex items-center justify-center">
              <AlertTriangle size={14} className="text-warn" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-ink truncate">
                {VIOLATION_LABEL[v.type]}
              </div>
              <div className="text-[10px] text-dim leading-snug">
                {new Date(v.timestamp).toLocaleTimeString()}
                {typeof v.durationMs === "number" && v.durationMs > 0
                  ? ` · ${fmtDuration(v.durationMs)}`
                  : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(v.id)}
              aria-label="Dismiss notification"
              className="shrink-0 w-6 h-6 rounded text-faint hover:text-ink hover:bg-elev inline-flex items-center justify-center transition"
            >
              <X size={11} aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("proctor-camera-feed");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full text-[10px] bg-warn/10 hover:bg-warn/20 text-warn py-1 transition"
          >
            show camera feed
          </button>
        </div>
      ))}
    </div>
  );
}

function fmtDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

// Avoid unused-import warnings when the build tries to tree-shake.
const _types = Camera;
void _types;
