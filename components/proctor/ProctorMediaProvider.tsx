"use client";

// ProctorMediaProvider — owns the single camera+microphone MediaStream
// for the whole app.
//
// Everything downstream (face detection, blur, voice, camera integrity,
// the floating preview) reads this one stream instead of calling
// getUserMedia itself. Before this there were three separate
// acquisitions — the controller's camera, the voice detector's mic, and
// the registration modal — which meant three permission prompts and
// three recording indicators for what is conceptually one session.
//
// The provider also owns "is the session still healthy": a track that
// ends or goes muted (unplugged webcam, OS-level privacy switch, another
// app seizing the device, permission revoked from the omnibox) flips
// status back to a blocking state, which is what lets ProctorGate keep
// the app hidden for the entire session rather than only at startup.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type MediaStatus =
  | "idle" // nothing attempted yet
  | "requesting" // getUserMedia in flight
  | "live" // both tracks running — the app may render
  | "denied" // user or policy refused; cannot re-prompt programmatically
  | "no-device" // no camera and/or mic present on this machine
  | "interrupted" // was live, then a track died — re-acquire
  | "error"; // anything else

export interface ProctorMedia {
  stream: MediaStream | null;
  status: MediaStatus;
  error: string | null;
  /** True once both a video and an audio track are live. */
  healthy: boolean;
  request: () => Promise<void>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  captureFrame: () => string | null;
}

const Ctx = createContext<ProctorMedia | null>(null);

/** Strict accessor — throws if no provider is mounted. Use this from
 *  code that only ever runs behind ProctorGate. */
export function useProctorMedia(): ProctorMedia {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useProctorMedia must be used inside <ProctorMediaProvider>");
  }
  return ctx;
}

/** Returns null instead of throwing when there is no provider.
 *
 *  That happens on exactly one path: NEXT_PUBLIC_PROCTORING is off, so
 *  ProctorGate is a pass-through and never mounts the provider — while
 *  SiteProctorController is still in the tree. Prerendering /learn with
 *  the strict hook crashed the build for every deployment that doesn't
 *  run proctoring. */
export function useOptionalProctorMedia(): ProctorMedia | null {
  return useContext(Ctx);
}

/**
 * Attaches the shared stream to a <video> this component owns.
 *
 * One MediaStream can feed any number of <video> elements, but a single
 * React ref cannot: it holds one node, so passing the provider's
 * `videoRef` to several previews meant only the last one to mount ever
 * received `srcObject`. The others sat black with readyState 0 — which
 * is exactly what happened to the floating webcam panel while the
 * hidden 1×1 detector sink held the ref.
 *
 * Every preview should call this and render `ref={sink}` instead.
 */
export function useStreamSink(
  stream: MediaStream | null,
): React.RefObject<HTMLVideoElement | null> {
  const ref = useRef<HTMLVideoElement | null>(null);

  // Deliberately no dependency array. The element can unmount and
  // remount (collapsing the panel, opening the overlay) without
  // `stream` changing, and assigning a ref never re-runs an effect —
  // so a dependency-gated version would leave the remounted node
  // blank. The identity check keeps the per-render cost to one
  // comparison.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (stream) {
      if (v.srcObject !== stream) {
        v.srcObject = stream;
        v.muted = true;
        v.playsInline = true;
        void v.play().catch(() => {
          /* autoplay policy is satisfied by muted + playsInline */
        });
      }
    } else if (v.srcObject) {
      v.srcObject = null;
    }
  });

  return ref;
}

const CONSTRAINTS: MediaStreamConstraints = {
  video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    // YAMNet wants 16 kHz; the browser resamples if it can't deliver it.
    sampleRate: 16_000,
  },
};

/** How often to re-verify that the tracks are still alive. */
const HEALTH_POLL_MS = 2000;
/** Backoff between automatic re-acquisition attempts. */
const RETRY_MS = 3000;

export function ProctorMediaProvider({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  const [status, setStatus] = useState<MediaStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [, forceRender] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const requestingRef = useRef(false);

  const tracksAlive = useCallback((s: MediaStream | null) => {
    if (!s) return false;
    const v = s.getVideoTracks()[0];
    const a = s.getAudioTracks()[0];
    return Boolean(
      v && a && v.readyState === "live" && a.readyState === "live" && !v.muted,
    );
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const request = useCallback(async () => {
    if (requestingRef.current) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setStatus("error");
      setError("This browser does not expose a camera API.");
      return;
    }

    requestingRef.current = true;
    setStatus((s) => (s === "live" ? s : "requesting"));
    setError(null);

    try {
      // Drop any half-dead stream before asking for a new one.
      if (streamRef.current && !tracksAlive(streamRef.current)) stop();

      const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
      streamRef.current = stream;

      // Re-evaluate the moment any track dies, rather than waiting for
      // the next poll — this is the fast path for "user revoked mid-quiz".
      stream.getTracks().forEach((t) => {
        t.addEventListener("ended", () => setStatus("interrupted"));
        t.addEventListener("mute", () => setStatus("interrupted"));
      });

      attachToVideo(videoRef.current, stream);
      setStatus("live");
      setError(null);
      forceRender((n) => n + 1);
    } catch (e) {
      const err = e as DOMException;
      switch (err?.name) {
        case "NotAllowedError":
        case "SecurityError":
          // The browser will not re-prompt after a hard denial; the user
          // has to clear it in site settings. ProctorGate explains how.
          setStatus("denied");
          setError(
            "Camera and microphone access was blocked. This session cannot continue without both.",
          );
          break;
        case "NotFoundError":
        case "OverconstrainedError":
          setStatus("no-device");
          setError(
            "No camera and/or microphone was found on this device. Both are required.",
          );
          break;
        case "NotReadableError":
          setStatus("interrupted");
          setError(
            "Your camera or microphone is in use by another application. Close it and try again.",
          );
          break;
        default:
          setStatus("error");
          setError(err?.message || "Could not start the camera and microphone.");
      }
    } finally {
      requestingRef.current = false;
    }
  }, [stop, tracksAlive]);

  // Ask as soon as the app loads. Chromium and Firefox allow this without
  // a gesture; Safari may reject it, which surfaces the retry button in
  // ProctorGate rather than leaving the user stuck.
  useEffect(() => {
    if (!enabled) return;
    void request();
    return stop;
  }, [enabled, request, stop]);

  // Keep-alive: catches revocations that fire no event (some Safari and
  // Android builds simply stop delivering frames).
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      if (status === "live" && !tracksAlive(streamRef.current)) {
        setStatus("interrupted");
      }
    }, HEALTH_POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, status, tracksAlive]);

  // Automatic recovery. Deliberately not attempted for "denied" or
  // "no-device": re-calling getUserMedia there cannot succeed and just
  // spins.
  useEffect(() => {
    if (!enabled || status !== "interrupted") return;
    const id = window.setTimeout(() => void request(), RETRY_MS);
    return () => window.clearTimeout(id);
  }, [enabled, status, request]);

  // Re-verify when the tab comes back — a device can be taken away while
  // the page is hidden.
  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!tracksAlive(streamRef.current)) setStatus("interrupted");
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled, tracksAlive]);

  const captureFrame = useCallback((): string | null => {
    const v = videoRef.current;
    if (!v || !streamRef.current || !v.videoWidth) return null;
    try {
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(v, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.4);
    } catch {
      return null;
    }
  }, []);

  const value: ProctorMedia = {
    stream: streamRef.current,
    status,
    error,
    healthy: status === "live" && tracksAlive(streamRef.current),
    request,
    videoRef,
    captureFrame,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function attachToVideo(
  video: HTMLVideoElement | null,
  stream: MediaStream | null,
) {
  if (!video || !stream) return;
  if (video.srcObject === stream) return;
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  video.play().catch(() => {
    /* muted + playsInline should satisfy autoplay policy */
  });
}
