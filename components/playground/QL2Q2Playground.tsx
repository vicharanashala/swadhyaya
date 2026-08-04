"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { motion, AnimatePresence } from "framer-motion";

// Question L2-q2: "If two lines have the same slope, they meet at exactly one point."
// Story: The student's job is to make two lines parallel (same slope, different
// intercept) and watch the meeting point disappear.
// Unique interaction: framer-motion spring on the "no meeting" indicator so it
// appears with a satisfying bounce the instant the lines become parallel.

export function QL2Q2Playground() {
  const [m1, setM1] = useState(1);
  const [c1, setC1] = useState(0);
  const [m2, setM2] = useState(2);
  const [c2, setC2] = useState(3);

  const det = m1 - m2;
  const parallel = Math.abs(det) < 1e-3;

  const intersect = useMemo(() => {
    if (parallel) return null;
    const x = (c2 - c1) / det;
    const y = m1 * x + c1;
    return { x, y };
  }, [m1, c1, m2, c2, det, parallel]);

  const W = 360;
  const line1 = useMemo(
    () => [
      { x: -W / 16, y: m1 * -(W / 16) + c1 },
      { x: W / 16, y: m1 * (W / 16) + c1 },
    ],
    [m1, c1],
  );
  const line2 = useMemo(
    () => [
      { x: -W / 16, y: m2 * -(W / 16) + c2 },
      { x: W / 16, y: m2 * (W / 16) + c2 },
    ],
    [m2, c2],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Drag the slopes — make them equal.
      </div>
      <p className="text-[10px] text-dim mb-3">
        When two lines share a slope they&apos;re parallel. Same question,
        never the same answer.
      </p>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <VectorCanvas
          width={W}
          height={W}
          worldSize={8}
          gridLines={[
            { from: line1[0]!, to: line1[1]!, color: "var(--vector)", width: 2.5 },
            { from: line2[0]!, to: line2[1]!, color: "var(--matrix)", width: 2.5 },
          ]}
          arrows={
            intersect
              ? [
                  {
                    from: { x: 0, y: 0 },
                    to: intersect,
                    color: "var(--accent)",
                    label: `(${intersect.x.toFixed(2)}, ${intersect.y.toFixed(2)})`,
                    width: 3,
                    labelOffset: { x: 0, y: -0.4 },
                  },
                ]
              : []
          }
          ariaLabel="Parallel lines playground"
        />

        <div className="flex-1 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div
              className="bg-card border rounded p-2"
              style={{ borderColor: "var(--vector)" }}
            >
              <div
                className="text-[10px] uppercase tracking-wider mb-1"
                style={{ color: "var(--vector)" }}
              >
                Line 1
              </div>
              <div className="flex gap-1">
                <input
                  type="number"
                  step={0.1}
                  value={m1}
                  onChange={(e) => setM1(parseFloat(e.target.value) || 0)}
                  className="w-12 px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                  aria-label="m₁"
                />
                <span className="text-[10px] text-faint self-center">x+</span>
                <input
                  type="number"
                  step={0.1}
                  value={c1}
                  onChange={(e) => setC1(parseFloat(e.target.value) || 0)}
                  className="w-12 px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                  aria-label="c₁"
                />
              </div>
            </div>
            <div
              className="bg-card border rounded p-2"
              style={{ borderColor: "var(--matrix)" }}
            >
              <div
                className="text-[10px] uppercase tracking-wider mb-1"
                style={{ color: "var(--matrix)" }}
              >
                Line 2
              </div>
              <div className="flex gap-1">
                <input
                  type="number"
                  step={0.1}
                  value={m2}
                  onChange={(e) => setM2(parseFloat(e.target.value) || 0)}
                  className="w-12 px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                  aria-label="m₂"
                />
                <span className="text-[10px] text-faint self-center">x+</span>
                <input
                  type="number"
                  step={0.1}
                  value={c2}
                  onChange={(e) => setC2(parseFloat(e.target.value) || 0)}
                  className="w-12 px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                  aria-label="c₂"
                />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={parallel ? "par" : "meet"}
              initial={{ scale: 0.85, opacity: 0, y: 4 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              className={`rounded p-3 border text-center ${
                parallel
                  ? "bg-warn/10 border-warn/40"
                  : "bg-accent/10 border-accent/40"
              }`}
            >
              <div
                className="font-medium"
                style={{ color: parallel ? "var(--warn)" : "var(--accent)" }}
              >
                {parallel ? "Parallel — no meeting point" : "They meet"}
              </div>
              {intersect && !parallel && (
                <div className="text-[10px] text-dim font-mono mt-1">
                  at ({intersect.x.toFixed(2)}, {intersect.y.toFixed(2)})
                </div>
              )}
              {parallel && (
                <div className="text-[10px] text-dim mt-1">
                  m₁ = m₂ = {m1.toFixed(2)} — slope difference is 0
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <button
            onClick={() => {
              setM1(1);
              setM2(1);
              setC1(0);
              setC2(2);
            }}
            className="w-full text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink"
          >
            make them parallel
          </button>
        </div>
      </div>
    </div>
  );
}