"use client";
import { useState, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { matRref } from "@/lib/math";
import { Slider } from "./Slider";

// Concept L3: Three equations in three unknowns
// "Three planes meeting at a point — or not. The 3D upgrade of L2."

function PlaneMesh({
  normal,
  d,
  color,
  opacity = 0.25,
}: {
  normal: [number, number, number];
  d: number;
  color: string;
  opacity?: number;
}) {
  const nLen = Math.hypot(normal[0], normal[1], normal[2]);
  if (nLen < 0.01) return null;
  const n: [number, number, number] = [normal[0] / nLen, normal[1] / nLen, normal[2] / nLen];
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

  const S = 4;
  const corners: [number, number, number][] = [
    [center[0] - S * u[0] - S * v[0], center[1] - S * u[1] - S * v[1], center[2] - S * u[2] - S * v[2]],
    [center[0] + S * u[0] - S * v[0], center[1] + S * u[1] - S * v[1], center[2] + S * u[2] - S * v[2]],
    [center[0] + S * u[0] + S * v[0], center[1] + S * u[1] + S * v[1], center[2] + S * u[2] + S * v[2]],
    [center[0] - S * u[0] + S * v[0], center[1] - S * u[1] + S * v[1], center[2] - S * u[2] + S * v[2]],
  ];

  return (
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
          attach="index"
          args={[new Uint16Array([0, 1, 2, 0, 2, 3]), 1]}
        />
      </bufferGeometry>
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function Planes3DPlayground() {
  const [a1, setA1] = useState(1);
  const [b1, setB1] = useState(0);
  const [c1, setC1] = useState(0);
  const [d1, setD1] = useState(2);

  const [a2, setA2] = useState(0);
  const [b2, setB2] = useState(1);
  const [c2, setC2] = useState(0);
  const [d2, setD2] = useState(1);

  const [a3, setA3] = useState(0);
  const [b3, setB3] = useState(0);
  const [c3, setC3] = useState(1);
  const [d3, setD3] = useState(3);

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

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-ink">
            Three planes in 3D — where do they meet?
          </h3>
          <span className="text-[10px] text-faint font-mono">
            drag to orbit
          </span>
        </div>
        <div className="bg-canvas border border-line rounded h-[420px] overflow-hidden">
          <Canvas camera={{ position: [5, 4, 6], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.7} />
            <directionalLight position={[-3, 2, -2]} intensity={0.3} />
            <gridHelper args={[6, 6, "#3a3530", "#2a2520"]} />
            <axesHelper args={[1.5]} />
            <PlaneMesh normal={[a1, b1, c1]} d={d1} color="#e8864a" />
            <PlaneMesh normal={[a2, b2, c2]} d={d2} color="#6db3ff" />
            <PlaneMesh normal={[a3, b3, c3]} d={d3} color="#4dd9a8" />
            {solution.type === "unique" && (
              <mesh
                position={[solution.sol[0], solution.sol[1], solution.sol[2]]}
              >
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial
                  color="#ffcc66"
                  emissive="#ffcc66"
                  emissiveIntensity={0.5}
                />
              </mesh>
            )}
            <OrbitControls
              enablePan={false}
              minDistance={4}
              maxDistance={15}
            />
          </Canvas>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div
            className="text-[10px] uppercase tracking-wider mb-2"
            style={{ color: "#e8864a" }}
          >
            Plane 1 (orange)
          </div>
          <Slider label="a" value={a1} min={-3} max={3} step={0.1} onChange={setA1} />
          <Slider label="b" value={b1} min={-3} max={3} step={0.1} onChange={setB1} />
          <Slider label="c" value={c1} min={-3} max={3} step={0.1} onChange={setC1} />
          <Slider label="d" value={d1} min={-3} max={3} step={0.1} onChange={setD1} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div
            className="text-[10px] uppercase tracking-wider mb-2"
            style={{ color: "#6db3ff" }}
          >
            Plane 2 (blue)
          </div>
          <Slider label="a" value={a2} min={-3} max={3} step={0.1} onChange={setA2} />
          <Slider label="b" value={b2} min={-3} max={3} step={0.1} onChange={setB2} />
          <Slider label="c" value={c2} min={-3} max={3} step={0.1} onChange={setC2} />
          <Slider label="d" value={d2} min={-3} max={3} step={0.1} onChange={setD2} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div
            className="text-[10px] uppercase tracking-wider mb-2"
            style={{ color: "#4dd9a8" }}
          >
            Plane 3 (green)
          </div>
          <Slider label="a" value={a3} min={-3} max={3} step={0.1} onChange={setA3} />
          <Slider label="b" value={b3} min={-3} max={3} step={0.1} onChange={setB3} />
          <Slider label="c" value={c3} min={-3} max={3} step={0.1} onChange={setC3} />
          <Slider label="d" value={d3} min={-3} max={3} step={0.1} onChange={setD3} />
        </div>
        <div
          className={`rounded-xl p-3 text-xs leading-relaxed ${
            solution.type === "unique"
              ? "bg-accent/10 border border-accent/30 text-accent"
              : solution.type === "infinite"
                ? "bg-warn/10 border border-warn/30 text-warn"
                : "bg-warn/10 border border-warn/30 text-warn"
          }`}
        >
          {solution.type === "unique" && (
            <>
              Three planes meet at{" "}
              <span className="font-mono">
                ({solution.sol.map((s) => s.toFixed(2)).join(", ")})
              </span>
              . The gold sphere is the unique solution.
            </>
          )}
          {solution.type === "infinite" && (
            <>
              The three planes don&apos;t all meet at a point — system is
              underdetermined (rank = {solution.rank}).
            </>
          )}
          {solution.type === "none" && (
            <>
              The three planes don&apos;t meet at all — they contradict each
              other.
            </>
          )}
        </div>
      </div>
    </div>
  );
}