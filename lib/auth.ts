"use client";
import { useMemo } from "react";

// Auth state is intentionally deferred.
//
// Samagama.in is the planned identity provider, but the OAuth client
// credentials and JS SDK are not yet wired. Until they are, the platform
// runs fully without authentication: progress is saved to localStorage,
// no login is required, and no fake/demo user is created.
//
// To enable real auth:
//   1. Set NEXT_PUBLIC_SAMAGAMA_AUTH_URL, NEXT_PUBLIC_SAMAGAMA_CLIENT_ID,
//      NEXT_PUBLIC_SAMAGAMA_REDIRECT_URI, and SAMAGAMA_CLIENT_SECRET in
//      .env (see .env.example).
//   2. Implement the OAuth round-trip in `login()` below (popup,
//      callback, token exchange, profile fetch).
//   3. Set AUTH_ENABLED to true.
//
// Until then, useAuth() returns { status: "disabled", user: null } and
// the UI shows an honest "Sign in is paused — your progress saves locally".

export type AuthStatus = "authenticated" | "disabled";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

const AUTH_ENABLED = false;

const DISABLED_STATE: AuthState = { status: "disabled", user: null };

export function useAuth(): AuthState & {
  login: () => Promise<void>;
  logout: () => void;
} {
  // Static stub. When auth is wired, replace with a Zustand store.
  const state = useMemo<AuthState>(
    () => (AUTH_ENABLED ? DISABLED_STATE : DISABLED_STATE),
    [],
  );

  const login = async () => {
    // Disabled. Wire the real samagama.in OAuth flow when credentials land.
    throw new Error(
      "Sign-in is paused — see lib/auth.ts to enable when samagama.in credentials are configured.",
    );
  };

  const logout = () => {
    // no-op while auth is disabled
  };

  return { ...state, login, logout };
}