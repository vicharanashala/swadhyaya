"use client";
import { useState, useMemo } from "react";
import { VectorCanvas, worldToPixel } from "@/components/viz/VectorCanvas";
import { motion, useMotionValue, useMotionValueEvent, animate } from "framer-motion";
import { useEffect } from "react";

// Question V2-q2: "3 × (1, 2) = ?"
// Story: Multiplying a vector by a scalar stretches or shrinks it. With a
// negative scalar, it flips. The student drags the scalar; the resulting
// vector animates to its new length with spring physics.

export function QV2Q2Playground() {
  const [vx, setVx] = useState(1);
  const [vy, setVy] = useState(2);
  const [c, setC] = useState(3);

  const scaled = useMemo(() => ({ x: c * vx, y: c * vy }), [c, vx, vy]);
  const isFlip = c < 0;

  // Animate the displayed vector using motion values for smooth stretch.
  const mx = useMotionValue(scaled.x);
  const my = useMotionValue(scaled.y);
  useEffect(() => {
    animate(mx, scaled.x, { type: "spring", stiffness: 120, damping: 16 });
    animate(my, scaled.y, { type: "spring", stiffness: 120, damping: 16 });
  }, [scaled.x, scaled.y, mx, my]);

  const W = 360;
  const size = W;
  const worldSize = 6;

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Drag the scalar — watch the vector stretch (or flip).
      </div>
      <p className="text-[10px] text-dim mb-3">
        Multiplying by a positive number stretches; by zero collapses to
        origin; by negative flips and stretches.
      </p>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="relative">
          <VectorCanvas
            width={size}
            height={size}
            worldSize={worldSize}
            arrows={[
              {
                from: { x: 0, y: 0 },
                to: { x: vx, y: vy },
                color: "var(--ink)",
                label: "v",
                width: 2.5,
                labelOffset: { x: 0, y: -0.3 },
              },
            ]}
            ariaLabel="Scalar multiplication playground"
          >
            <AnimatedArrow
              mx={mx}
              my={my}
              color={isFlip ? "var(--warn)" : "var(--accent)"}
              label={`${c.toFixed(1)}·v`}
              size={size}
              worldSize={worldSize}
            />
          </VectorCanvas>
        </div>

        <div className="flex-1 space-y-3 text-xs">
          <div className="bg-card border border-line rounded p-2">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              v = ({vx}, {vy})
            </div>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="number"
                step={0.5}
                value={vx}
                onChange={(e) => setVx(parseFloat(e.target.value) || 0)}
                className="px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                aria-label="v x"
              />
              <input
                type="number"
                step={0.5}
                value={vy}
                onChange={(e) => setVy(parseFloat(e.target.value) || 0)}
                className="px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                aria-label="v y"
              />
            </div>
          </div>

          <div className="bg-card border border-line rounded p-2">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              scalar c
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={c}
                onChange={(e) => setC(parseFloat(e.target.value))}
                className="flex-1 accent-accent"
                aria-label="scalar slider"
              />
              <input
                type="number"
                step={0.5}
                value={c}
                onChange={(e) => setC(parseFloat(e.target.value) || 0)}
                className="w-14 px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
              />
            </div>
            <div className="flex justify-between text-[9px] text-faint font-mono mt-1">
              <span>flip ←</span>
              <span>· 0 ·</span>
              <span>→ stretch</span>
            </div>
          </div>

          <motion.div
            key={c.toFixed(1)}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className={`rounded p-3 border ${
              c === 0
                ? "bg-warn/10 border-warn/40"
                : isFlip
                  ? "bg-warn/10 border-warn/40"
                  : "bg-accent/10 border-accent/40"
            }`}
          >
            <div
              className="text-center text-lg font-mono"
              style={{
                color:
                  c === 0
                    ? "var(--warn)"
                    : isFlip
                      ? "var(--warn)"
                      : "var(--accent)",
              }}
            >
              {c.toFixed(1)} · ({vx}, {vy}) = ({scaled.x.toFixed(2)},{" "}
              {scaled.y.toFixed(2)})
            </div>
            <div className="text-[10px] text-dim text-center mt-1">
              {c === 0
                ? "Zero scalar collapses everything to the origin"
                : isFlip
                  ? "Negative scalar flips the vector"
                  : "Positive scalar stretches"}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Animated arrow whose tip follows motion values mx/my. Uses
// useMotionValueEvent to subscribe to motion updates and rerender the
// line tip via state.
function AnimatedArrow({
  mx,
  my,
  color,
  label,
  size,
  worldSize,
}: {
  mx: ReturnType<typeof useMotionValue<number>>;
  my: ReturnType<typeof useMotionValue<number>>;
  color: string;
  label: string;
  size: number;
  worldSize: number;
}) {
  const [tip, setTip] = useState({
    x: worldToPixel({ x: 0, y: 0 }, size, worldSize).x,
    y: worldToPixel({ x: 0, y: 0 }, size, worldSize).y,
  });
  useMotionValueEvent(mx, "change", (v) => {
    setTip((t) => ({
      ...t,
      x: worldToPixel({ x: v, y: 0 }, size, worldSize).x,
    }));
  });
  useMotionValueEvent(my, "change", (v) => {
    setTip((t) => ({
      ...t,
      y: worldToPixel({ x: 0, y: v }, size, worldSize).y,
    }));
  });
  const origin = worldToPixel({ x: 0, y: 0 }, size, worldSize);
  return (
    <g>
      <motion.line
        x1={origin.x}
        y1={origin.y}
        animate={{ x2: tip.x, y2: tip.y }}
        transition={{ type: "tween", duration: 0.05 }}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <text
        x={size - 60}
        y={20}
        fill={color}
        fontSize="11"
        fontFamily="ui-monospace, monospace"
        style={{ pointerEvents: "none" }}
      >
        {label}
      </text>
    </g>
  );
}