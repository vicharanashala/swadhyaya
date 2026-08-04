"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Trophy, BookOpen } from "lucide-react";
import {
  PHASES,
  PHASE_PREFIX,
  getConceptsByPhase,
  type Phase,
} from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { useMemo } from "react";
import { cn } from "@/lib/cn";

export function SideRail() {
  const pathname = usePathname();
  const completed = useProgress((s) => s.completed);
  const completedSet = useMemo(() => new Set(completed), [completed]);

  const phaseStats = useMemo(
    () =>
      (PHASES.map((p) => p.id) as Phase[]).map((id) => {
        const phase = PHASES.find((p) => p.id === id)!;
        const prefix = PHASE_PREFIX[id];
        const concepts = getConceptsByPhase(id);
        const done = concepts.filter((c) => completedSet.has(c.id)).length;
        return {
          id,
          title: phase.title,
          color: phase.color,
          prefix,
          total: concepts.length,
          done,
        };
      }),
    [completedSet],
  );

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-line min-h-[calc(100vh-56px)] sticky top-14 h-[calc(100vh-56px)]">
      <div className="p-4 border-b border-line">
        <NavLink href="/learn" icon={<Map size={16} />} label="Course Map" pathname={pathname} />
        <NavLink
          href="/leaderboard"
          icon={<Trophy size={16} />}
          label="Progress"
          pathname={pathname}
        />
        <NavLink
          href="/about"
          icon={<BookOpen size={16} />}
          label="Credits"
          pathname={pathname}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[10px] text-faint uppercase tracking-wider px-3 py-2">
          Phases
        </div>
        {phaseStats.map((p) => {
          const pct = p.total === 0 ? 0 : (p.done / p.total) * 100;
          return (
            <Link
              key={p.id}
              href={`/learn?phase=${p.id}`}
              className="block px-3 py-2 rounded-md hover:bg-elev/40 transition group"
              aria-label={`Phase ${p.id}: ${p.title} — ${p.done} of ${p.total} locked in`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1 h-4 rounded-sm"
                    style={{ background: p.color }}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-dim group-hover:text-ink">
                    Phase {p.id}
                  </span>
                </div>
                <span className="text-[10px] text-faint font-mono">
                  {p.done}/{p.total}
                </span>
              </div>
              <div className="text-[11px] text-ink/80 leading-tight mb-1.5">
                {p.title}
              </div>
              <div
                className="w-full h-0.5 bg-elev rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full transition-all"
                  style={{ width: `${pct}%`, background: p.color }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

function NavLink({
  href,
  icon,
  label,
  pathname,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  pathname: string;
}) {
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition",
        active
          ? "bg-elev text-ink"
          : "text-dim hover:text-ink hover:bg-elev/50",
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}