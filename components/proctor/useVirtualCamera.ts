"use client";

// useVirtualCamera — ported from tenali's useVirtualCamera.js + vibe's
// detectVirtualCamera.ts.
//
// Software cameras (OBS Virtual Camera, ManyCam, Snap Camera, XSplit,
// DroidCam, Iriun, EpocCam) are a known hole in browser-based
// proctoring: a student points them at a video of someone taking the
// test and the detectors happily log a face. The defence is to inspect
// the device label and refuse to accept a feed whose label matches
// known virtual-camera signatures.
//
// Limitations honestly stated in both upstreams:
//   • Browser surfaces the active track label but not the underlying
//     device name, so a renamed virtual camera slips through.
//   • Device labels are only populated after the user has granted
//     permission at least once (otherwise they're empty strings), which
//     is fine here because ProctorGate won't render anything without
//     permission.
//
// Strategy matches vibe/tenali: enumerate video input devices, check
// each label for a known signature, fire once if matched.

import { useCallback, useEffect, useRef, useState } from "react";

export interface VirtualCameraOpts {
  enabled: boolean;
  /** The active session stream. Its label is the most reliable signal
   *  once getUserMedia has succeeded at least once. */
  stream: MediaStream | null;
  onAnomaly?: (a: {
    type: "virtual_camera";
    severity: number;
    /** The label that triggered the match, for admin review. */
    label: string;
  }) => void;
  /** ms between re-checks. Defaults to 10s, matching tenali. */
  intervalMs?: number;
}

export interface VirtualCameraState {
  isVirtual: boolean;
  matchedLabel: string | null;
}

const VIRTUAL_SIGNATURES = [
  "obs",
  "virtual",
  "manycam",
  "snap camera",
  "xsplit",
  "camtasia",
  "droidcam",
  "ip webcam",
  "iriun",
  "epoccam",
  "nvidia broadcast",
  "broadcast",
];

const SEVERITY = 3;

export function useVirtualCamera(opts: VirtualCameraOpts): VirtualCameraState {
  const { enabled, stream, onAnomaly, intervalMs = 10_000 } = opts;
  const [isVirtual, setIsVirtual] = useState(false);
  const [matchedLabel, setMatchedLabel] = useState<string | null>(null);

  const firedRef = useRef(false);
  const onAnomalyRef = useRef(onAnomaly);
  useEffect(() => {
    onAnomalyRef.current = onAnomaly;
  });

  const check = useCallback(async () => {
    if (!enabled) return;

    const checkLabel = (raw: string): string | null => {
      const lower = (raw || "").toLowerCase();
      if (!lower) return null;
      const hit = VIRTUAL_SIGNATURES.find((s) => lower.includes(s));
      return hit ? raw : null;
    };

    // 1. The active track label — most reliable once permission is on.
    const track = stream?.getVideoTracks?.()[0];
    const trackHit = track?.label ? checkLabel(track.label) : null;
    if (trackHit) {
      setIsVirtual(true);
      setMatchedLabel(trackHit);
      if (!firedRef.current) {
        firedRef.current = true;
        onAnomalyRef.current?.({ type: "virtual_camera", severity: SEVERITY, label: trackHit });
      }
      return;
    }

    // 2. Enumerate devices as a backup — catches virtual cameras the user
    //    selected in a different app, though this requires the browser to
    //    expose labels (it will once the user has granted at least once).
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      for (const d of devices) {
        if (d.kind !== "videoinput") continue;
        const hit = checkLabel(d.label || "");
        if (hit) {
          setIsVirtual(true);
          setMatchedLabel(hit);
          if (!firedRef.current) {
            firedRef.current = true;
            onAnomalyRef.current?.({ type: "virtual_camera", severity: SEVERITY, label: hit });
          }
          return;
        }
      }
    } catch {
      // enumerateDevices can fail without permission — ignore, the active
      // track check above still runs.
    }

    // Cleared — e.g. user reconnected a real camera. Allow one more report
    // if a virtual feed reappears.
    setIsVirtual(false);
    setMatchedLabel(null);
    firedRef.current = false;
  }, [enabled, stream]);

  useEffect(() => {
    if (!enabled) return;
    void check();
    const id = window.setInterval(check, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, check]);

  return { isVirtual, matchedLabel };
}
