import { describe, expect, it } from "vitest";
import {
  GAZE_EYE_DISTANCE_MIN,
  isLookingAway,
  laplacianVariance,
  lumaStdDev,
  meanAbsDiff,
  toGrayscale,
  type DetectedFace,
} from "@/lib/proctor-vision";

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/** Builds RGBA pixel data from a per-pixel grey value function. */
function rgba(
  width: number,
  height: number,
  valueAt: (x: number, y: number) => number,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = valueAt(x, y);
      const o = (y * width + x) * 4;
      data[o] = v;
      data[o + 1] = v;
      data[o + 2] = v;
      data[o + 3] = 255;
    }
  }
  return data;
}

/** A face looking straight at the camera: eyes symmetric about the nose,
 *  both ears equidistant. Coordinates are in image pixels. */
function forwardFace(): DetectedFace {
  return {
    box: { xMin: 100, yMin: 100, width: 200, height: 200 },
    keypoints: [
      { x: 150, y: 160, name: "rightEye" },
      { x: 250, y: 160, name: "leftEye" },
      { x: 200, y: 200, name: "noseTip" },
      { x: 110, y: 175, name: "rightEarTragion" },
      { x: 290, y: 175, name: "leftEarTragion" },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────

describe("toGrayscale", () => {
  it("applies Rec.601 luma weights", () => {
    // Pure red, green, blue in a 3x1 strip.
    const data = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255,
    ]);
    const gray = toGrayscale(data, 3, 1);
    expect(gray[0]).toBeCloseTo(0.299 * 255, 3);
    expect(gray[1]).toBeCloseTo(0.587 * 255, 3);
    expect(gray[2]).toBeCloseTo(0.114 * 255, 3);
  });

  it("returns one sample per pixel, not per channel", () => {
    expect(toGrayscale(rgba(8, 5, () => 0), 8, 5)).toHaveLength(40);
  });
});

describe("laplacianVariance", () => {
  it("is zero for a uniform frame", () => {
    const gray = toGrayscale(rgba(16, 16, () => 128), 16, 16);
    expect(laplacianVariance(gray, 16, 16)).toBeCloseTo(0, 6);
  });

  it("is zero for a smooth gradient (no edges)", () => {
    const gray = toGrayscale(rgba(16, 16, (x) => x * 8), 16, 16);
    expect(laplacianVariance(gray, 16, 16)).toBeCloseTo(0, 6);
  });

  it("is large for a sharp checkerboard", () => {
    const gray = toGrayscale(
      rgba(16, 16, (x, y) => ((x + y) % 2 === 0 ? 0 : 255)),
      16,
      16,
    );
    // A hard checkerboard is the maximum-edge-energy case; it must land
    // far above the 250 threshold the detector uses.
    expect(laplacianVariance(gray, 16, 16)).toBeGreaterThan(250);
  });

  it("ranks a blurred edge below a sharp edge", () => {
    const sharp = toGrayscale(rgba(32, 32, (x) => (x < 16 ? 0 : 255)), 32, 32);
    // Same edge, ramped over 8px instead of 1.
    const blurred = toGrayscale(
      rgba(32, 32, (x) => Math.min(255, Math.max(0, (x - 12) * 32))),
      32,
      32,
    );
    expect(laplacianVariance(blurred, 32, 32)).toBeLessThan(
      laplacianVariance(sharp, 32, 32),
    );
  });

  it("returns 0 rather than NaN when there is no interior", () => {
    expect(laplacianVariance(new Float32Array(4), 2, 2)).toBe(0);
    expect(laplacianVariance(new Float32Array(0), 0, 0)).toBe(0);
  });

  it("indexes the buffer with the buffer's own dimensions", () => {
    // Regression guard for the bug in vibe's original worker, which
    // built the grayscale buffer at full size but walked it with
    // half-scaled width/height. A tall non-square frame with a purely
    // vertical edge has a well-defined answer; reading it with the wrong
    // stride smears the edge across rows and changes the result.
    const w = 8;
    const h = 32;
    const gray = toGrayscale(rgba(w, h, (x) => (x < 4 ? 0 : 255)), w, h);
    const correct = laplacianVariance(gray, w, h);
    const wrongStride = laplacianVariance(gray, w / 2, h / 2);
    expect(correct).not.toBeCloseTo(wrongStride, 3);
  });
});

describe("isLookingAway", () => {
  it("accepts a face looking straight ahead", () => {
    expect(isLookingAway(forwardFace())).toBe(false);
  });

  it("flags a yawed head where the eyes have converged", () => {
    const face = forwardFace();
    // Eyes 20px apart instead of 100 — the projection you get from a
    // strong head turn.
    face.keypoints[0]!.x = 195;
    face.keypoints[1]!.x = 215;
    expect(isLookingAway(face)).toBe(true);
  });

  it("flags a nose that has swung off the eye midpoint", () => {
    const face = forwardFace();
    face.keypoints[2]!.x = 246; // nose almost on top of the left eye
    expect(isLookingAway(face)).toBe(true);
  });

  it("flags one ear being much closer than the other", () => {
    const face = forwardFace();
    face.keypoints[3]!.x = 148; // right ear collapsed toward the eye
    expect(isLookingAway(face)).toBe(true);
  });

  it("does not flag on missing ears alone", () => {
    const face = forwardFace();
    face.keypoints = face.keypoints.filter(
      (k) => !k.name?.includes("EarTragion"),
    );
    expect(isLookingAway(face)).toBe(false);
  });

  it("returns false when required keypoints are absent", () => {
    expect(isLookingAway({ box: forwardFace().box, keypoints: [] })).toBe(false);
  });

  it("returns false for a degenerate box rather than dividing by zero", () => {
    const face = forwardFace();
    face.box = { xMin: 0, yMin: 0, width: 0, height: 0 };
    expect(isLookingAway(face)).toBe(false);
  });

  it("holds the threshold constant that vibe shipped", () => {
    expect(GAZE_EYE_DISTANCE_MIN).toBe(0.35);
  });
});

describe("lumaStdDev", () => {
  it("is zero for a covered lens (flat frame)", () => {
    expect(lumaStdDev(new Uint8ClampedArray(64).fill(12))).toBeCloseTo(0, 6);
  });

  it("is well above the covered threshold for a real scene", () => {
    const luma = Array.from({ length: 256 }, (_, i) => (i * 37) % 256);
    // The detector treats < 6 as "no detail in frame".
    expect(lumaStdDev(luma)).toBeGreaterThan(6);
  });

  it("handles an empty buffer", () => {
    expect(lumaStdDev([])).toBe(0);
  });
});

describe("meanAbsDiff", () => {
  it("is zero for identical frames", () => {
    const a = Array.from({ length: 100 }, (_, i) => i);
    expect(meanAbsDiff(a, a.slice())).toBe(0);
  });

  it("equals the constant offset between two frames", () => {
    const a = new Array(50).fill(10);
    const b = new Array(50).fill(60);
    expect(meanAbsDiff(a, b)).toBeCloseTo(50, 6);
  });

  it("exceeds the motion threshold on a full scene swap", () => {
    const dark = new Array(256).fill(0);
    const bright = new Array(256).fill(255);
    // The detector reports motion above 45.
    expect(meanAbsDiff(dark, bright)).toBeGreaterThan(45);
  });

  it("stays under the threshold for a small shift", () => {
    const a = Array.from({ length: 256 }, (_, i) => i % 256);
    const b = a.map((v) => Math.min(255, v + 3));
    expect(meanAbsDiff(a, b)).toBeLessThan(45);
  });

  it("handles empty input", () => {
    expect(meanAbsDiff([], [])).toBe(0);
  });
});
