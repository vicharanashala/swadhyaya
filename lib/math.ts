// Pure functional math for linear algebra visualization.
// All operations return NEW objects (no mutation in user-visible types).
// Tested by tests/math.test.ts.

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];
export type Mat2 = readonly [Vec2, Vec2]; // [[a,b],[c,d]] where columns are basis images
export type Mat3 = readonly [Vec3, Vec3, Vec3];
export type Mat = number[][]; // generic m×n

// ============================================================
// VEC2
// ============================================================
export const v2 = (x: number, y: number): Vec2 => [x, y];
export const v2add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];
export const v2sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]];
export const v2scale = (a: Vec2, s: number): Vec2 => [a[0] * s, a[1] * s];
export const v2dot = (a: Vec2, b: Vec2): number => a[0] * b[0] + a[1] * b[1];
export const v2length = (a: Vec2): number => Math.hypot(a[0], a[1]);
export const v2normalize = (a: Vec2): Vec2 => {
  const l = v2length(a);
  return l === 0 ? [0, 0] : [a[0] / l, a[1] / l];
};
export const v2angle = (a: Vec2): number => Math.atan2(a[1], a[0]);
export const v2perp = (a: Vec2): Vec2 => [-a[1], a[0]];
export const v2lerp = (a: Vec2, b: Vec2, t: number): Vec2 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

// ============================================================
// MAT2 — columns are where i-hat and j-hat go
// ============================================================
export const m2 = (a: number, b: number, c: number, d: number): Mat2 => [
  [a, b],
  [c, d],
];
// [[a,b],[c,d]] means: i-hat → (a,c), j-hat → (b,d)
export const m2identity = (): Mat2 => [[1, 0], [0, 1]];
export const m2mul = (A: Mat2, B: Mat2): Mat2 => {
  const [[a, b], [c, d]] = A;
  const [[e, f], [g, h]] = B;
  return [
    [a * e + b * g, a * f + b * h],
    [c * e + d * g, c * f + d * h],
  ];
};
export const m2mulVec = (A: Mat2, v: Vec2): number[] => {
  const [[a, b], [c, d]] = A;
  return [a * v[0] + b * v[1], c * v[0] + d * v[1]];
};
export const m2transpose = (A: Mat2): Mat2 => {
  const [[a, b], [c, d]] = A;
  return [[a, c], [b, d]];
};
export const m2det = (A: Mat2): number => {
  const [[a, b], [c, d]] = A;
  return a * d - b * c;
};
export const m2inv = (A: Mat2): Mat2 | null => {
  const det = m2det(A);
  if (Math.abs(det) < 1e-10) return null;
  const [[a, b], [c, d]] = A;
  return [[d / det, -b / det], [-c / det, a / det]];
};
export const m2trace = (A: Mat2): number => {
  return A[0][0] + A[1][1];
};
// Eigen for 2x2 — closed form
export const m2eigen = (A: Mat2): { values: [number, number]; vectors: [Vec2, Vec2] } | null => {
  const tr = m2trace(A);
  const det = m2det(A);
  const disc = tr * tr - 4 * det;
  if (disc < 0) return null; // complex
  const sqrtD = Math.sqrt(disc);
  const l1 = (tr + sqrtD) / 2;
  const l2 = (tr - sqrtD) / 2;
  // For each eigenvalue, find eigenvector (A - λI)v = 0
  const eigenvec = (lambda: number): Vec2 => {
    const [[a, b], [c, d]] = A;
    // Row reduce [[a-λ, b],[c, d-λ]]
    if (Math.abs(b) > 1e-9) return v2normalize([-b, a - lambda]);
    if (Math.abs(c) > 1e-9) return v2normalize([d - lambda, -c]);
    return [1, 0];
  };
  return { values: [l1, l2], vectors: [eigenvec(l1), eigenvec(l2)] };
};

// ============================================================
// Common named matrices
// ============================================================
export const m2scale = (sx: number, sy: number): Mat2 => [[sx, 0], [0, sy]];
export const m2rotate = (theta: number): Mat2 => [
  [Math.cos(theta), -Math.sin(theta)],
  [Math.sin(theta), Math.cos(theta)],
];
export const m2shear = (kx: number, ky: number): Mat2 => [[1, kx], [ky, 1]];
export const m2reflect = (axis: "x" | "y" | "line"): Mat2 => {
  if (axis === "x") return [[1, 0], [0, -1]];
  if (axis === "y") return [[-1, 0], [0, 1]];
  // reflect across line y=x
  return [[0, 1], [1, 0]];
};
export const m2project = (axis: Vec2): Mat2 => {
  // project onto line through origin with direction `axis`
  const u = v2normalize(axis);
  return [[u[0] * u[0], u[0] * u[1]], [u[0] * u[1], u[1] * u[1]]];
};

// ============================================================
// GENERIC Mat (m × n) — for higher-dim work
// ============================================================
export const matShape = (M: Mat): [number, number] => [
  M.length,
  M[0]?.length ?? 0,
];
export const matZeros = (m: number, n: number): Mat =>
  Array.from({ length: m }, () => new Array(n).fill(0));
export const matIdentity = (n: number): Mat => {
  const M = matZeros(n, n);
  for (let i = 0; i < n; i++) M[i][i] = 1;
  return M;
};
export const matMul = (A: Mat, B: Mat): Mat => {
  const [m, k] = matShape(A);
  const [, n] = matShape(B);
  const C = matZeros(m, n);
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      for (let p = 0; p < k; p++) C[i][j] += A[i][p] * B[p][j];
  return C;
};
export const matMulVec = (A: Mat, v: number[]): number[] => {
  const [m, n] = matShape(A);
  const out = new Array(m).fill(0);
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++) out[i] += A[i][j] * v[j];
  return out;
};
export const matTranspose = (A: Mat): Mat => {
  const [m, n] = matShape(A);
  const T = matZeros(n, m);
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++) T[j][i] = A[i][j];
  return T;
};
export const matDet = (A: Mat): number => {
  const [n] = matShape(A);
  if (n === 1) return A[0][0];
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  if (n === 3) {
    const [a, b, c] = A[0];
    const [d, e, f] = A[1];
    const [g, h, i] = A[2];
    return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  }
  // Laplace expansion — works for n ≤ 5 comfortably
  let det = 0;
  for (let j = 0; j < n; j++) {
    const minor = A.slice(1).map((row) => [...row.slice(0, j), ...row.slice(j + 1)]);
    det += (j % 2 === 0 ? 1 : -1) * A[0][j] * matDet(minor);
  }
  return det;
};

// ============================================================
// ROW-REDUCED ECHELON FORM (Gaussian elimination)
// Returns both RREF and the index of pivot columns
// ============================================================
export const matRref = (M: Mat): { rref: Mat; pivots: number[]; rank: number } => {
  const A = M.map((r) => [...r]);
  const [m, n] = matShape(A);
  const pivots: number[] = [];
  let r = 0;
  for (let c = 0; c < n && r < m; c++) {
    // find pivot
    let pivot = -1;
    for (let i = r; i < m; i++) {
      if (Math.abs(A[i][c]) > 1e-9) {
        pivot = i;
        break;
      }
    }
    if (pivot === -1) continue;
    [A[r], A[pivot]] = [A[pivot], A[r]];
    // scale row
    const pv = A[r][c];
    for (let j = 0; j < n; j++) A[r][j] /= pv;
    // eliminate
    for (let i = 0; i < m; i++) {
      if (i === r) continue;
      const factor = A[i][c];
      if (Math.abs(factor) < 1e-9) continue;
      for (let j = 0; j < n; j++) A[i][j] -= factor * A[r][j];
    }
    pivots.push(c);
    r++;
  }
  return { rref: A, pivots, rank: pivots.length };
};

export const matRank = (M: Mat): number => matRref(M).rank;

// Null space: free variables → param vectors
export const matNullSpace = (M: Mat): Mat => {
  const { rref, pivots } = matRref(M);
  const [m, n] = matShape(M);
  const free = Array.from({ length: n }, (_, i) => !pivots.includes(i));
  const basis: Mat = [];
  for (let j = 0; j < n; j++) {
    if (!free[j]) continue;
    const v = new Array(n).fill(0);
    v[j] = 1;
    for (let i = 0; i < pivots.length; i++) {
      v[pivots[i]] = -rref[i][j];
    }
    basis.push(v);
  }
  return basis;
};

// ============================================================
// EIGEN (power iteration for symmetric matrices, up to k pairs)
// Good enough for visualization. For production, use Jacobi rotation.
// ============================================================
export const matEigenSymmetric = (
  M: Mat,
  k: number = 2,
  iterations: number = 200,
): { values: number[]; vectors: Mat } => {
  const n = matShape(M)[0];
  if (n !== matShape(M)[1]) throw new Error("eigen: square matrix required");
  // Jacobi rotation algorithm
  const A = M.map((r) => [...r]);
  const V = matIdentity(n);
  for (let iter = 0; iter < iterations; iter++) {
    // find off-diagonal max
    let p = 0, q = 1, max = Math.abs(A[0][1]);
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (Math.abs(A[i][j]) > max) {
          max = Math.abs(A[i][j]);
          p = i; q = j;
        }
    if (max < 1e-12) break;
    const theta =
      A[p][p] === A[q][q]
        ? Math.PI / 4
        : 0.5 * Math.atan2(2 * A[p][q], A[p][p] - A[q][q]);
    const c = Math.cos(theta), s = Math.sin(theta);
    // rotate A
    const app = c * c * A[p][p] + 2 * c * s * A[p][q] + s * s * A[q][q];
    const aqq = s * s * A[p][p] - 2 * c * s * A[p][q] + c * c * A[q][q];
    A[p][p] = app; A[q][q] = aqq; A[p][q] = 0; A[q][p] = 0;
    for (let i = 0; i < n; i++) {
      if (i === p || i === q) continue;
      const aip = c * A[i][p] + s * A[i][q];
      const aiq = -s * A[i][p] + c * A[i][q];
      A[i][p] = aip; A[p][i] = aip;
      A[i][q] = aiq; A[q][i] = aiq;
    }
    // rotate V
    for (let i = 0; i < n; i++) {
      const vip = c * V[i][p] + s * V[i][q];
      const viq = -s * V[i][p] + c * V[i][q];
      V[i][p] = vip; V[i][q] = viq;
    }
  }
  const values = A.map((row, i) => row[i]);
  // Sort descending
  const order = values.map((_, i) => i).sort((a, b) => values[b] - values[a]);
  const sortedValues = order.map((i) => values[i]);
  const sortedVectors = order.map((i) => V.map((row) => row[i]));
  return { values: sortedValues.slice(0, k), vectors: sortedVectors };
};

// ============================================================
// SVD — via eigen of M^T M
// M = U Σ V^T
// ============================================================
export const matSVD = (
  M: Mat,
  iterations: number = 100,
): { U: Mat; S: number[]; V: Mat } => {
  const [m, n] = matShape(M);
  // V comes from eigen of M^T M
  const MtM = matMul(matTranspose(M), M);
  const { values, vectors } = matEigenSymmetric(MtM, Math.min(m, n), iterations);
  const S = values.map((v) => Math.sqrt(Math.max(v, 0)));
  const V = vectors; // columns of V are eigenvectors of M^T M
  // U columns: (1/σ) M v_i
  const U: Mat = [];
  for (let i = 0; i < S.length; i++) {
    const col = V.map((row) => row[i]);
    const u = matMulVec(M, col);
    if (S[i] > 1e-9) for (let j = 0; j < u.length; j++) u[j] /= S[i];
    U.push(u);
  }
  // Transpose U so columns become rows
  const Ut = matTranspose(U);
  return { U: Ut, S, V };
};

// ============================================================
// HELPERS for display
// ============================================================
export const fmt = (x: number, d: number = 3): string => {
  if (!isFinite(x) || isNaN(x)) return "—";
  if (Math.abs(x) < 1e-10) return "0";
  const r = Number(x.toFixed(d));
  return r.toString();
};

export const fmtVec = (v: number[]): string =>
  "[" + v.map((x) => fmt(x, 2)).join(", ") + "]";

export const fmtMat = (M: Mat): string => {
  const cols = Math.max(...M.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, j) =>
    Math.max(...M.map((r) => (r[j] !== undefined ? fmt(r[j], 2).length : 0))),
  );
  return M.map(
    (r) =>
      "[" + r.map((x, j) => fmt(x, 2).padStart(widths[j], " ")).join("  ") + "]",
  ).join("\n");
};
