"use client";

// Loader — the canonical loading skeleton for playgrounds, dynamic
// imports, and any other "waiting" state in swadhyaya. Two flavours:
//
//   <Loader />            — 4 pulsing circles (warm cream), most generic.
//   <LoaderPulseBar />    — A thin "skeleton line" bar that pulses left→right
//                           for inline loading states (e.g. inside a card).
//   <LoaderCanvas />      — Re-export of CanvasLoadingSkeleton for ergonomic
//                           use inside playgrounds.
//
// Pattern lifted from vicharanashala/vibe's Loader.tsx (4 dot-circles with
// outline pulse) but tuned for the warm-brown/orange theme and given a
// class-name API so it composes inside any container.

import { cn } from "@/lib/cn";

const COLORS = {
  ring: "var(--ink)",
  dot: "var(--accent)",
};

export function Loader({
  className,
  size = 18,
  label,
}: {
  className?: string;
  size?: number;
  label?: string;
}) {
  // Four nested circles — outer pulses scale+opacity, dot fades, outline radiates.
  // Same keyframe timings as Vibe's loader but the colors lean warm.
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
      className={cn(
        "inline-flex items-center justify-center gap-3 text-dim",
        className,
      )}
    >
      <div className="loader flex items-center justify-center">
        <span aria-hidden="true">[</span>
        <span
          aria-hidden="true"
          className="flex items-center justify-center"
          style={{ ["--loader-size" as string]: `${size * 1.6}px` }}
        >
          {[0, 1, 2, 3].map((i) => (
            <LoaderDot key={i} index={i} size={size} />
          ))}
        </span>
        <span aria-hidden="true">]</span>
      </div>
      {label && (
        <span className="text-xs text-faint font-mono">{label}</span>
      )}
      <style>{`
        .loader {
          --color: ${COLORS.dot};
          --animation: 1.6s ease-in-out infinite;
          display: inline-flex;
          align-items: center;
        }
        .loader > span:first-of-type,
        .loader > span:last-of-type {
          color: var(--faint);
          font-family: ui-monospace, monospace;
          opacity: 0.4;
          font-size: 0.85em;
        }
        .loader-pulse {
          width: var(--loader-size);
          height: var(--loader-size);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin: 0 4px;
        }
        .loader-pulse-circle {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 1.5px solid var(--accent);
          background-color: transparent;
          animation: circle-keys var(--animation);
          position: relative;
        }
        .loader-pulse-dot {
          position: absolute;
          transform: translate(-50%, -50%);
          top: 50%;
          left: 50%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent);
          animation: dot-keys var(--animation);
        }
        .loader-pulse-outline {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: outline-keys var(--animation);
        }
        @keyframes circle-keys {
          0%   { transform: scale(1); opacity: 1; }
          50%  { transform: scale(1.5); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes dot-keys {
          0%   { transform: translate(-50%, -50%) scale(1); }
          50%  { transform: translate(-50%, -50%) scale(0.3); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes outline-keys {
          0%   {
            transform: translate(-50%, -50%) scale(0);
            outline: solid 12px var(--accent-soft, rgba(232, 134, 74, 0.4));
            outline-offset: 0;
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.6);
            outline: solid 0 transparent;
            outline-offset: 6px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function LoaderDot({ index, size }: { index: number; size: number }) {
  // Each dot gets a staggered delay — same math as Vibe's four circles.
  const delay = `${index * 0.2}s`;
  const dotDelay = `${index * 0.2}s`;
  const outlineDelay = `${0.7 + index * 0.2}s`;
  return (
    <span
      className="loader-pulse"
      style={{
        width: size * 1.6,
        height: size * 1.6,
        animationDelay: delay,
      }}
    >
      <span
        className="loader-pulse-circle"
        style={{ animationDelay: delay }}
      />
      <span
        className="loader-pulse-dot"
        style={{ animationDelay: dotDelay }}
      />
      <span
        className="loader-pulse-outline"
        style={{ animationDelay: outlineDelay }}
      />
    </span>
  );
}

// Inline shimmer line — used inside cards that need a quiet placeholder.
export function LoaderPulseBar({
  className,
  height = 6,
  width = "100%",
}: {
  className?: string;
  height?: number;
  width?: number | string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "relative overflow-hidden rounded",
        "bg-elev/40",
        className,
      )}
      style={{ height, width }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-accent/15 to-transparent"
        style={{
          animation: "loader-shimmer 1.6s ease-in-out infinite",
        }}
      />
      <style jsx>{`
        @keyframes loader-shimmer {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(360%); }
        }
      `}</style>
    </div>
  );
}
