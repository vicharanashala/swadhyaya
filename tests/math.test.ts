import { describe, it, expect } from "vitest";
import {
  v2,
  v2add,
  v2sub,
  v2scale,
  v2dot,
  v2length,
  v2normalize,
  v2perp,
  v2lerp,
  m2,
  m2identity,
  m2mul,
  m2mulVec,
  m2transpose,
  m2det,
  m2inv,
  m2trace,
  m2eigen,
  m2scale,
  m2rotate,
  m2shear,
  m2reflect,
  m2project,
  matZeros,
  matIdentity,
  matMul,
  matMulVec,
  matTranspose,
  matDet,
  matRref,
  matRank,
  matNullSpace,
  matEigenSymmetric,
  matSVD,
  fmt,
  fmtVec,
  fmtMat,
} from "@/lib/math";

const EPS = 1e-9;
const EPS_LOOSE = 1e-6;

const approxEq = (a: number, b: number, eps = EPS_LOOSE) => Math.abs(a - b) < eps;
const approxVec = (a: number[], b: number[], eps = EPS_LOOSE) =>
  a.length === b.length && a.every((v, i) => approxEq(v, b[i] ?? 0, eps));

describe("Vec2", () => {
  it("v2 constructs a vector", () => {
    expect(v2(3, 4)).toEqual([3, 4]);
  });
  it("v2add / v2sub / v2scale", () => {
    expect(v2add([1, 2], [3, 4])).toEqual([4, 6]);
    expect(v2sub([3, 4], [1, 2])).toEqual([2, 2]);
    expect(v2scale([2, 3], 4)).toEqual([8, 12]);
  });
  it("v2dot", () => {
    expect(v2dot([1, 2], [3, 4])).toBe(11);
  });
  it("v2length for 3-4-5 triangle", () => {
    expect(v2length([3, 4])).toBe(5);
  });
  it("v2normalize preserves direction, gives unit length", () => {
    const n = v2normalize([3, 4]);
    expect(approxEq(n[0], 0.6)).toBe(true);
    expect(approxEq(n[1], 0.8)).toBe(true);
    expect(approxEq(v2length(n), 1)).toBe(true);
  });
  it("v2normalize returns zero for zero vector", () => {
    expect(v2normalize([0, 0])).toEqual([0, 0]);
  });
  it("v2perp rotates 90° counterclockwise", () => {
    // Use `Object.is`-insensitive matchers because `0 * -1` can produce `-0`.
    expect(v2perp([1, 0])?.[0]).toBe(-0);
    expect(v2perp([1, 0])?.[1]).toBe(1);
    expect(v2perp([0, 1])?.[0]).toBe(-1);
    expect(v2perp([0, 1])?.[1]).toBe(0);
  });
  it("v2lerp interpolates linearly", () => {
    expect(v2lerp([0, 0], [10, 20], 0.5)).toEqual([5, 10]);
    expect(v2lerp([0, 0], [10, 20], 0)).toEqual([0, 0]);
    expect(v2lerp([0, 0], [10, 20], 1)).toEqual([10, 20]);
  });
});

describe("Mat2 arithmetic", () => {
  it("m2identity is the identity", () => {
    const I = m2identity();
    expect(approxVec(m2mulVec(I, [3, 4]), [3, 4])).toBe(true);
  });
  it("m2mul multiplies two 2x2 matrices correctly", () => {
    const A = m2(1, 2, 3, 4);
    const B = m2(5, 6, 7, 8);
    // AB = [[1*5+2*7, 1*6+2*8], [3*5+4*7, 3*6+4*8]]
    //    = [[19, 22], [43, 50]]
    expect(m2mul(A, B)).toEqual([
      [19, 22],
      [43, 50],
    ]);
  });
  it("m2mul is not commutative in general", () => {
    const A = m2(1, 2, 3, 4);
    const B = m2(5, 6, 7, 8);
    expect(m2mul(A, B)).not.toEqual(m2mul(B, A));
  });
  it("m2mul with identity is identity", () => {
    const A = m2(2, 3, 4, 5);
    expect(m2mul(m2identity(), A)).toEqual([
      [A[0][0], A[0][1]],
      [A[1][0], A[1][1]],
    ]);
  });
  it("m2transpose flips rows and columns", () => {
    expect(m2transpose(m2(1, 2, 3, 4))).toEqual([
      [1, 3],
      [2, 4],
    ]);
  });
  it("m2det for [[1,2],[3,4]] = -2", () => {
    expect(m2det(m2(1, 2, 3, 4))).toBe(-2);
  });
  it("m2trace sums the diagonal", () => {
    expect(m2trace(m2(1, 2, 3, 4))).toBe(5);
  });
  it("m2inv returns the inverse or null when singular", () => {
    const A = m2(4, 7, 2, 6);
    const Ainv = m2inv(A);
    expect(Ainv).not.toBeNull();
    if (Ainv) {
      const product = m2mul(A, Ainv);
      expect(approxVec(m2mulVec(product, [1, 0]), [1, 0])).toBe(true);
      expect(approxVec(m2mulVec(product, [0, 1]), [0, 1])).toBe(true);
    }
    // Singular matrix: det = 0
    expect(m2inv(m2(1, 2, 2, 4))).toBeNull();
  });
  it("m2scale, m2rotate, m2shear, m2reflect, m2project", () => {
    expect(m2scale(3, 4)).toEqual([
      [3, 0],
      [0, 4],
    ]);
    const r = m2rotate(Math.PI / 2);
    expect(approxEq(r[0][0], 0, 1e-9)).toBe(true);
    expect(approxEq(r[0][1], -1, 1e-9)).toBe(true);
    expect(approxEq(r[1][0], 1, 1e-9)).toBe(true);
    expect(m2shear(2, 3)).toEqual([
      [1, 2],
      [3, 1],
    ]);
    expect(m2reflect("x")).toEqual([
      [1, 0],
      [0, -1],
    ]);
    expect(m2reflect("y")).toEqual([
      [-1, 0],
      [0, 1],
    ]);
    expect(m2reflect("line")).toEqual([
      [0, 1],
      [1, 0],
    ]);
    // Projection onto x-axis
    const px = m2project([1, 0]);
    expect(approxVec(m2mulVec(px, [3, 5]), [3, 0])).toBe(true);
  });
});

describe("Mat2 eigen (closed form)", () => {
  it("eigenvalues/eigenvectors for a symmetric matrix", () => {
    const A = m2(2, 1, 1, 2);
    const result = m2eigen(A);
    expect(result).not.toBeNull();
    if (result) {
      const { values, vectors } = result;
      // trace = 4, det = 3, eigenvalues = 3 and 1
      expect(approxEq(values[0], 3)).toBe(true);
      expect(approxEq(values[1], 1)).toBe(true);
      // eigenvectors: for λ=3, v = (1,1)/√2; for λ=1, v = (1,-1)/√2
      const Av0 = m2mulVec(A, vectors[0]);
      const lv0 = [values[0] * vectors[0][0], values[0] * vectors[0][1]];
      expect(approxVec(Av0, lv0)).toBe(true);
    }
  });
  it("returns null for rotation (complex eigenvalues)", () => {
    // Rotation by 90° has no real eigenvalues
    expect(m2eigen(m2(0, -1, 1, 0))).toBeNull();
  });
  it("handles repeated eigenvalues", () => {
    const A = m2(2, 0, 0, 2); // 2I
    const result = m2eigen(A);
    expect(result).not.toBeNull();
    if (result) {
      expect(approxEq(result.values[0], 2)).toBe(true);
      expect(approxEq(result.values[1], 2)).toBe(true);
    }
  });
});

describe("Generic matrix operations", () => {
  it("matZeros creates correct shape", () => {
    const z = matZeros(2, 3);
    expect(z.length).toBe(2);
    expect(z[0]?.length).toBe(3);
    expect(z.every((r) => r.every((v) => v === 0))).toBe(true);
  });
  it("matIdentity is identity", () => {
    const I = matIdentity(3);
    expect(I).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  });
  it("matMul computes product", () => {
    expect(
      matMul(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ),
    ).toEqual([
      [19, 22],
      [43, 50],
    ]);
  });
  it("matMulVec computes matrix times vector", () => {
    expect(
      matMulVec(
        [
          [1, 2],
          [3, 4],
        ],
        [1, 1],
      ),
    ).toEqual([3, 7]);
  });
  it("matTranspose flips rows and columns", () => {
    expect(
      matTranspose([
        [1, 2, 3],
        [4, 5, 6],
      ]),
    ).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
  });
  it("matDet for 1x1, 2x2, 3x3", () => {
    expect(matDet([[5]])).toBe(5);
    expect(
      matDet([
        [1, 2],
        [3, 4],
      ]),
    ).toBe(-2);
    expect(
      matDet([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 10],
      ]),
    ).toBe(-3);
  });
});

describe("matRref / matRank", () => {
  it("puts a 2x2 system in RREF", () => {
    const result = matRref([
      [2, 4],
      [1, 3],
    ]);
    expect(result.rref).toEqual([
      [1, 0],
      [0, 1],
    ]);
    expect(result.rank).toBe(2);
    expect(result.pivots).toEqual([0, 1]);
  });
  it("detects a rank-deficient matrix", () => {
    const result = matRref([
      [1, 2, 3],
      [2, 4, 6],
      [1, 1, 1],
    ]);
    expect(result.rank).toBe(2);
    expect(result.pivots.length).toBe(2);
  });
  it("matRank equals matRref.rank", () => {
    expect(
      matRank([
        [1, 2],
        [2, 4],
      ]),
    ).toBe(1);
  });
  it("produces the same RREF regardless of starting order", () => {
    const a = matRref([
      [1, 2, 3],
      [4, 5, 6],
    ]).rref;
    const b = matRref([
      [4, 5, 6],
      [1, 2, 3],
    ]).rref;
    // Compare numerically — floating-point subtractions can produce `-0`.
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < (a[i]?.length ?? 0); j++) {
        expect(Math.abs((a[i]?.[j] ?? 0) - (b[i]?.[j] ?? 0))).toBeLessThan(1e-9);
      }
    }
  });
});

describe("matNullSpace", () => {
  it("finds the null space of a rank-1 matrix", () => {
    // [1 2; 2 4] has null space {(-2, 1)} (up to scalar)
    const ns = matNullSpace([
      [1, 2],
      [2, 4],
    ]);
    expect(ns.length).toBe(1);
    const v = ns[0];
    expect(v).toBeDefined();
    if (v) {
      // A * v should be ~0
      const result = matMulVec(
        [
          [1, 2],
          [2, 4],
        ],
        v,
      );
      expect(approxEq(result[0] ?? 0, 0)).toBe(true);
      expect(approxEq(result[1] ?? 0, 0)).toBe(true);
    }
  });
  it("returns empty array for full-rank square matrix", () => {
    expect(
      matNullSpace([
        [1, 0],
        [0, 1],
      ]),
    ).toEqual([]);
  });
});

describe("matEigenSymmetric (Jacobi)", () => {
  it("finds eigenvalues of a 2x2 symmetric matrix", () => {
    const result = matEigenSymmetric(
      [
        [2, 1],
        [1, 2],
      ],
      2,
      100,
    );
    expect(result.values.length).toBe(2);
    // eigenvalues of [[2,1],[1,2]] are 1 and 3
    const sorted = [...result.values].sort((a, b) => a - b);
    expect(approxEq(sorted[0] ?? 0, 1)).toBe(true);
    expect(approxEq(sorted[1] ?? 0, 3)).toBe(true);
  });
  it("eigenvectors satisfy A v ≈ λ v", () => {
    const A = [
      [2, 1],
      [1, 2],
    ];
    const result = matEigenSymmetric(A, 2, 100);
    // result.vectors is laid out column-major: result.vectors[i] is the
    // i-th eigenvector (a column of V). Read it directly.
    for (let i = 0; i < result.values.length; i++) {
      const v = result.vectors[i] ?? [0, 0];
      const v0 = v[0] ?? 0;
      const v1 = v[1] ?? 0;
      const Av = matMulVec(A, v);
      const lv = [(result.values[i] ?? 0) * v0, (result.values[i] ?? 0) * v1];
      expect(approxVec(Av, lv, 1e-4)).toBe(true);
    }
  });
  it("throws for non-square input", () => {
    expect(() => matEigenSymmetric([[1, 2, 3]])).toThrow();
  });
});

describe("matSVD", () => {
  it("decomposes A = U Σ Vᵀ with consistent shapes", () => {
    const A = [
      [3, 1],
      [1, 3],
    ];
    const result = matSVD(A, 200);
    const m = A.length;
    const n = A[0]?.length ?? 0;
    expect(result.S.length).toBe(Math.min(m, n));
    expect(result.U.length).toBe(m);
    expect(result.U[0]?.length).toBe(Math.min(m, n));
    expect(result.V.length).toBe(n);
    expect(result.V[0]?.length).toBe(Math.min(m, n));
    // All singular values are non-negative
    expect(result.S.every((s) => s >= -EPS)).toBe(true);
  });
  it("singular values of identity are all 1", () => {
    const result = matSVD(
      [
        [1, 0],
        [0, 1],
      ],
      200,
    );
    result.S.forEach((s) => expect(approxEq(s, 1, 1e-6)).toBe(true));
  });
  it("handles rank-deficient matrices without divide-by-zero", () => {
    // All zeros
    const result = matSVD(
      [
        [0, 0],
        [0, 0],
      ],
      100,
    );
    expect(result.S.every((s) => approxEq(s, 0, 1e-6))).toBe(true);
  });
});

describe("Formatting helpers", () => {
  it("fmt renders small numbers as 0", () => {
    expect(fmt(1e-15)).toBe("0");
  });
  it("fmt renders finite numbers within precision", () => {
    expect(fmt(3.14159, 2)).toBe("3.14");
    expect(fmt(-1.5, 1)).toBe("-1.5");
  });
  it("fmt returns em-dash for non-finite", () => {
    expect(fmt(NaN)).toBe("—");
    expect(fmt(Infinity)).toBe("—");
  });
  it("fmtVec brackets a vector", () => {
    expect(fmtVec([1, 2.5, 3])).toBe("[1, 2.5, 3]");
  });
  it("fmtMat brackets each row with aligned columns", () => {
    const result = fmtMat([
      [1, 2],
      [3, 4],
    ]);
    expect(result).toContain("[");
    expect(result.split("\n").length).toBe(2);
  });
});