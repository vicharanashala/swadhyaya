"use client";
import { useState, useMemo, useRef } from "react";
import { fmt } from "@/lib/math";
import { Slider } from "./Slider";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Concept: T2 (3D variant) — Drag a 3×3 matrix, watch a 3D house warp
// The columns of the matrix ARE where the basis vectors (i, j, k) go.

function buildHouseGeometry() {
  const geom = new THREE.BufferGeometry();
  const v = [
    [-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1],
    [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1],
    [0, 1.7, 0],
  ];
  const faces = [
    [4, 5, 6], [4, 6, 7],
    [0, 1, 5], [0, 5, 4],
    [1, 2, 6], [1, 6, 5],
    [2, 3, 7], [2, 7, 6],
    [3, 0, 4], [3, 4, 7],
    [4, 5, 8],
    [5, 6, 8],
    [6, 7, 8],
    [7, 4, 8],
  ];
  const positions: number[] = [];
  v.forEach((p) => positions.push(...(p as number[])));
  const indices: number[] = [];
  faces.forEach((f) => indices.push(...(f as number[])));
  geom.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function applyMatrixToGeometry(
  sourceGeom: THREE.BufferGeometry,
  matrix: number[][],
): Float32Array {
  const positions = sourceGeom.getAttribute("position").array as Float32Array;
  const out = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i] ?? 0;
    const y = positions[i + 1] ?? 0;
    const z = positions[i + 2] ?? 0;
    out[i] = matrix[0]![0]! * x + matrix[0]![1]! * y + matrix[0]![2]! * z;
    out[i + 1] = matrix[1]![0]! * x + matrix[1]![1]! * y + matrix[1]![2]! * z;
    out[i + 2] = matrix[2]![0]! * x + matrix[2]![1]! * y + matrix[2]![2]! * z;
  }
  return out;
}

function HouseMesh({
  matrix,
  color = "#e8864a",
}: {
  matrix: number[][];
  color?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.LineSegments>(null);

  // Build geometry once. Apply the matrix each frame to fresh Float32Arrays.
  const baseGeom = useMemo(buildHouseGeometry, []);
  const edgesGeom = useMemo(
    () => new THREE.EdgesGeometry(baseGeom),
    [baseGeom],
  );

  useFrame(() => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const next = applyMatrixToGeometry(baseGeom, matrix);
    pos.array.set(next);
    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();

    if (wireRef.current) {
      const wirePos = wireRef.current.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      // EdgesGeometry has different length; rebuild position from the
      // deformed source positions by re-running EdgesGeometry on the
      // deformed mesh is too expensive each frame. Instead, project the
      // edges' source positions through the same matrix.
      const edgeSrc = edgesGeom.getAttribute("position").array as Float32Array;
      const deformed = new Float32Array(edgeSrc.length);
      for (let i = 0; i < edgeSrc.length; i += 3) {
        const x = edgeSrc[i] ?? 0;
        const y = edgeSrc[i + 1] ?? 0;
        const z = edgeSrc[i + 2] ?? 0;
        deformed[i] =
          matrix[0]![0]! * x + matrix[0]![1]! * y + matrix[0]![2]! * z;
        deformed[i + 1] =
          matrix[1]![0]! * x + matrix[1]![1]! * y + matrix[1]![2]! * z;
        deformed[i + 2] =
          matrix[2]![0]! * x + matrix[2]![1]! * y + matrix[2]![2]! * z;
      }
      wirePos.array.set(deformed);
      wirePos.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={baseGeom}>
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <lineSegments ref={wireRef} geometry={edgesGeom}>
        <lineBasicMaterial color="#fff" />
      </lineSegments>
    </group>
  );
}

function Axes({ matrix }: { matrix: number[][] }) {
  const origin = [0, 0, 0];
  const iEnd = matrix.map((row) => row[0] ?? 0).slice(0, 3);
  const jEnd = matrix.map((row) => row[1] ?? 0).slice(0, 3);
  const kEnd = matrix.map((row) => row[2] ?? 0).slice(0, 3);
  return (
    <>
      <Arrow3D from={origin} to={iEnd} color="#ff6b7d" />
      <Arrow3D from={origin} to={jEnd} color="#6db3ff" />
      <Arrow3D from={origin} to={kEnd} color="#4dd9a8" />
    </>
  );
}

function Arrow3D({
  from,
  to,
  color,
}: {
  from: number[];
  to: number[];
  color: string;
}) {
  const dir: [number, number, number] = [to[0]! - from[0]!, to[1]! - from[1]!, to[2]! - from[2]!];
  const len = Math.hypot(dir[0], dir[1], dir[2]);
  if (len < 0.01) return null;
  const mid: [number, number, number] = [
    (from[0]! + to[0]!) / 2,
    (from[1]! + to[1]!) / 2,
    (from[2]! + to[2]!) / 2,
  ];
  const axis = new THREE.Vector3(0, 1, 0);
  const target = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(axis, target);

  return (
    <group position={mid} quaternion={quat}>
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, len * 0.85, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, len * 0.5, 0]}>
        <coneGeometry args={[0.07, len * 0.2, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

export function Transform3DPlayground() {
  const [a, setA] = useState(1.5);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [d, setD] = useState(1);
  const [e, setE] = useState(0);
  const [f, setF] = useState(0);
  const [g, setG] = useState(0);
  const [h, setH] = useState(1);
  const [i, setI] = useState(1.5);
  const [showOriginal, setShowOriginal] = useState(true);

  const matrix = useMemo<number[][]>(
    () => [
      [a, b, c],
      [d, e, f],
      [g, h, i],
    ],
    [a, b, c, d, e, f, g, h, i],
  );

  const identity = useMemo<number[][]>(
    () => [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    [],
  );

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-ink">
            3D warp — the matrix is a recipe for warping space
          </h3>
          <label className="text-xs text-dim flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showOriginal}
              onChange={(e) => setShowOriginal(e.target.checked)}
            />
            Show original (grey)
          </label>
        </div>
        <div className="bg-canvas border border-line rounded h-[420px] overflow-hidden">
          <Canvas camera={{ position: [4, 3, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-3, 2, -2]} intensity={0.3} />
            <gridHelper
              args={[6, 6, "#3a3530", "#2a2520"]}
              position={[0, -0.01, 0]}
            />
            {showOriginal && (
              <group>
                <HouseMesh matrix={identity} color="#5a5550" />
                <axesHelper args={[0.5]} />
              </group>
            )}
            <HouseMesh matrix={matrix} color="#e8864a" />
            <Axes matrix={matrix} />
            <OrbitControls
              enablePan={false}
              minDistance={3}
              maxDistance={12}
            />
          </Canvas>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
            3×3 matrix
          </div>
          <div className="font-mono text-sm text-center mb-3 text-ink">
            [{fmt(a, 2)} {fmt(b, 2)} {fmt(c, 2)}]<br />
            [{fmt(d, 2)} {fmt(e, 2)} {fmt(f, 2)}]<br />
            [{fmt(g, 2)} {fmt(h, 2)} {fmt(i, 2)}]
          </div>
          <div className="space-y-2">
            <Slider label="a" value={a} min={-2} max={2} step={0.1} onChange={setA} />
            <Slider label="b" value={b} min={-2} max={2} step={0.1} onChange={setB} />
            <Slider label="c" value={c} min={-2} max={2} step={0.1} onChange={setC} />
            <Slider label="d" value={d} min={-2} max={2} step={0.1} onChange={setD} />
            <Slider label="e" value={e} min={-2} max={2} step={0.1} onChange={setE} />
            <Slider label="f" value={f} min={-2} max={2} step={0.1} onChange={setF} />
            <Slider label="g" value={g} min={-2} max={2} step={0.1} onChange={setG} />
            <Slider label="h" value={h} min={-2} max={2} step={0.1} onChange={setH} />
            <Slider label="i" value={i} min={-2} max={2} step={0.1} onChange={setI} />
          </div>
        </div>

        <div className="bg-elev/40 border border-line rounded-xl p-3 text-xs text-dim leading-relaxed">
          <div className="text-accent font-medium mb-1">
            The columns tell the story:
          </div>
          <div>
            <span className="text-vector font-mono">col 1</span> = where{" "}
            <span className="text-vector">î</span> goes
          </div>
          <div>
            <span className="text-matrix font-mono">col 2</span> = where{" "}
            <span className="text-matrix">ĵ</span> goes
          </div>
          <div>
            <span className="text-transform font-mono">col 3</span> = where{" "}
            <span className="text-transform">k̂</span> goes
          </div>
          <div className="mt-1 text-faint text-[10px]">
            Drag to orbit. The colored axes show exactly where the basis
            vectors land.
          </div>
        </div>
      </div>
    </div>
  );
}