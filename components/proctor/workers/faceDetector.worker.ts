// Face-detection worker — ported from vibe's
// frontend/src/components/ai/FaceDetectorWorker.ts.
//
// Runs MediaPipe's short-range face detector on the TF.js runtime, off
// the main thread so a 3 fps detection loop never janks the lesson.
//
// Two deliberate differences from the vibe original:
//
//   • vibe reads import.meta.env.VITE_E2E_TESTING to force the CPU
//     backend under test. That is Vite-only, so the flag arrives in the
//     INIT message instead.
//   • vibe lets the model URL default to tfhub.dev. We pass an explicit
//     same-origin URL to the weights vendored in public/models, so the
//     detector works under connect-src 'self' and doesn't depend on a
//     deprecated redirect chain.

import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import * as faceDetection from "@tensorflow-models/face-detection";

let detector: faceDetection.FaceDetector | null = null;

export interface InitMessage {
  type: "INIT";
  /** Absolute URL to the vendored model.json. */
  modelUrl: string;
  /** Force the CPU backend (used by tests and by WebGL-less browsers). */
  forceCpu?: boolean;
  maxFaces?: number;
}

export interface DetectMessage {
  type: "DETECT_FACES";
  image: ImageBitmap;
}

type Incoming = InitMessage | DetectMessage;

async function initializeModel(msg: InitMessage): Promise<void> {
  try {
    await tf.ready();

    let backend = "cpu";
    if (msg.forceCpu) {
      await tf.setBackend("cpu");
    } else {
      // WebGL is ~10x faster but is unavailable in some locked-down
      // browsers and inside certain VMs — fall back rather than fail.
      try {
        const ok = await tf.setBackend("webgl");
        if (!ok) throw new Error("setBackend(webgl) returned false");
      } catch {
        const ok = await tf.setBackend("cpu");
        if (!ok) throw new Error("neither WebGL nor CPU backend is supported");
      }
    }
    await tf.ready();
    backend = tf.getBackend();

    detector = await faceDetection.createDetector(
      faceDetection.SupportedModels.MediaPipeFaceDetector,
      {
        runtime: "tfjs",
        maxFaces: msg.maxFaces ?? 10,
        modelType: "short",
        detectorModelUrl: msg.modelUrl,
      },
    );

    self.postMessage({ type: "MODEL_READY", backend });
  } catch (err) {
    self.postMessage({
      type: "ERROR",
      message: `model initialization failed: ${String(err)}`,
    });
  }
}

async function detectFaces(bitmap: ImageBitmap): Promise<void> {
  if (!detector) {
    self.postMessage({ type: "ERROR", message: "model not initialized" });
    bitmap.close();
    return;
  }

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    self.postMessage({ type: "ERROR", message: "canvas context unavailable" });
    bitmap.close();
    return;
  }

  try {
    ctx.drawImage(bitmap, 0, 0);
    const faces = await detector.estimateFaces(
      canvas as unknown as HTMLCanvasElement,
    );
    // Box + the 6 MediaPipe keypoints survive the postMessage hop. The
    // keypoints are what the gaze heuristic on the main thread reads;
    // they are 6 points per face, so the copy is negligible.
    self.postMessage({
      type: "DETECTION_RESULT",
      faces: faces.map((f) => ({
        box: f.box,
        keypoints: (f.keypoints ?? []).map((k) => ({
          x: k.x,
          y: k.y,
          name: k.name,
        })),
      })),
      count: faces.length,
    });
  } catch (err) {
    self.postMessage({
      type: "ERROR",
      message: `detection failed: ${String(err)}`,
    });
  } finally {
    // Transferred bitmaps leak GPU memory at 3 fps if not released.
    bitmap.close();
  }
}

self.onmessage = async (event: MessageEvent<Incoming>) => {
  const data = event.data;
  if (data.type === "INIT") {
    await initializeModel(data);
  } else if (data.type === "DETECT_FACES" && data.image) {
    await detectFaces(data.image);
  }
};

self.onerror = () => {
  self.postMessage({ type: "ERROR", message: "worker crashed" });
};
