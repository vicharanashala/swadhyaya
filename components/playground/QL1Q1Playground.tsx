"use client";
import { useState } from "react";

// Question L1-q1: "If 2x + 3 = 11, what is x?"
// The L1 story: an equation is a weighing scale. Two sides must balance.
// Widget: left pan holds 2 stacks of x unknown-blocks + 3 fixed blocks;
//         right pan holds 11 fixed blocks. Drag x from 0..6 to watch
//         the scale tip. When balanced, the equation holds.
//
// This widget makes the question concrete — the student doesn't pick
// from "x = 4, x = 3, x = 5, x = 8" by guessing; they SEE the balance
// tip when x = 4.
//
// Rotation sign convention:
//   diff = left − right.  diff > 0 → LEFT heavy → left end dips.
//   CSS rotate(deg) is clockwise (right end dips on positive deg).
//   So the visible beam rotation is `−tilt` (sign-flipped) so that the
//   heavy side is always the one that drops visually.

export function QL1Q1Playground() {
  const [x, setX] = useState(0);
  const left = 2 * x + 3;
  const right = 11;
  const diff = left - right;
  // diff > 0 → left side heavier → beam rotates so the LEFT end drops
  // diff < 0 → right side heavier → beam rotates so the RIGHT end drops.
  // CSS rotate(deg) is clockwise: positive makes the right end dip, so
  // we negate the sign so that positive diff drops the LEFT end.
  const tilt = Math.max(-15, Math.min(15, diff * 2.5)); // magnitude (deg)
  const beamDeg = -tilt; // sign flip: heavy side dips
  const balanced = diff === 0;

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-5">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
        The weighing scale — 2x + 3 = 11
      </div>

      {/* The scale */}
      <div className="relative h-40 mb-3 select-none">
        {/* Base post */}
        <div className="absolute left-1/2 bottom-0 w-2 h-32 bg-ink-faint rounded -translate-x-1/2" />
        <div className="absolute left-1/2 bottom-0 w-20 h-2 bg-ink-faint rounded -translate-x-1/2" />

        {/* Beam (tilts with the balance) */}
        <div
          className="absolute left-1/2 top-12 w-56 h-1 bg-ink/80 -translate-x-1/2 origin-center transition-transform duration-300"
          style={{ transform: `translate(-50%, -50%) rotate(${beamDeg}deg)` }}
        />

        {/* Fulcrum dot */}
        <div className="absolute left-1/2 top-12 w-3 h-3 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 z-10" />

        {/* Left pan (label and contents) */}
        <div
          className="absolute left-4 top-8 w-32 transition-transform duration-300 origin-top"
          style={{
            transform: `translateY(${tilt > 0 ? tilt * 1 : 0}px) rotate(${beamDeg}deg)`,
          }}
        >
          <div className="text-[10px] text-faint font-mono text-center mb-1">
            2x + 3
          </div>
          <div className="bg-card border border-line rounded-lg p-2 min-h-[60px]">
            <div className="flex flex-wrap gap-1 justify-center">
              {/* 2 stacks of x */}
              <div className="flex flex-col items-center">
                <div className="bg-accent/30 border border-accent rounded text-[10px] px-1.5 py-0.5 font-mono text-accent">
                  x
                </div>
                <div className="bg-accent/30 border border-accent rounded text-[10px] px-1.5 py-0.5 font-mono text-accent mt-0.5">
                  x
                </div>
              </div>
              {x === 0 && null /* hide x blocks when x=0 */}
              <div className="flex flex-col items-center">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-vector/30 border border-vector rounded text-[10px] px-1.5 py-0.5 font-mono text-vector mt-0.5 first:mt-0"
                  >
                    1
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right pan */}
        <div
          className="absolute right-4 top-8 w-32 transition-transform duration-300 origin-top"
          style={{
            transform: `translateY(${tilt < 0 ? -tilt * 1 : 0}px) rotate(${beamDeg}deg)`,
          }}
        >
          <div className="text-[10px] text-faint font-mono text-center mb-1">
            11
          </div>
          <div className="bg-card border border-line rounded-lg p-2 min-h-[60px]">
            <div className="flex flex-wrap gap-1 justify-center">
              {Array.from({ length: 11 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-matrix/30 border border-matrix rounded text-[10px] px-1.5 py-0.5 font-mono text-matrix"
                >
                  1
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-faint font-mono">x =</span>
          <input
            type="range"
            min={0}
            max={6}
            step={1}
            value={x}
            onChange={(e) => setX(Number(e.target.value))}
            className="flex-1 mx-3 accent-accent"
          />
          <span className="font-mono text-accent w-6 text-right">{x}</span>
        </div>
        <div className="text-xs text-center">
          {balanced ? (
            <span className="text-accent font-medium">
              Balanced! 2({x}) + 3 = {left} = {right}
            </span>
          ) : diff > 0 ? (
            <span className="text-warn">
              Left side heavier ({left} &gt; {right}). Try a smaller x.
            </span>
          ) : (
            <span className="text-warn">
              Right side heavier ({left} &lt; {right}). Try a bigger x.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}