// Pure vision heuristics used by the proctoring detectors.
//
// Extracted out of the worker and hook bodies so they can be tested
// directly. Everything here is deterministic and free of DOM, worker and
// React globals — given the same pixels it returns the same verdict.

export interface FaceBox {
  xMin: number;
  yMin: number;
  width: number;
  height: number;
}

export interface FaceKeypoint {
  x: number;
  y: number;
  name?: string;
}

export interface DetectedFace {
  box: FaceBox;
  keypoints: FaceKeypoint[];
}

// ─────────────────────────────────────────────────────────────────────────
// Blur — variance of the Laplacian
// ─────────────────────────────────────────────────────────────────────────

/** Rec.601 luma. Returns one float per pixel. */
export function toGrayscale(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Float32Array {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o]! + 0.587 * data[o + 1]! + 0.114 * data[o + 2]!;
  }
  return gray;
}

/**
 * Variance of the 4-neighbour Laplacian over the interior pixels.
 *
 * High on a sharp frame (strong second-derivative response at edges),
 * near zero on a blurred or flat one. Computed in a single pass via
 * E[x²] − E[x]².
 */
export function laplacianVariance(
  gray: Float32Array,
  width: number,
  height: number,
): number {
  const interior = (width - 2) * (height - 2);
  if (interior <= 0) return 0;

  let sum = 0;
  let sumSq = 0;
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const i = row + x;
      const v =
        gray[i - width]! +
        gray[i - 1]! +
        gray[i + 1]! +
        gray[i + width]! -
        4 * gray[i]!;
      sum += v;
      sumSq += v * v;
    }
  }

  const mean = sum / interior;
  return sumSq / interior - mean * mean;
}

// ─────────────────────────────────────────────────────────────────────────
// Gaze — ported from vibe's FaceDetectors.tsx `isLookingAway`
// ─────────────────────────────────────────────────────────────────────────
//
// As the head yaws away from the camera the eyes converge in image
// space, the nose stops sitting midway between them, and one ear tragion
// falls out of view. Each ratio is normalised against face height so the
// thresholds survive the student sitting closer to or further from the
// screen.

export const GAZE_EYE_DISTANCE_MIN = 0.35;
export const GAZE_NOSE_RATIO_MIN = 0.47;
export const GAZE_EAR_RATIO_MIN = 0.47;

export function isLookingAway(face: DetectedFace): boolean {
  const kp = (name: string) => face.keypoints.find((p) => p.name === name);
  const rightEye = kp("rightEye");
  const leftEye = kp("leftEye");
  const noseTip = kp("noseTip");
  const rightEar = kp("rightEarTragion");
  const leftEar = kp("leftEarTragion");

  if (!rightEye || !leftEye || !noseTip || !face.box) return false;

  const { width: faceWidth, height: faceHeight } = face.box;
  if (faceWidth <= 0 || faceHeight <= 0) return false;

  const eyeDistance =
    (Math.abs(leftEye.x - rightEye.x) / faceWidth / Math.pow(faceHeight, 0.1)) *
    1.7;
  if (eyeDistance < GAZE_EYE_DISTANCE_MIN) return true;

  const noseToLeft = Math.abs(noseTip.x - leftEye.x);
  const noseToRight = Math.abs(noseTip.x - rightEye.x);
  const denom = Math.max(noseToLeft, noseToRight);
  if (denom > 0) {
    const noseRatio =
      (Math.min(noseToLeft, noseToRight) / denom) *
      (Math.pow(faceHeight, 0.2) / Math.pow(200, 0.2));
    if (noseRatio < GAZE_NOSE_RATIO_MIN) return true;
  }

  if (rightEar && leftEar) {
    const rightDist = Math.abs(rightEar.x - rightEye.x);
    const leftDist = Math.abs(leftEar.x - leftEye.x);
    const earDenom = Math.max(rightDist, leftDist);
    if (earDenom > 0) {
      const earRatio =
        (Math.min(rightDist, leftDist) / earDenom) *
        (Math.pow(faceHeight, 0.3) / Math.pow(200, 0.3));
      if (earRatio < GAZE_EAR_RATIO_MIN) return true;
    }
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────
// Camera integrity
// ─────────────────────────────────────────────────────────────────────────

/** Standard deviation of luma. A covered lens has almost none. */
export function lumaStdDev(luma: ArrayLike<number>): number {
  const n = luma.length;
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += luma[i]!;
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (luma[i]! - mean) ** 2;
  return Math.sqrt(varSum / n);
}

/** Mean absolute difference between two equal-length luma thumbnails. */
export function meanAbsDiff(
  a: ArrayLike<number>,
  b: ArrayLike<number>,
): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let diff = 0;
  for (let i = 0; i < n; i++) diff += Math.abs(a[i]! - b[i]!);
  return diff / n;
}
