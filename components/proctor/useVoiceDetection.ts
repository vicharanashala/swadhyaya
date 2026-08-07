"use client";

// useVoiceDetection — ported from vibe's SpeechDetector.tsx.
//
// Wires the `voice_detected` violation type, previously declared and
// rendered but never emitted.
//
// Classifies mic audio with YAMNet via MediaPipe's AudioClassifier and
// reports when the top category is "Speech". Two changes from vibe's
// original:
//
//   • The wasm fileset and the .tflite are loaded from public/models
//     rather than jsdelivr + storage.googleapis, so this runs under
//     connect-src 'self'.
//   • vibe used ScriptProcessorNode, deprecated and running on the main
//     thread. This uses an AnalyserNode gate: audio is only handed to
//     the classifier when short-term RMS suggests something is there,
//     which keeps a silent room close to zero CPU.
//
// The mic is the most invasive sensor here, so it is strictly opt-in via
// `enabled` and the stream is released the moment it goes false.

import { useEffect, useRef, useState } from "react";
import type { AudioClassifier } from "@mediapipe/tasks-audio";

export interface VoiceDetectionOpts {
  enabled: boolean;
  onAnomaly?: (a: { type: "voice_detected"; severity: number }) => void;
  /** Classifier confidence above which "Speech" counts. vibe used 0.5. */
  minScore?: number;
}

export interface VoiceDetection {
  isSpeaking: boolean | null;
  ready: boolean;
  error: string | null;
}

const SAMPLE_RATE = 16_000;
/** How often we may classify, ms. vibe used 500. */
const CLASSIFY_INTERVAL_MS = 500;
/** RMS below this is treated as silence and skipped without classifying. */
const SILENCE_RMS = 0.01;
/** Consecutive speech classifications before reporting. */
const CONFIRM = 3;
/** Minimum gap between reports so one conversation isn't 50 violations. */
const REPORT_COOLDOWN_MS = 30_000;

export function useVoiceDetection(opts: VoiceDetectionOpts): VoiceDetection {
  const { enabled, onAnomaly, minScore = 0.5 } = opts;

  const [isSpeaking, setIsSpeaking] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAnomalyRef = useRef(onAnomaly);
  useEffect(() => {
    onAnomalyRef.current = onAnomaly;
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setReady(false);
      setIsSpeaking(null);
      return;
    }

    let cancelled = false;
    let classifier: AudioClassifier | null = null;
    let audioCtx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let rafId = 0;
    let streak = 0;
    let lastClassify = 0;
    let lastReport = 0;

    const start = async () => {
      try {
        const { AudioClassifier: AC, FilesetResolver } = await import(
          "@mediapipe/tasks-audio"
        );
        const fileset = await FilesetResolver.forAudioTasks(
          `${window.location.origin}/models/audio-wasm`,
        );
        if (cancelled) return;

        classifier = await AC.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: `${window.location.origin}/models/yamnet/yamnet.tflite`,
          },
        });
        if (cancelled) {
          classifier.close();
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        // Deliberately not connected to destination — routing the mic to
        // the speakers would feed back.

        const buf = new Float32Array(analyser.fftSize);
        setReady(true);

        const loop = () => {
          if (cancelled) return;
          rafId = requestAnimationFrame(loop);

          const now = performance.now();
          if (now - lastClassify < CLASSIFY_INTERVAL_MS) return;
          lastClassify = now;

          analyser.getFloatTimeDomainData(buf);
          let sumSq = 0;
          for (let i = 0; i < buf.length; i++) sumSq += buf[i]! * buf[i]!;
          const rms = Math.sqrt(sumSq / buf.length);

          if (rms < SILENCE_RMS) {
            streak = 0;
            setIsSpeaking(false);
            return;
          }

          try {
            const results = classifier!.classify(buf, SAMPLE_RATE);
            const top = results[0]?.classifications[0]?.categories?.[0];
            const speaking =
              top?.categoryName === "Speech" && (top?.score ?? 0) > minScore;

            setIsSpeaking(speaking);
            if (!speaking) {
              streak = 0;
              return;
            }
            streak += 1;
            const wall = Date.now();
            if (streak >= CONFIRM && wall - lastReport >= REPORT_COOLDOWN_MS) {
              lastReport = wall;
              streak = 0;
              onAnomalyRef.current?.({ type: "voice_detected", severity: 2 });
            }
          } catch {
            // A classify() failure on one buffer isn't fatal.
          }
        };
        rafId = requestAnimationFrame(loop);
      } catch (e) {
        if (!cancelled) {
          setError(`voice detection unavailable: ${String(e)}`);
          setReady(false);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
      void audioCtx?.close().catch(() => undefined);
      classifier?.close();
      setReady(false);
      setIsSpeaking(null);
    };
  }, [enabled, minScore]);

  return { isSpeaking, ready, error };
}
