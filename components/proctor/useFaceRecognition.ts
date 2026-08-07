"use client";

// useFaceRecognition — ported from vibe's FaceRecognitionComponent.tsx.
//
// Wires the `face_mismatch` violation type: verifies that the person on
// camera is the one who registered, rather than merely that *someone* is
// there. Without this, face counting is trivially defeated by having a
// friend sit the assessment.
//
// Matching follows vibe: a 128-d descriptor from face-api's
// faceRecognitionNet, compared by euclidean distance against the stored
// reference, with vibe's MATCH_THRESHOLD of 0.55.
//
// Differences from vibe:
//   • Weights load from public/models/face-api (vendored by
//     scripts/setup-proctor-models.mjs). vibe tried '/models' then fell
//     back to jsdelivr; there is no CDN fallback here by design.
//   • The reference descriptor stays in localStorage on the student's
//     own device and is never uploaded. It is 128 floats — not a
//     photograph — but it is still biometric data, and shipping it to a
//     server would turn a proctoring feature into a face database.
//     Only the *verdict* (matched / didn't) is ever reported.

import { useCallback, useEffect, useRef, useState } from "react";

export const FACE_REGISTRATION_KEY = "swadhyaya-proctor-face-descriptor";

/** vibe's MATCH_THRESHOLD. Lower = stricter. */
const MATCH_THRESHOLD = 0.55;
/** Consecutive mismatching samples before reporting. */
const CONFIRM = 4;
const REPORT_COOLDOWN_MS = 60_000;
const MODEL_DIR = "/models/face-api";

export interface FaceRecognitionOpts {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  onAnomaly?: (a: { type: "face_mismatch"; severity: number }) => void;
  /** ms between verification samples. Defaults to 3000. */
  intervalMs?: number;
}

export interface FaceRecognitionState {
  /** null until the first successful comparison. */
  isMatch: boolean | null;
  distance: number | null;
  registered: boolean;
  ready: boolean;
  error: string | null;
}

export function hasFaceRegistration(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage.getItem(FACE_REGISTRATION_KEY));
  } catch {
    return false;
  }
}

export function readFaceRegistration(): Float32Array | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FACE_REGISTRATION_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw) as number[];
    return Array.isArray(arr) && arr.length === 128
      ? Float32Array.from(arr)
      : null;
  } catch {
    return null;
  }
}

export function saveFaceRegistration(descriptor: Float32Array): void {
  try {
    window.localStorage.setItem(
      FACE_REGISTRATION_KEY,
      JSON.stringify(Array.from(descriptor)),
    );
  } catch {
    /* quota or private mode — registration silently unavailable */
  }
}

export function clearFaceRegistration(): void {
  try {
    window.localStorage.removeItem(FACE_REGISTRATION_KEY);
  } catch {
    /* ignore */
  }
}

/** Loaded once and shared — the recognition net alone is 6.4 MB. */
let modelsLoaded: Promise<typeof import("@vladmandic/face-api")> | null = null;

async function loadFaceApi() {
  if (!modelsLoaded) {
    modelsLoaded = (async () => {
      const faceapi = await import("@vladmandic/face-api");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_DIR),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_DIR),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_DIR),
      ]);
      return faceapi;
    })().catch((e) => {
      modelsLoaded = null;
      throw e;
    });
  }
  return modelsLoaded;
}

/** Computes a descriptor for whoever is currently in frame. Used both by
 *  registration and by verification. */
export async function computeDescriptor(
  video: HTMLVideoElement,
): Promise<Float32Array | null> {
  const faceapi = await loadFaceApi();
  const detection = await faceapi
    .detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 512,
        scoreThreshold: 0.45,
      }),
    )
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection?.descriptor ?? null;
}

export function useFaceRecognition(
  opts: FaceRecognitionOpts,
): FaceRecognitionState {
  const { videoRef, enabled, onAnomaly, intervalMs = 3000 } = opts;

  const [isMatch, setIsMatch] = useState<boolean | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const referenceRef = useRef<Float32Array | null>(null);
  const streakRef = useRef(0);
  const lastReportRef = useRef(0);
  const busyRef = useRef(false);

  const onAnomalyRef = useRef(onAnomaly);
  useEffect(() => {
    onAnomalyRef.current = onAnomaly;
  });

  const refreshRegistration = useCallback(() => {
    const ref = readFaceRegistration();
    referenceRef.current = ref;
    setRegistered(Boolean(ref));
  }, []);

  useEffect(() => {
    refreshRegistration();
    const onStorage = (e: StorageEvent) => {
      if (e.key === FACE_REGISTRATION_KEY) refreshRegistration();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshRegistration]);

  // Warm the models once verification is actually going to run.
  useEffect(() => {
    if (!enabled || !registered) {
      setReady(false);
      return;
    }
    let cancelled = false;
    loadFaceApi()
      .then(() => {
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(`identity models unavailable: ${String(e)}`);
          setReady(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, registered]);

  useEffect(() => {
    if (!enabled || !registered || !ready || typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const sample = async () => {
      const video = videoRef.current;
      const reference = referenceRef.current;
      if (!video || !reference || busyRef.current) return;
      if (video.readyState < 2 || !video.videoWidth) return;

      busyRef.current = true;
      try {
        const faceapi = await loadFaceApi();
        const live = await computeDescriptor(video);
        if (cancelled) return;

        // No detectable face is the face detector's problem to report,
        // not a mismatch — stay quiet so one absence isn't logged twice.
        if (!live) {
          streakRef.current = 0;
          return;
        }

        const d = faceapi.euclideanDistance(
          Array.from(reference),
          Array.from(live),
        );
        setDistance(d);
        const matched = d < MATCH_THRESHOLD;
        setIsMatch(matched);

        if (matched) {
          streakRef.current = 0;
          return;
        }
        streakRef.current += 1;
        const now = Date.now();
        if (
          streakRef.current >= CONFIRM &&
          now - lastReportRef.current >= REPORT_COOLDOWN_MS
        ) {
          lastReportRef.current = now;
          streakRef.current = 0;
          onAnomalyRef.current?.({ type: "face_mismatch", severity: 3 });
        }
      } catch {
        // Transient inference failure — try again next tick.
      } finally {
        busyRef.current = false;
      }
    };

    const id = window.setInterval(() => void sample(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, registered, ready, intervalMs, videoRef]);

  return { isMatch, distance, registered, ready, error };
}
