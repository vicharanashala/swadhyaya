"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { m2eigen, fmt } from "@/lib/math";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// Question E1-q1: "For matrix [[2, 0], [0, 3]], which vector is an eigenvector?"
// Library: framer-motion + canvas-confetti.
// The student drags a vector v. When v lines up with an eigenvector of
// the (fixed) matrix [[2, 0], [0, 3]], the system celebrates with
// confetti and a "you found it!" banner.

const M = [[2, 0], [0, 3]] as const;

const HINTS = [
  "An eigenvector survives the transformation up to a scalar.",
  "Try dragging v along the x-axis (the eigen-direction for λ=2).",
  "Or along the y-axis (the eigen-direction for λ=3).",
  "For [[2,0],[0,3]], the eigenvectors are (1, 0) and (0, 1). Anything on those axes is one.",
];

export function QE1Q1Playground() {
  const [v, setV] = useState({ x: 2, y: 1 });
  const [hintIdx, setHintIdx] = useState(-1);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  const eigen = useMemo(() => m2eigen(M as [[number, number], [number, number]]), []);

  // Apply M to v.
  const out = useMemo(
    () => ({ x: M[0][0] * v.x + M[0][1] * v.y, y: M[1][0] * v.x + M[1][1] * v.y }),
    [v],
  );

  // Is v collinear with Mv?
  const cross = v.x * out.y - v.y * out.x;
  const vLen = Math.hypot(v.x, v.y) || 1e-9;
  // sine of the angle between v and Mv (relative to v's length).
  const angleSin = Math.abs(cross) / vLen / Math.max(1e-9, Math.hypot(out.x, out.y));
  const found = vLen > 0.3 && angleSin < 0.06;

  // Trigger confetti on discovery.
  useEffect(() => {
    if (found) {
      setCelebrating(true);
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
      // Respect reduced-motion.
      if (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#e8864a", "#5cb87a", "#6db3ff", "#c98aff", "#ffcc66"],
      });
      celebrateTimer.current = setTimeout(() => setCelebrating(false), 1800);
    }
    return () => {
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    };
  }, [found]);

  // What lambda did we find? (≈2 if v is closer to x-axis, ≈3 if y-axis)
  const foundLambda = useMemo(() => {
    if (!found || !eigen) return null;
    const lambdaApprox =
      vLen > 1e-6
        ? Math.hypot(out.x, out.y) / Math.hypot(v.x, v.y)
        : null;
    return lambdaApprox;
  }, [found, eigen, out, v]);

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        For A = [[2, 0], [0, 3]] — drag v to find an eigenvector.
      </div>
      <p className="text-[10px] text-dim mb-3">
        The matrix stretches the x-axis by 2× and the y-axis by 3×. Any
        vector along those axes is an eigenvector (it only gets stretched,
        never rotated).
      </p>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="relative">
          <VectorCanvas
            width={360}
            height={360}
            worldSize={5}
            arrows={[
              {
                from: { x: 0, y: 0 },
                to: { x: M[0][0], y: M[0][1] },
                color: "var(--vector)",
                label: "î → T(î)",
                width: 2,
                dashed: true,
                labelOffset: { x: 0, y: -0.3 },
              },
              {
                from: { x: 0, y: 0 },
                to: { x: M[1][0], y: M[1][1] },
                color: "var(--matrix)",
                label: "ĵ → T(ĵ)",
                width: 2,
                dashed: true,
                labelOffset: { x: 0, y: 0.3 },
              },
              // Eigen-direction overlays
              {
                from: { x: 0, y: 0 },
                to: { x: 2.5, y: 0 },
                color: "var(--eigen)",
                label: "λ=2 axis",
                width: 1.5,
                dashed: true,
              },
              {
                from: { x: 0, y: 0 },
                to: { x: 0, y: 2.5 },
                color: "var(--singular)",
                label: "λ=3 axis",
                width: 1.5,
                dashed: true,
              },
              {
                from: { x: 0, y: 0 },
                to: v,
                color: found ? "var(--accent)" : "var(--ink)",
                label: found ? "✓ v" : "v",
                width: 3,
                labelOffset: { x: 0.3, y: 0.3 },
              },
              {
                from: { x: 0, y: 0 },
                to: out,
                color: found ? "var(--accent)" : "var(--warn)",
                label: found ? "= λ·v" : "Mv",
                width: 3,
                dashed: !found,
                labelOffset: { x: 0.3, y: -0.3 },
              },
            ]}
            draggablePoints={[
              {
                id: "v",
                pos: v,
                color: found ? "var(--accent)" : "var(--ink)",
                label: "v",
                radius: 8,
              },
            ]}
            onPointDrag={(id, p) => {
              if (id === "v")
                setV({ x: Math.round(p.x * 4) / 4, y: Math.round(p.y * 4) / 4 });
            }}
            clamp={{ min: { x: -4.5, y: -4.5 }, max: { x: 4.5, y: 4.5 } }}
            ariaLabel="Eigenvector finder"
          />
        </div>

        <div className="flex-1 space-y-3 text-xs">
          <div className="bg-card border border-line rounded p-2">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              v and Mv
            </div>
            <div className="font-mono text-ink">
              v = ({fmt(v.x, 2)}, {fmt(v.y, 2)})
            </div>
            <div className="font-mono text-warn">
              Mv = ({fmt(out.x, 2)}, {fmt(out.y, 2)})
            </div>
            <div className="font-mono text-faint">
              cross = {fmt(cross, 2)} (≈ 0 means collinear)
            </div>
          </div>

          <AnimatePresence>
            {found && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`bg-accent/10 border border-accent/40 rounded p-3 text-center ${
                  celebrating ? "shadow-[0_0_24px_-4px_var(--accent)]" : ""
                }`}
                aria-live="polite"
              >
                <div className="text-accent font-medium text-sm">
                  ✨ Eigenvector found!
                </div>
                <div className="text-[10px] text-dim mt-1">
                  Mv = {fmt(foundLambda ?? 0, 2)} · v — same direction, just
                  stretched.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setHintIdx((i) => Math.min(i + 1, HINTS.length - 1))}
            className="w-full text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink"
          >
            {hintIdx >= 0 ? "next hint" : "give me a hint"}
          </button>
          {hintIdx >= 0 && (
            <div className="bg-elev/40 border border-line rounded p-2 text-[10px] text-dim leading-relaxed">
              {HINTS[hintIdx]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}