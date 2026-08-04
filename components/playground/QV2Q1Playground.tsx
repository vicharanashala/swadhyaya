"use client";
import { useState, useMemo } from "react";
import { VectorCanvas, worldToPixel } from "@/components/viz/VectorCanvas";
import { motion, AnimatePresence } from "framer-motion";

// Question V2-q1: "v = (1, 2) and w = (3, 1). What is v + w?"
// Library: framer-motion (smooth head-to-tail walk animation)
// The student sees:
//   * v and w as draggable arrows
//   * the head-to-tail walk animated step-by-step
//   * the resulting sum arrow drawn live
//   * the formula (1+3, 2+1) = (4, 3) updating in real time

const COLORS = {
  v: "var(--vector)",
  w: "var(--matrix)",
  vScaled: "var(--vector)",
  wScaled: "var(--matrix)",
  sum: "var(--accent)",
};

const PRESETS: Array<{ name: string; v: { x: number; y: number }; w: { x: number; y: number } }> = [
  { name: "1+3=4", v: { x: 1, y: 2 }, w: { x: 3, y: 1 } },
  { name: "Negatives", v: { x: 2, y: -1 }, w: { x: -1, y: 2 } },
  { name: "Same line", v: { x: 1, y: 1 }, w: { x: 2, y: 2 } },
  { name: "Opposites", v: { x: 1, y: 1 }, w: { x: -1, y: -1 } },
];

export function QV2Q1Playground() {
  const [v, setV] = useState({ x: 1, y: 2 });
  const [w, setW] = useState({ x: 3, y: 1 });
  const [scaleV, setScaleV] = useState(1);
  const [scaleW, setScaleW] = useState(1);

  const vScaled = useMemo(
    () => ({ x: v.x * scaleV, y: v.y * scaleV }),
    [v, scaleV],
  );
  const wScaled = useMemo(
    () => ({ x: w.x * scaleW, y: w.y * scaleW }),
    [w, scaleW],
  );
  const sum = useMemo(
    () => ({ x: vScaled.x + wScaled.x, y: vScaled.y + wScaled.y }),
    [vScaled, wScaled],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
        v + w — head-to-tail walk. Drag the tips of v and w.
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="relative">
          <VectorCanvas
            width={360}
            height={360}
            worldSize={6}
            arrows={[
              // Original v and w (full-color, from origin)
              {
                from: { x: 0, y: 0 },
                to: v,
                color: COLORS.v,
                label: "v",
                width: 2.5,
                labelOffset: { x: 0, y: -0.3 },
              },
              {
                from: { x: 0, y: 0 },
                to: w,
                color: COLORS.w,
                label: "w",
                width: 2.5,
                labelOffset: { x: 0, y: 0.3 },
              },
              // Scaled v from origin (dashed)
              {
                from: { x: 0, y: 0 },
                to: vScaled,
                color: COLORS.vScaled,
                label: scaleV === 1 ? "v" : `${scaleV.toFixed(1)}·v`,
                width: 2,
                dashed: true,
                labelOffset: { x: 0, y: -0.4 },
              },
            ]}
            draggablePoints={[
              { id: "v", pos: v, color: COLORS.v, label: "v", radius: 7 },
              { id: "w", pos: w, color: COLORS.w, label: "w", radius: 7 },
            ]}
            onPointDrag={(id, p) => {
              if (id === "v") setV({ x: Math.round(p.x * 2) / 2, y: Math.round(p.y * 2) / 2 });
              if (id === "w") setW({ x: Math.round(p.x * 2) / 2, y: Math.round(p.y * 2) / 2 });
            }}
            clamp={{ min: { x: -5.5, y: -5.5 }, max: { x: 5.5, y: 5.5 } }}
            ariaLabel="Vector addition playground"
          >
            {/* Animated head-to-tail walk arrow (pixel coords inside SVG). */}
            <AnimatedWalkArrow
              size={360}
              worldSize={6}
              from={vScaled}
              to={sum}
              color={COLORS.wScaled}
              label={scaleW === 1 ? "w" : `${scaleW.toFixed(1)}·w`}
            />
            <AnimatedWalkArrow
              size={360}
              worldSize={6}
              from={{ x: 0, y: 0 }}
              to={sum}
              color={COLORS.sum}
              label={`v+w = (${sum.x.toFixed(1)}, ${sum.y.toFixed(1)})`}
              width={3}
              isSum
            />
          </VectorCanvas>
        </div>

        <div className="flex-1 space-y-3 text-xs">
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              Scale (scalar multiplies the vector)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-vector font-mono text-[10px] w-8">
                c₁ =
              </span>
              <input
                type="range"
                min={-2}
                max={2}
                step={0.1}
                value={scaleV}
                onChange={(e) => setScaleV(parseFloat(e.target.value))}
                className="flex-1 accent-accent"
                aria-label="c₁"
              />
              <span className="font-mono text-vector w-10 text-right">
                {scaleV.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-matrix font-mono text-[10px] w-8">
                c₂ =
              </span>
              <input
                type="range"
                min={-2}
                max={2}
                step={0.1}
                value={scaleW}
                onChange={(e) => setScaleW(parseFloat(e.target.value))}
                className="flex-1 accent-accent"
                aria-label="c₂"
              />
              <span className="font-mono text-matrix w-10 text-right">
                {scaleW.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="bg-card border border-line rounded p-2 space-y-0.5">
            <div className="text-faint text-[10px] uppercase tracking-wider">
              v = ({v.x}, {v.y}), w = ({w.x}, {w.y})
            </div>
            <div className="font-mono text-vector">
              c₁·v = ({vScaled.x.toFixed(2)}, {vScaled.y.toFixed(2)})
            </div>
            <div className="font-mono text-matrix">
              c₂·w = ({wScaled.x.toFixed(2)}, {wScaled.y.toFixed(2)})
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${sum.x.toFixed(2)}-${sum.y.toFixed(2)}`}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-accent/10 border border-accent/40 rounded p-2"
            >
              <div className="text-accent text-[10px] uppercase tracking-wider mb-0.5">
                c₁·v + c₂·w =
              </div>
              <div className="font-mono text-lg text-accent">
                ({sum.x.toFixed(2)}, {sum.y.toFixed(2)})
              </div>
              <div className="text-[10px] text-dim mt-1">
                = ({vScaled.x.toFixed(2)} + {wScaled.x.toFixed(2)},{" "}
                {vScaled.y.toFixed(2)} + {wScaled.y.toFixed(2)})
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setV(p.v);
                  setW(p.w);
                  setScaleV(1);
                  setScaleW(1);
                }}
                className="text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Animated arrow from `from` to `to` using framer-motion. Operates in
// pixel coordinates inside the SVG (because motion attributes must be
// SVG-pixel values, not world coordinates). The label is rendered as a
// separate text element next to the arrow.
function AnimatedWalkArrow({
  from,
  to,
  color,
  label,
  width = 2,
  isSum = false,
  size,
  worldSize,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  label: string;
  width?: number;
  isSum?: boolean;
  size: number;
  worldSize: number;
}) {
  const p1 = worldToPixel(from, size, worldSize);
  const p2 = worldToPixel(to, size, worldSize);
  const midX = (p1.x + p2.x) / 2 + 8;
  const midY = (p1.y + p2.y) / 2 - 6;
  return (
    <>
      <motion.line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={isSum ? undefined : "4 4"}
        initial={false}
        animate={{ x2: p2.x, y2: p2.y }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      />
      {label && (
        <text
          x={midX}
          y={midY}
          fill={color}
          fontSize="11"
          fontFamily="ui-monospace, monospace"
          style={{ pointerEvents: "none" }}
        >
          {label}
        </text>
      )}
    </>
  );
}