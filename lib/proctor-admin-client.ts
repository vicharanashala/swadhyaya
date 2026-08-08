"use client";

// Admin-side client for the /api/proctor read endpoints.
//
// The token is held in sessionStorage, not localStorage: a reviewer's
// laptop is exactly the machine you don't want holding a standing key to
// every student's webcam footage after the tab closes.
//
// Evidence images can't be loaded with a plain <img src> because the
// endpoint requires an Authorization header, so `useEvidenceUrl` fetches
// the bytes and hands back an object URL instead.

import { useEffect, useState } from "react";
import type { AttemptStatus, ViolationType } from "./proctoring";

const TOKEN_KEY = "swadhyaya-proctor-admin-token";

export interface RemoteViolation {
  id: string;
  attemptId: string;
  type: ViolationType;
  timestamp: number;
  severity: number;
  durationMs?: number;
  context?: string;
  evidenceId?: string;
}

export interface RemoteAttemptFull {
  id: string;
  subjectId: string;
  conceptId: string;
  startedAt: number;
  endedAt?: number;
  status: AttemptStatus;
  violationCount: number;
  violations: RemoteViolation[];
  lastHeartbeatAt: number;
  metadata: {
    userAgent: string;
    timezone: string;
    screen: string;
    language: string;
  };
  result?: { score: number; total: number; passed: boolean };
  penaltyScore?: number;
  ejectionReason?: string;
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token.trim());
  } catch {
    /* ignore */
  }
}

export function clearAdminToken(): void {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function adminFetch(path: string): Promise<Response> {
  const token = getAdminToken();
  return fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
}

export type AttemptsState =
  | { status: "loading" }
  | { status: "unauthorized" }
  | { status: "misconfigured"; message: string }
  | { status: "error"; message: string }
  | { status: "ok"; attempts: RemoteAttemptFull[] };

/** Polls the server for attempts. `token` is a dependency so that
 *  entering one re-runs the fetch immediately. */
export function useRemoteAttempts(
  token: string | null,
  intervalMs = 5000,
): AttemptsState {
  const [state, setState] = useState<AttemptsState>({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ status: "unauthorized" });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const res = await adminFetch("/api/proctor/attempts");
        if (cancelled) return;

        if (res.status === 401) return setState({ status: "unauthorized" });
        if (res.status === 503) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          return setState({
            status: "misconfigured",
            message: body.error ?? "server is missing PROCTOR_ADMIN_TOKEN",
          });
        }
        if (res.status === 404) {
          return setState({
            status: "misconfigured",
            message: "proctoring is disabled on this deployment",
          });
        }
        if (!res.ok) {
          return setState({ status: "error", message: `HTTP ${res.status}` });
        }

        const data = (await res.json()) as { attempts: RemoteAttemptFull[] };
        if (!cancelled) {
          setState({ status: "ok", attempts: data.attempts ?? [] });
        }
      } catch (e) {
        if (!cancelled) {
          setState({ status: "error", message: String(e) });
        }
      }
    };

    void load();
    const id = window.setInterval(() => void load(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [token, intervalMs]);

  return state;
}

/** Fetches one evidence image with auth and exposes it as an object URL,
 *  revoking it on unmount so the blobs don't accumulate. */
export function useEvidenceUrl(evidenceId: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!evidenceId) {
      setUrl(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    void (async () => {
      try {
        const res = await adminFetch(`/api/proctor/evidence/${evidenceId}`);
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
        /* leave null — the grid renders a placeholder */
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [evidenceId]);

  return url;
}
