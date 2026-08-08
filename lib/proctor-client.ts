"use client";

// Client bridge to the /api/proctor endpoints.
//
// Every call is best-effort: proctoring must never break the lesson the
// student is trying to take. If the server is unreachable the helpers
// resolve to null and the caller carries on — the local record in
// lib/proctoring.ts remains the student-visible source of truth, while
// the server copy is the one the reviewer trusts.
//
// The write token minted at attempt creation is held in sessionStorage
// rather than localStorage: it should die with the tab, not linger.

import type { AttemptStatus, ViolationType } from "./proctoring";

const SUBJECT_KEY = "swadhyaya-proctor-subject";
const TOKEN_KEY = "swadhyaya-proctor-write-token";
const REMOTE_ID_KEY = "swadhyaya-proctor-remote-id";

export interface RemoteAttempt {
  id: string;
  subjectId: string;
  conceptId: string;
  startedAt: number;
  endedAt?: number;
  status: AttemptStatus;
  violationCount: number;
  lastHeartbeatAt: number;
}

/** Stable pseudonymous id for this browser. Not an identity — there is
 *  no auth in this app — but it lets a reviewer group one student's
 *  attempts together. */
export function subjectId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(SUBJECT_KEY);
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `s${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(SUBJECT_KEY, fresh);
    return fresh;
  } catch {
    return "anonymous";
  }
}

function readToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string): void {
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* sessionStorage unavailable — server sync degrades to no-op */
  }
}

export function remoteAttemptId(): string | null {
  try {
    return window.sessionStorage.getItem(REMOTE_ID_KEY);
  } catch {
    return null;
  }
}

function setRemoteAttemptId(id: string): void {
  try {
    window.sessionStorage.setItem(REMOTE_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

export function clearRemoteAttempt(): void {
  try {
    window.sessionStorage.removeItem(REMOTE_ID_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function enabled(): boolean {
  return process.env.NEXT_PUBLIC_PROCTORING === "1";
}

// ─────────────────────────────────────────────────────────────────────────

export async function openRemoteAttempt(
  conceptId: string,
): Promise<string | null> {
  if (!enabled() || typeof window === "undefined") return null;

  // Reuse the tab's existing attempt rather than opening a second one
  // every time the controller remounts during client navigation.
  const existing = remoteAttemptId();
  if (existing && readToken()) return existing;

  try {
    const res = await fetch("/api/proctor/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: subjectId(),
        conceptId,
        metadata: {
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown",
          screen: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
        },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      attempt: RemoteAttempt;
      writeToken: string;
    };
    writeToken(data.writeToken);
    setRemoteAttemptId(data.attempt.id);
    return data.attempt.id;
  } catch {
    return null;
  }
}

export interface RemoteViolationInput {
  type: ViolationType;
  severity?: number;
  durationMs?: number;
  context?: string;
  /** JPEG data-URL. Uploaded once and then referenced by id server-side. */
  snapshot?: string;
}

export async function reportRemoteViolation(
  input: RemoteViolationInput,
): Promise<boolean> {
  if (!enabled() || typeof window === "undefined") return false;
  const id = remoteAttemptId();
  const token = readToken();
  if (!id || !token) return false;

  try {
    const res = await fetch(`/api/proctor/attempts/${id}/violations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-proctor-write-token": token,
      },
      body: JSON.stringify(input),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendPenaltyUpdate(
  delta: number,
  eject: boolean = false,
  reason?: string,
): Promise<void> {
  if (!enabled() || typeof window === "undefined") return;
  const id = remoteAttemptId();
  const token = readToken();
  if (!id || !token) return;
  try {
    await fetch(`/api/proctor/attempts/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-proctor-write-token": token,
      },
      body: JSON.stringify({ action: "penalty", delta, eject, reason }),
      keepalive: true,
    });
  } catch {
    /* best-effort — same posture as sendRemoteHeartbeat */
  }
}

export async function sendRemoteHeartbeat(): Promise<void> {
  if (!enabled() || typeof window === "undefined") return;
  const id = remoteAttemptId();
  const token = readToken();
  if (!id || !token) return;
  try {
    await fetch(`/api/proctor/attempts/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-proctor-write-token": token,
      },
      body: JSON.stringify({ action: "heartbeat" }),
      keepalive: true,
    });
  } catch {
    /* best-effort */
  }
}

export async function closeRemoteAttempt(
  status: AttemptStatus = "completed",
  result?: { score: number; total: number; passed: boolean },
): Promise<void> {
  if (!enabled() || typeof window === "undefined") return;
  const id = remoteAttemptId();
  const token = readToken();
  if (!id || !token) return;
  try {
    await fetch(`/api/proctor/attempts/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-proctor-write-token": token,
      },
      body: JSON.stringify({ action: "end", status, result }),
      keepalive: true,
    });
  } finally {
    clearRemoteAttempt();
  }
}
