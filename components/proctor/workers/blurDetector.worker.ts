// Blur-detection worker — ported from vibe's
// frontend/src/components/ai/BlurDetectorWorker.ts.
//
// Variance of the Laplacian: a sharp frame has strong second-derivative
// response at edges, a blurred or covered one does not. Cheap enough to
// run per-frame without a model.
//
// The maths lives in lib/proctor-vision so it can be tested without a
// worker harness. This file is just the message plumbing.
//
// Fixes a bug in the vibe original: it computed the grayscale buffer at
// full resolution but then walked it with `width`/`height` scaled to
// 0.5, so the Laplacian read the wrong pixels and the variance it
// reported was meaningless.

import { laplacianVariance, toGrayscale } from "@/lib/proctor-vision";

export interface BlurRequest {
  imageData: ImageData;
  /** Variance below this counts as blurry. vibe used 250. */
  threshold?: number;
}

self.onmessage = (event: MessageEvent<BlurRequest>) => {
  const { imageData, threshold = 250 } = event.data ?? {};
  if (!imageData) return;

  const gray = toGrayscale(imageData.data, imageData.width, imageData.height);
  const variance = laplacianVariance(gray, imageData.width, imageData.height);

  self.postMessage({ isBlurry: variance < threshold, variance });
};
