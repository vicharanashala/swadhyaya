"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { fmt } from "@/lib/math";
import { Plus, RotateCcw } from "lucide-react";

// Concept V1: Vectors are Arrows.
// Three modes of interaction in one playground:
//   1. Drag the head of v anywhere on the canvas.
//   2. Drag the tail of v anywhere on the canvas.
//   3. Add more arrows — each one with its own head and tail.
// The "same vector" overlay shows v translated to the origin — proving
// that a vector is its head-tail difference, not its position.

interface Arrow {
  id: string;
  head: { x: number; y: number };
  tail: { x: number; y: number };
}

const COLORS = [
  "var(--vector)",
  "var(--matrix)",
  "var(--transform)",
  "var(--eigen)",
  "var(--singular)",
];

export function VectorArrowPlayground() {
  const [arrows, setArrows] = useState<Arrow[]>([
    { id: "v1", head: { x: 3, y: 2 }, tail: { x: -1, y: -1 } },
  ]);

  const updateArrow = (id: string, patch: Partial<Arrow>) =>
    setArrows((arr) =>
      arr.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );

  const addArrow = () =>
    setArrows((arr) => [
      ...arr,
      {
        id: `v${arr.length + 1}`,
        head: { x: -2, y: 2 },
        tail: { x: -3, y: -2 },
      },
    ]);

  const reset = () =>
    setArrows([{ id: "v1", head: { x: 3, y: 2 }, tail: { x: -1, y: -1 } }]);

  const maxArrows = 5;

  // For each arrow, also draw a ghost copy translated to the origin so the
  // student sees that "v" doesn't depend on where its tail is.
  const ghosts = useMemo(
    () =>
      arrows.map((a, i) => {
        const dx = a.head.x - a.tail.x;
        const dy = a.head.y - a.tail.y;
        return {
          id: `ghost-${a.id}`,
          from: { x: 0, y: 0 },
          to: { x: dx, y: dy },
          color: COLORS[i % COLORS.length],
          label: `${a.id} (same)`,
          dashed: true,
          labelOffset: { x: 0, y: 0.4 },
          width: 1.5,
        };
      }),
    [arrows],
  );

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-1">
          Drag the head or tail of any arrow. The vector is the difference,
          not the position.
        </h3>
        <p className="text-xs text-dim mb-3">
          Try sliding the head while keeping the tail pinned. The dashed
          copy stays the same — proving the vector is shape, not location.
        </p>

        <div className="bg-canvas border border-line rounded p-2">
          <VectorCanvas
            width={520}
            height={520}
            worldSize={8}
            arrows={ghosts}
            draggableArrows={arrows.map((a, i) => ({
              id: `${a.id}-head`,
              from: a.tail,
              to: a.head,
              color: COLORS[i % COLORS.length],
              label: a.id,
              labelOffset: { x: 0, y: -0.4 },
              width: 3,
            }))}
            // A second draggable arrow per id, for the tail — but our canvas
            // supports only one draggable per id, so we expose the tail via
            // a draggable point (clear visual affordance).
            draggablePoints={arrows.flatMap((a, i) => [
              {
                id: `${a.id}-tail`,
                pos: a.tail,
                color: COLORS[i % COLORS.length],
                radius: 5,
                label: `${a.id} tail`,
              },
            ])}
            onArrowDrag={(id, to) => {
              const baseId = id.replace(/-head$/, "");
              updateArrow(baseId, { head: to });
            }}
            onPointDrag={(id, pos) => {
              const baseId = id.replace(/-tail$/, "");
              updateArrow(baseId, { tail: pos });
            }}
            clamp={{ min: { x: -7.5, y: -7.5 }, max: { x: 7.5, y: 7.5 } }}
            ariaLabel="Vector arrow playground"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-faint uppercase tracking-wider">
            Arrows ({arrows.length}/{maxArrows})
          </div>
          <div className="flex gap-1">
            <button
              onClick={addArrow}
              disabled={arrows.length >= maxArrows}
              className="text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink inline-flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus size={10} aria-hidden="true" /> add
            </button>
            <button
              onClick={reset}
              className="text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink inline-flex items-center gap-1"
            >
              <RotateCcw size={10} aria-hidden="true" /> reset
            </button>
          </div>
        </div>

        {arrows.map((a, i) => {
          const dx = a.head.x - a.tail.x;
          const dy = a.head.y - a.tail.y;
          const len = Math.hypot(dx, dy);
          const color = COLORS[i % COLORS.length];
          return (
            <div
              key={a.id}
              className="bg-card border border-line rounded-xl p-3"
              style={{ borderLeftWidth: 3, borderLeftColor: color }}
            >
              <div className="flex items-center justify-between text-[10px] text-faint uppercase tracking-wider mb-2">
                <span style={{ color }}>{a.id}</span>
                <span className="font-mono">
                  ({fmt(dx, 2)}, {fmt(dy, 2)}) · |v|={fmt(len, 2)}
                </span>
              </div>
              <input
                type="number"
                step={0.1}
                value={a.head.x}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (Number.isFinite(v))
                    updateArrow(a.id, { head: { ...a.head, x: v } });
                }}
                className="w-14 px-2 py-1 mr-1 text-xs font-mono rounded border border-line bg-canvas text-ink"
                aria-label={`${a.id} head x`}
              />
              <input
                type="number"
                step={0.1}
                value={a.head.y}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (Number.isFinite(v))
                    updateArrow(a.id, { head: { ...a.head, y: v } });
                }}
                className="w-14 px-2 py-1 mr-1 text-xs font-mono rounded border border-line bg-canvas text-ink"
                aria-label={`${a.id} head y`}
              />
              <span className="text-[10px] text-faint font-mono mx-1">head</span>
              <input
                type="number"
                step={0.1}
                value={a.tail.x}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (Number.isFinite(v))
                    updateArrow(a.id, { tail: { ...a.tail, x: v } });
                }}
                className="w-14 px-2 py-1 mr-1 text-xs font-mono rounded border border-line bg-canvas text-ink"
                aria-label={`${a.id} tail x`}
              />
              <input
                type="number"
                step={0.1}
                value={a.tail.y}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (Number.isFinite(v))
                    updateArrow(a.id, { tail: { ...a.tail, y: v } });
                }}
                className="w-14 px-2 py-1 text-xs font-mono rounded border border-line bg-canvas text-ink"
                aria-label={`${a.id} tail y`}
              />
              <span className="text-[10px] text-faint font-mono ml-1">tail</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}