"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Layers } from "lucide-react";
import { useProgress, levelFromXP, xpForLevel, xpForNextLevel, MAX_XP } from "@/lib/progress";
import { AuthButton } from "./AuthButton";
import { CONCEPTS } from "@/lib/curriculum";
import { ProctorLiveBadge } from "@/components/proctor/ProctorLiveBadge";

export function TopNav() {
  // Three primitive subscriptions. Avoid object selectors in Zustand v5 —
  // they return a new reference every render and trigger infinite loops.
  const xp = useProgress((s) => s.xp);
  const streak = useProgress((s) => s.streak);
  const completed = useProgress((s) => s.completed);

  const level = levelFromXP(xp);
  const lvlStart = xpForLevel(level);
  const lvlEnd = xpForNextLevel(level);
  const isMaxLevel = lvlEnd === MAX_XP;
  const pct = isMaxLevel
    ? 100
    : ((xp - lvlStart) / (lvlEnd - lvlStart)) * 100;

  const pathname = usePathname();

  const navLinks = [
    { href: "/learn", label: "Map" },
    { href: "/leaderboard", label: "Progress" },
    { href: "/about", label: "Credits" },
    // Proctoring admin link — only mounts when the deployment opts in
    // via NEXT_PUBLIC_PROCTORING=1. Kept here so admins have a stable
    // URL from the global chrome without polluting the user nav.
    ...(process.env.NEXT_PUBLIC_PROCTORING === "1"
      ? [{ href: "/admin/proctor", label: "Proctoring" }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo />
            <span className="font-serif text-lg tracking-tight text-ink group-hover:text-accent transition">
              Swadhyaya
            </span>
          </Link>
          <span className="hidden sm:inline-block text-xs text-faint ml-2">
            learn by playing
          </span>
          <nav
            className="hidden md:flex items-center gap-1 ml-4"
            aria-label="Primary"
          >
            {navLinks.map((l) => {
              const active =
                pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-xs px-2.5 py-1.5 rounded-md transition ${
                    active
                      ? "text-ink bg-elev"
                      : "text-dim hover:text-ink hover:bg-elev/40"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div
            className="hidden sm:flex items-center gap-2 text-sm text-dim"
            aria-label={`Concepts locked in: ${completed.length} of ${CONCEPTS.length}`}
          >
            <Layers size={14} aria-hidden="true" />
            <span className="font-mono">{completed.length}</span>
            <span className="text-faint">/ {CONCEPTS.length}</span>
          </div>

          <div className="hidden md:flex flex-col items-end min-w-[120px]">
            <div className="text-[10px] text-faint uppercase tracking-wider">
              Lvl {level}
            </div>
            <div
              className="w-24 h-1 bg-elev rounded-full overflow-hidden"
              role="progressbar"
              aria-label="Level progress"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 text-sm"
            aria-label={`Streak: ${streak} day${streak === 1 ? "" : "s"}`}
          >
            <Flame size={14} className="text-warn" aria-hidden="true" />
            <span className="font-mono text-ink">{streak}</span>
          </div>

          <ProctorLiveBadge />

          <AuthButton />
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      className="text-accent"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 11 L19 11 M11 3 L11 19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="3" cy="11" r="1.5" fill="currentColor" />
      <circle cx="19" cy="11" r="1.5" fill="currentColor" />
      <circle cx="11" cy="3" r="1.5" fill="currentColor" />
      <circle cx="11" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}