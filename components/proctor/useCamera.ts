"use client";

// useCamera — Tenali-style webcam + audio hook. Resolves
// navigator.mediaDevices.getUserMedia once per mount and exposes the
// stream + a ref to attach to a <video> element. Captures stills on
// demand via captureFrame() for violation evidence.
//
// Graceful fallback: if the user denies the camera or the device
// has none, the camera enters an `error` state and the rest of the
// proctoring layer continues to work. Proctoring never blocks on
// camera access.

import { useCallback, useEffect, useRef, useState } from "react";

export interface Camera {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isRunning: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  captureFrame: () => string | null;
}

interface CameraOpts {
  /** Width hint — defaults to 480 for performance. */
  width?: number;
  /** Height hint — defaults to 360. */
  height?: number;
  /** When true, request audio too. Defaults to false (no mic). */
  audio?: boolean;
  /** Start the camera on mount. Defaults to false (opt-in). */
  autostart?: boolean;
  /** Friendly name for error messages, e.g. "test attempt". */
  context?: string;
}

export function useCamera(opts: CameraOpts = {}): Camera {
  const {
    width = 480,
    height = 360,
    audio = false,
    autostart = false,
    context = "this site",
  } = opts;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("camera API not available in this browser");
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: "user",
        },
        audio,
      });
      streamRef.current = stream;
      attachToVideo(videoRef.current, stream);
      setIsRunning(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      setError(`Camera blocked or unavailable (${msg}). Proctoring continues without video evidence on ${context}.`);
      setIsRunning(false);
    }
  }, [audio, context, height, width]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRunning(false);
  }, []);

  const captureFrame = useCallback((): string | null => {
    const v = videoRef.current;
    if (!v || !streamRef.current) return null;
    try {
      const c = document.createElement("canvas");
      c.width = v.videoWidth || width;
      c.height = v.videoHeight || height;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(v, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.4); // 40% quality — small payload
    } catch {
      return null;
    }
  }, [width, height]);

  useEffect(() => {
    if (autostart) {
      start();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    videoRef,
    stream: streamRef.current,
    isRunning,
    error,
    start,
    stop,
    captureFrame,
  };
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
    // play() can fail in some browsers when autoplay restrictions apply;
    // the muted+playsInline flags above should prevent the common case.
  });
}
