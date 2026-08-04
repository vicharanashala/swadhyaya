"use client";
import { useState, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Line, Text } from "@react-three/drei";
import { matRref } from "@/lib/math";
import { Slider } from "./Slider";
import { cn } from "@/lib/cn";
import {
  Sparkles,
  AlertTriangle,
  Infinity as InfIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

// Concept L3: Three equations in three unknowns.
// "Three planes meeting at a point — or not. The 3D upgrade of L2."

type PresetId =
  | "single-point"
  | "no-solution"
  | "line-of-solutions"
  | "all-coincident"
  | "custom";

interface Preset {
  id: PresetId;
  label: string;
  blurb: string;
  coeffs: [number, number, number, number][];
}

const PRESETS: Preset[] = [
  {
    id: "single-point",
    label: "Meet at one point",
    blurb:
      "Three independent planes that intersect at a single (x, y, z). Unique solution.",
    coeffs: [
      [1, 0, 0, 2],
      [0, 1, 0, 1],
      [0, 0, 1, 3],
    ],
  },
  {
    id: "no-solution",
    label: "No common point",
    blurb:
      "Two planes are parallel, the third cuts across — no triple (x, y, z) satisfies all three.",
    coeffs: [
      [1, 0, 0, 2],
      [1, 0, 0, 5],
      [0, 1, 0, 1],
    ],
  },
  {
    id: "line-of-solutions",
    label: "A whole line",
    blurb:
      "Two planes are parallel, third is parallel to both — they share an entire line of points.",
    coeffs: [
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [0, 1, 0, 2],
    ],
  },
  {
    id: "all-coincident",
    label: "All the same plane",
    blurb:
      "All three equations describe the exact same plane — infinitely many (x, y, z) lie on it.",
    coeffs: [
      [1, 0, 0, 1],
      [2, 0, 0, 2],
      [3, 0, 0, 3],
    ],
  },
];

function PlaneMesh({
  normal,
  d,
  color,
  opacity = 0.3,
  label,
  visible = true,
}: {
  normal: [number, number, number];
  d: number;
  color: string;
  opacity?: number;
  label?: string;
  visible?: boolean;
}) {
  const nLen = Math.hypot(normal[0], normal[1], normal[2]);
  if (nLen < 0.01 || !visible) return null;
  const n: [number, number, number] = [
    normal[0] / nLen,
    normal[1] / nLen,
    normal[2] / nLen,
  ];
  const center: [number, number, number] = [n[0] * d, n[1] * d, n[2] * d];

  let u: [number, number, number];
  if (Math.abs(n[2]) < 0.9) {
    u = [n[1], -n[0], 0];
  } else {
    u = [n[2], 0, -n[0]];
  }
  const uLen = Math.hypot(u[0], u[1], u[2]);
  u = [u[0] / uLen, u[1] / uLen, u[2] / uLen];
  const v: [number, number, number] = [
    n[1] * u[2] - n[2] * u[1],
    n[2] * u[0] - n[0] * u[2],
    n[0] * u[1] - n[1] * u[0],
  ];

  const S = 5;
  const corners: [number, number, number][] = [
    [
      center[0] - S * u[0] - S * v[0],
      center[1] - S * u[1] - S * v[1],
      center[2] - S * u[2] - S * v[2],
    ],
    [
      center[0] + S * u[0] - S * v[0],
      center[1] + S * u[1] - S * v[1],
      center[2] + S * u[2] - S * v[2],
    ],
    [
      center[0] + S * u[0] + S * v[0],
      center[1] + S * u[1] + S * v[1],
      center[2] + S * u[2] + S * v[2],
    ],
    [
      center[0] - S * u[0] + S * v[0],
      center[1] - S * u[1] + S * v[1],
      center[2] - S * u[2] + S * v[2],
    ],
  ];

  return (
    <group>
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(corners.flat()), 3]}
          />
          <bufferAttribute
            attach="attributes-normal"
            args={[new Float32Array(corners.flat()), 3]}
          />
          <bufferAttribute
            attach="attributes-index"
            args={[new Uint16Array([0, 1, 2, 0, 2, 3]), 1]}
          />
        </bufferGeometry>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {label && (
        <Text
          position={[center[0] * 1.15, center[1] * 1.15, center[2] * 1.15]}
          fontSize={0.22}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

function EquationDisplay({
  rows,
  highlight,
}: {
  rows: [number, number, number, number][];
  highlight?: "none" | "infinite" | "unique";
}) {
  const fmt = (v: number) => {
    if (Math.abs(v) < 1e-6) return "0";
    const rounded = Math.round(v * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
  };
  return (
    <div className="bg-card border border-line rounded-xl p-3 font-mono text-xs leading-relaxed">
      {rows.map((r, i) => {
        const [a, b, c, d] = r;
        const terms: string[] = [];
        if (a !== 0) terms.push(`${fmt(a)}x`);
        if (b !== 0) terms.push(`${b > 0 && terms.length ? "+" : ""}${fmt(b)}y`);
        if (c !== 0) terms.push(`${c > 0 && terms.length ? "+" : ""}${fmt(c)}z`);
        const lhs = terms.length ? terms.join(" ") : "0";
        const colorClass =
          i === 0
            ? "text-[#e8864a]"
            : i === 1
              ? "text-[#6db3ff]"
              : "text-[#4dd9a8]";
        return (
          <div key={i} className={cn("flex items-center gap-1", colorClass)}>
            <span className="text-faint mr-2 w-4 text-right">
              {i + 1}.
            </span>
            <span>{lhs}</span>
            <span className="text-faint">=</span>
            <span>{fmt(d)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Planes3DPlayground() {
  const [presetId, setPresetId] = useState<PresetId>("single-point");
  const initial = PRESETS[0].coeffs;
  const [a1, setA1] = useState(initial[0][0]);
  const [b1, setB1] = useState(initial[0][1]);
  const [c1, setC1] = useState(initial[0][2]);
  const [d1, setD1] = useState(initial[0][3]);
  const [a2, setA2] = useState(initial[1][0]);
  const [b2, setB2] = useState(initial[1][1]);
  const [c2, setC2] = useState(initial[1][2]);
  const [d2, setD2] = useState(initial[1][3]);
  const [a3, setA3] = useState(initial[2][0]);
  const [b3, setB3] = useState(initial[2][1]);
  const [c3, setC3] = useState(initial[2][2]);
  const [d3, setD3] = useState(initial[2][3]);

  const applyPreset = (id: PresetId) => {
    setPresetId(id);
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    const c = p.coeffs;
    setA1(c[0][0]);
    setB1(c[0][1]);
    setC1(c[0][2]);
    setD1(c[0][3]);
    setA2(c[1][0]);
    setB2(c[1][1]);
    setC2(c[1][2]);
    setD2(c[1][3]);
    setA3(c[2][0]);
    setB3(c[2][1]);
    setC3(c[2][2]);
    setD3(c[2][3]);
  };

  const onSliderChange = () => setPresetId("custom");

  // Ref handle for the OrbitControls instance. drei's typed ref is too
// strict for our needs — we only need to read .object, .target, and
// call .update() to do programmatic zoom / reset.
type OrbitHandle = {
  object: THREE.PerspectiveCamera;
  target: THREE.Vector3;
  update(): void;
};

  const controlsRef = useRef<OrbitHandle | null>(null);
  const DEFAULT_CAMERA_POS: [number, number, number] = [6, 5, 7];

  const zoom = (factor: number) => {
    const c = controlsRef.current;
    if (!c) return;
    const cam = c.object;
    const dir = new THREE.Vector3()
      .subVectors(cam.position, c.target)
      .normalize();
    const dist = cam.position.distanceTo(c.target) * factor;
    cam.position.copy(c.target).add(dir.multiplyScalar(dist));
    c.update();
  };

  const resetView = () => {
    const c = controlsRef.current;
    if (!c) return;
    const cam = c.object;
    cam.position.set(...DEFAULT_CAMERA_POS);
    c.target.set(0, 0, 0);
    c.update();
  };

  const rows: [number, number, number, number][] = [
    [a1, b1, c1, d1],
    [a2, b2, c2, d2],
    [a3, b3, c3, d3],
  ];

  const solution = useMemo(() => {
    const A = [
      [a1, b1, c1],
      [a2, b2, c2],
      [a3, b3, c3],
    ];
    const b = [d1, d2, d3];
    const aug = A.map((row, i) => [...row, b[i]]);
    const { rref, pivots } = matRref(aug);
    const n = 3;
    for (const row of rref) {
      const leftZero = row.slice(0, n).every((v) => Math.abs(v) < 1e-9);
      const rightNonzero = Math.abs(row[n] ?? 0) > 1e-9;
      if (leftZero && rightNonzero) return { type: "none" as const };
    }
    if (pivots.length < 3)
      return { type: "infinite" as const, rank: pivots.length };
    const sol = [0, 0, 0];
    for (let i = 0; i < pivots.length; i++) {
      const col = pivots[i];
      if (col !== undefined) {
        sol[col] = rref[i]?.[n] ?? 0;
      }
    }
    return { type: "unique" as const, sol };
  }, [a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3]);

  // For the "line of solutions" case, draw a line along the free variable.
  const linePoints = useMemo<[number, number, number][] | null>(() => {
    if (solution.type !== "infinite" || solution.rank !== 2) return null;
    // Free variable: the column NOT in pivots.
    const pivotsSet = new Set([0, 1, 2].slice(0, solution.rank));
    // Pivots are always the first `rank` columns after rref, so the free
    // variable is column `rank`. Compute the line parametrically:
    // x_i = rref[i][n] - rref[i][free]*t for pivot rows, x_free = t.
    const aug = [
      [a1, b1, c1, d1],
      [a2, b2, c2, d2],
      [a3, b3, c3, d3],
    ];
    const { rref } = matRref(aug);
    const free = solution.rank;
    const pts: [number, number, number][] = [];
    for (let t = -3; t <= 3; t += 0.5) {
      const pt: [number, number, number] = [0, 0, 0];
      for (let row = 0; row < solution.rank; row++) {
        const col = row;
        pt[col] = (rref[row]?.[3] ?? 0) - (rref[row]?.[free] ?? 0) * t;
      }
      pt[free] = t;
      pts.push(pt);
    }
    return pts;
  }, [
    solution,
    a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3,
  ]);

  const activePreset = PRESETS.find((p) => p.id === presetId);

  return (
    <div className="space-y-5">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs border transition font-medium",
              presetId === p.id
                ? "bg-accent/15 border-accent/40 text-accent"
                : "border-line bg-elev/40 text-dim hover:text-ink hover:bg-elev",
            )}
          >
            {p.label}
          </button>
        ))}
        {presetId === "custom" && (
          <span className="px-4 py-2 rounded-lg text-xs border border-warn/40 bg-warn/10 text-warn font-medium">
            Custom
          </span>
        )}
      </div>

      {activePreset && presetId !== "custom" && (
        <p className="text-xs text-dim leading-relaxed">{activePreset.blurb}</p>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        {/* 3D viewport */}
        <div className="bg-card border border-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-ink">
              Three planes in 3D — where do they meet?
            </h3>
            <span className="text-[10px] text-faint font-mono">
              drag · scroll · pinch
            </span>
          </div>
          <div className="bg-canvas border border-line rounded-lg h-[460px] overflow-hidden relative">
            <Canvas camera={{ position: [...DEFAULT_CAMERA_POS], fov: 50 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 5, 5]} intensity={0.7} />
              <directionalLight position={[-3, 2, -2]} intensity={0.3} />
              <gridHelper args={[6, 6, "#3a3530", "#2a2520"]} />

              {/* Numbered axes with tick marks */}
              <AxesWithTicks />

              {/* Axis end-labels (large) */}
              <Html position={[3.4, 0, 0]} center>
                <span className="text-sm font-mono font-bold text-[#ff8a8a]">
                  x
                </span>
              </Html>
              <Html position={[0, 3.4, 0]} center>
                <span className="text-sm font-mono font-bold text-[#8aff8a]">
                  y
                </span>
              </Html>
              <Html position={[0, 0, 3.4]} center>
                <span className="text-sm font-mono font-bold text-[#8ab4ff]">
                  z
                </span>
              </Html>

              <PlaneMesh
                normal={[a1, b1, c1]}
                d={d1}
                color="#e8864a"
                label="P1"
              />
              <PlaneMesh
                normal={[a2, b2, c2]}
                d={d2}
                color="#6db3ff"
                label="P2"
              />
              <PlaneMesh
                normal={[a3, b3, c3]}
                d={d3}
                color="#4dd9a8"
                label="P3"
              />
              {solution.type === "unique" && (
                <group
                  position={[
                    solution.sol[0],
                    solution.sol[1],
                    solution.sol[2],
                  ]}
                >
                  <mesh>
                    <sphereGeometry args={[0.15, 24, 24]} />
                    <meshStandardMaterial
                      color="#ffcc66"
                      emissive="#ffcc66"
                      emissiveIntensity={0.9}
                    />
                  </mesh>
                  <Html center distanceFactor={8}>
                    <span className="text-[11px] font-mono text-[#ffcc66] font-semibold whitespace-nowrap bg-black/70 px-1.5 py-0.5 rounded">
                      ({solution.sol.map((s) => s.toFixed(2)).join(", ")})
                    </span>
                  </Html>
                </group>
              )}
              {linePoints && (
                <Line
                  points={linePoints}
                  color="#ffcc66"
                  lineWidth={3}
                  dashed
                  dashSize={0.15}
                  gapSize={0.1}
                />
              )}
              <OrbitControls
                ref={controlsRef as unknown as React.ComponentProps<typeof OrbitControls>["ref"]}
                enablePan={false}
                minDistance={3}
                maxDistance={20}
              />
            </Canvas>

            {/* Legend (top-left) */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur rounded-lg px-3 py-2 text-[10px] font-mono space-y-1 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#e8864a]" />
                <span className="text-[#e8864a]">P1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#6db3ff]" />
                <span className="text-[#6db3ff]">P2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#4dd9a8]" />
                <span className="text-[#4dd9a8]">P3</span>
              </div>
              <div className="flex items-center gap-2 border-t border-line pt-1 mt-1">
                <span className="w-3 h-3 rounded-full bg-[#ffcc66]" />
                <span className="text-[#ffcc66]">solution</span>
              </div>
            </div>

            {/* Viewport controls (bottom-right) */}
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur rounded-lg p-1 flex flex-col gap-1 pointer-events-auto">
              <button
                type="button"
                aria-label="Zoom in"
                title="Zoom in"
                onClick={() => zoom(0.75)}
                className="w-8 h-8 rounded-md flex items-center justify-center text-faint hover:bg-white/10 hover:text-ink transition"
              >
                <ZoomIn size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                title="Zoom out"
                onClick={() => zoom(1.35)}
                className="w-8 h-8 rounded-md flex items-center justify-center text-faint hover:bg-white/10 hover:text-ink transition"
              >
                <ZoomOut size={14} aria-hidden="true" />
              </button>
              <div className="h-px bg-white/10 my-0.5" />
              <button
                type="button"
                aria-label="Reset view"
                title="Reset view"
                onClick={resetView}
                className="w-8 h-8 rounded-md flex items-center justify-center text-faint hover:bg-white/10 hover:text-ink transition"
              >
                <Maximize2 size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Right column: equations + status */}
        <div className="space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-faint mb-2 font-medium">
              The system
            </div>
            <EquationDisplay rows={rows} />
          </div>

          <div
            className={cn(
              "rounded-xl p-4 border leading-relaxed",
              solution.type === "unique" &&
                "bg-accent/10 border-accent/30 text-accent",
              solution.type === "infinite" &&
                "bg-warn/10 border-warn/30 text-warn",
              solution.type === "none" &&
                "bg-warn/10 border-warn/30 text-warn",
            )}
          >
            {solution.type === "unique" && (
              <>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-2 font-semibold">
                  <Sparkles size={11} aria-hidden="true" />
                  Unique solution
                </div>
                <div className="text-sm">
                  Three planes meet at{" "}
                  <span className="font-mono font-semibold">
                    ({solution.sol.map((s) => s.toFixed(2)).join(", ")})
                  </span>
                  .
                </div>
                <p className="text-[11px] mt-2 opacity-80">
                  That gold sphere <em>is</em> the (x, y, z) that satisfies
                  all three equations simultaneously.
                </p>
              </>
            )}
            {solution.type === "infinite" && (
              <>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-2 font-semibold">
                  <InfIcon size={11} aria-hidden="true" />
                  Infinitely many solutions
                </div>
                <div className="text-sm">
                  Rank = {solution.rank}. Two equations are redundant or
                  parallel — every point on the dashed line satisfies all
                  three.
                </div>
              </>
            )}
            {solution.type === "none" && (
              <>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-2 font-semibold">
                  <AlertTriangle size={11} aria-hidden="true" />
                  No solution
                </div>
                <div className="text-sm">
                  The three planes contradict each other — there is no (x, y, z)
                  that lies on all three.
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Manual sliders — for exploration */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card border border-line rounded-xl p-4">
          <div
            className="text-[10px] uppercase tracking-wider mb-3 font-semibold"
            style={{ color: "#e8864a" }}
          >
            Plane 1 (orange)
          </div>
          <Slider label="a" value={a1} min={-3} max={3} step={0.1} onChange={(v) => { setA1(v); onSliderChange(); }} />
          <Slider label="b" value={b1} min={-3} max={3} step={0.1} onChange={(v) => { setB1(v); onSliderChange(); }} />
          <Slider label="c" value={c1} min={-3} max={3} step={0.1} onChange={(v) => { setC1(v); onSliderChange(); }} />
          <Slider label="d" value={d1} min={-3} max={3} step={0.1} onChange={(v) => { setD1(v); onSliderChange(); }} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div
            className="text-[10px] uppercase tracking-wider mb-3 font-semibold"
            style={{ color: "#6db3ff" }}
          >
            Plane 2 (blue)
          </div>
          <Slider label="a" value={a2} min={-3} max={3} step={0.1} onChange={(v) => { setA2(v); onSliderChange(); }} />
          <Slider label="b" value={b2} min={-3} max={3} step={0.1} onChange={(v) => { setB2(v); onSliderChange(); }} />
          <Slider label="c" value={c2} min={-3} max={3} step={0.1} onChange={(v) => { setC2(v); onSliderChange(); }} />
          <Slider label="d" value={d2} min={-3} max={3} step={0.1} onChange={(v) => { setD2(v); onSliderChange(); }} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div
            className="text-[10px] uppercase tracking-wider mb-3 font-semibold"
            style={{ color: "#4dd9a8" }}
          >
            Plane 3 (green)
          </div>
          <Slider label="a" value={a3} min={-3} max={3} step={0.1} onChange={(v) => { setA3(v); onSliderChange(); }} />
          <Slider label="b" value={b3} min={-3} max={3} step={0.1} onChange={(v) => { setB3(v); onSliderChange(); }} />
          <Slider label="c" value={c3} min={-3} max={3} step={0.1} onChange={(v) => { setC3(v); onSliderChange(); }} />
          <Slider label="d" value={d3} min={-3} max={3} step={0.1} onChange={(v) => { setD3(v); onSliderChange(); }} />
        </div>
      </div>
    </div>
  );
}

// Numbered axes: each axis line + tick marks at integer positions
// from -3 to +3, with a small number label next to each tick.
function AxesWithTicks() {
  const ticks = [-3, -2, -1, 1, 2, 3];
  return (
    <group>
      {/* Axis lines */}
      <Line
        points={[
          [-3, 0, 0],
          [3, 0, 0],
        ]}
        color="#ff8a8a"
        lineWidth={2}
      />
      <Line
        points={[
          [0, -3, 0],
          [0, 3, 0],
        ]}
        color="#8aff8a"
        lineWidth={2}
      />
      <Line
        points={[
          [0, 0, -3],
          [0, 0, 3],
        ]}
        color="#8ab4ff"
        lineWidth={2}
      />

      {/* Tick marks (small perpendicular lines) + number labels */}
      {ticks.map((t) => (
        <group key={`x-${t}`}>
          <Line
            points={[
              [t, -0.08, 0],
              [t, 0.08, 0],
            ]}
            color="#ff8a8a"
            lineWidth={2}
          />
          <Html
            position={[t, -0.32, 0]}
            center
            style={{ pointerEvents: "none" }}
          >
            <span className="text-[10px] font-mono text-[#ff8a8a]/90 leading-none">
              {t}
            </span>
          </Html>
        </group>
      ))}
      {ticks.map((t) => (
        <group key={`y-${t}`}>
          <Line
            points={[
              [-0.08, t, 0],
              [0.08, t, 0],
            ]}
            color="#8aff8a"
            lineWidth={2}
          />
          <Html
            position={[-0.36, t, 0]}
            center
            style={{ pointerEvents: "none" }}
          >
            <span className="text-[10px] font-mono text-[#8aff8a]/90 leading-none">
              {t}
            </span>
          </Html>
        </group>
      ))}
      {ticks.map((t) => (
        <group key={`z-${t}`}>
          <Line
            points={[
              [-0.08, 0, t],
              [0.08, 0, t],
            ]}
            color="#8ab4ff"
            lineWidth={2}
          />
          <Html
            position={[-0.36, 0, t]}
            center
            style={{ pointerEvents: "none" }}
          >
            <span className="text-[10px] font-mono text-[#8ab4ff]/90 leading-none">
              {t}
            </span>
          </Html>
        </group>
      ))}

      {/* Origin marker */}
      <Html position={[0, 0, 0]} center style={{ pointerEvents: "none" }}>
        <span className="text-[10px] font-mono text-faint leading-none">
          0
        </span>
      </Html>
    </group>
  );
}