"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ConceptId } from "./curriculum";
import { getUnlocked, isConceptId } from "./curriculum";

interface ProgressState {
  completed: ConceptId[];
  xp: number;
  streak: number;
  lastVisit: string; // ISO date
  lensModes: string[];
  // actions
  complete: (id: ConceptId, xp: number) => void;
  unlockLens: (lens: string) => void;
  reset: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const computeStreak = (last: string, current: number): number => {
  if (!last) return 1;
  // Use UTC dates so timezone travel doesn't break the streak.
  const lastDate = new Date(`${last}T00:00:00Z`);
  const now = new Date();
  const nowUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const diffDays = Math.floor(
    (nowUTC.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return Math.max(1, current);
  if (diffDays === 1) return current + 1;
  return 1; // broken
};

const LEVELS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 13000];

export const MAX_XP = LEVELS[LEVELS.length - 1] ?? 13000;

export const levelFromXP = (xp: number): number => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= (LEVELS[i] ?? 0)) return i + 1;
  }
  return 1;
};

export const xpForLevel = (level: number): number => LEVELS[level - 1] ?? 0;
export const xpForNextLevel = (level: number): number =>
  LEVELS[level] ?? MAX_XP;

export const lensUnlockedAt = (level: number): string[] => {
  if (level >= 5) return ["eigen-overlay"];
  if (level >= 10) return ["eigen-overlay", "singular-bars"];
  if (level >= 15) return ["eigen-overlay", "singular-bars", "column-tint"];
  if (level >= 20)
    return ["eigen-overlay", "singular-bars", "column-tint", "auto-3d"];
  return [];
};

// Bound XP at import to prevent crafted files from granting infinite levels.
const clampXP = (xp: unknown): number => {
  if (typeof xp !== "number" || !Number.isFinite(xp)) return 0;
  return Math.max(0, Math.min(xp, MAX_XP * 1000));
};

const sanitizeCompleted = (raw: unknown): ConceptId[] => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: ConceptId[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    if (!isConceptId(item)) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
};

const sanitizeStreak = (raw: unknown): number => {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 1;
  return Math.max(1, Math.floor(raw));
};

const sanitizeLensModes = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === "string").slice(0, 20);
};

const sanitizeLastVisit = (raw: unknown): string => {
  if (typeof raw !== "string") return today();
  // Must look like YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return today();
  const d = new Date(`${raw}T00:00:00Z`);
  if (isNaN(d.getTime())) return today();
  return raw;
};

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      completed: [],
      xp: 0,
      streak: 1,
      lastVisit: today(),
      lensModes: [],
      complete: (id, xp) => {
        if (!isConceptId(id)) return;
        const completed = get().completed.includes(id)
          ? get().completed
          : [...get().completed, id];
        const newXP = clampXP(get().xp + xp);
        const newStreak = computeStreak(get().lastVisit, get().streak);
        const lvl = levelFromXP(newXP);
        set({
          completed,
          xp: newXP,
          streak: newStreak,
          lastVisit: today(),
          lensModes: lensUnlockedAt(lvl),
        });
      },
      unlockLens: (lens) => {
        if (typeof lens !== "string") return;
        if (!get().lensModes.includes(lens)) {
          set({ lensModes: [...get().lensModes, lens] });
        }
      },
      reset: () =>
        set({
          completed: [],
          xp: 0,
          streak: 1,
          lastVisit: today(),
          lensModes: [],
        }),
    }),
    {
      name: "swadhyaya-progress",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage,
      ),
      // Drop unknown fields and clamp values to keep state valid.
      migrate: (persistedState) => {
        const s = (persistedState ?? {}) as Partial<ProgressState>;
        return {
          completed: sanitizeCompleted(s.completed),
          xp: clampXP(s.xp),
          streak: sanitizeStreak(s.streak),
          lastVisit: sanitizeLastVisit(s.lastVisit),
          lensModes: sanitizeLensModes(s.lensModes),
        } as ProgressState;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // Persisted state was unreadable; reset to defaults silently.
          console.warn("[swadhyaya] progress state was corrupt; resetting", error);
          if (state) {
            state.completed = [];
            state.xp = 0;
            state.streak = 1;
            state.lastVisit = today();
            state.lensModes = [];
          }
        }
      },
    },
  ),
);

// SSR-safe no-op storage used during server render.
const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
} as unknown as Storage;

export const useUnlocked = () => {
  const completed = useProgress((s) => s.completed);
  return useMemo(() => getUnlocked(new Set(completed)), [completed]);
};

export const useIsUnlocked = (id: ConceptId) => {
  const completed = useProgress((s) => s.completed);
  return useMemo(() => getUnlocked(new Set(completed)).has(id), [completed, id]);
};

// useMemo is imported lazily to avoid changing the top-level import block
// structure for the rest of the file. React already exports it; pull from there.
import { useMemo } from "react";