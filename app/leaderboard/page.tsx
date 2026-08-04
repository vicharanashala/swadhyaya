"use client";
import {
  useProgress,
  levelFromXP,
  xpForLevel,
  xpForNextLevel,
  MAX_XP,
} from "@/lib/progress";
import {
  Trophy,
  Medal,
  Award,
  Target,
  Flame,
  Zap,
  Download,
  Upload,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  CONCEPT_BY_ID,
  PHASES,
  PHASE_PREFIX,
  isConceptId,
  type ConceptId,
  getConceptsByPhase,
  type Phase,
} from "@/lib/curriculum";

const MAX_IMPORT_XP = MAX_XP * 1000;
const MAX_STREAK = 9999;

interface ImportShape {
  schema?: string;
  completed?: unknown;
  xp?: unknown;
  streak?: unknown;
  lastVisit?: unknown;
  lensModes?: unknown;
}

function isISODate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function validateImport(raw: unknown): {
  ok: true;
  data: {
    completed: ConceptId[];
    xp: number;
    streak: number;
    lastVisit: string;
    lensModes: string[];
  };
} | { ok: false; reason: string } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, reason: "File is not a JSON object." };
  }
  const r = raw as ImportShape;
  if (r.schema !== undefined && r.schema !== "swadhyaya.v1") {
    return { ok: false, reason: `Unknown schema: ${String(r.schema)}` };
  }
  if (!Array.isArray(r.completed)) {
    return { ok: false, reason: "`completed` must be an array." };
  }
  const completed: ConceptId[] = [];
  const seen = new Set<string>();
  for (const item of r.completed) {
    if (typeof item !== "string") {
      return { ok: false, reason: "`completed` must contain only strings." };
    }
    if (!isConceptId(item)) {
      return {
        ok: false,
        reason: `Unknown concept id in file: ${item}.`,
      };
    }
    if (seen.has(item)) continue;
    seen.add(item);
    completed.push(item);
  }
  if (typeof r.xp !== "number" || !Number.isFinite(r.xp)) {
    return { ok: false, reason: "`xp` must be a finite number." };
  }
  if (r.xp < 0 || r.xp > MAX_IMPORT_XP) {
    return {
      ok: false,
      reason: `XP must be between 0 and ${MAX_IMPORT_XP}.`,
    };
  }
  const streak =
    typeof r.streak === "number" && Number.isFinite(r.streak)
      ? Math.max(1, Math.min(MAX_STREAK, Math.floor(r.streak)))
      : 1;
  const lastVisit = isISODate(r.lastVisit)
    ? r.lastVisit
    : new Date().toISOString().slice(0, 10);
  const lensModes = Array.isArray(r.lensModes)
    ? r.lensModes.filter((v): v is string => typeof v === "string").slice(0, 20)
    : [];
  return {
    ok: true,
    data: { completed, xp: r.xp, streak, lastVisit, lensModes },
  };
}

export default function LeaderboardPage() {
  const completed = useProgress((s) => s.completed);
  const xp = useProgress((s) => s.xp);
  const streak = useProgress((s) => s.streak);
  const totalConcepts = Object.keys(CONCEPT_BY_ID).length;
  const [resetConfirm, setResetConfirm] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<boolean>(false);

  const handleExport = () => {
    const data = {
      completed,
      xp,
      streak,
      lastVisit: new Date().toISOString().slice(0, 10),
      lensModes: useProgress.getState().lensModes,
      exportedAt: new Date().toISOString(),
      schema: "swadhyaya.v1",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swadhyaya-progress-${data.lastVisit}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed: unknown = JSON.parse(String(e.target?.result || "{}"));
        const v = validateImport(parsed);
        if (!v.ok) {
          setImportErr(true);
          setImportMsg(v.reason);
          return;
        }
        const current = useProgress.getState();
        const apply = () => {
          useProgress.setState({
            completed: v.data.completed,
            xp: v.data.xp,
            streak: v.data.streak,
            lastVisit: v.data.lastVisit,
            lensModes: v.data.lensModes,
          });
          setImportErr(false);
          setImportMsg(
            `Imported ${v.data.completed.length} concepts, ${v.data.xp} XP.`,
          );
        };
        // Confirm overwrite if the user already has progress.
        if (current.completed.length > 0 && !confirm(
          `Replace your current progress (${current.completed.length} concepts, ${current.xp} XP) with the file's contents?`,
        )) {
          setImportErr(false);
          setImportMsg("Import cancelled.");
          return;
        }
        apply();
      } catch {
        setImportErr(true);
        setImportMsg("Could not parse the file as JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    useProgress.getState().reset();
    setResetConfirm(false);
  };

  const phaseProgress = useMemo(() => {
    return (PHASES.map((p) => p.id) as Phase[]).map((id) => {
      const phaseConcepts = getConceptsByPhase(id);
      const prefix = PHASE_PREFIX[id];
      const done = phaseConcepts.filter((c) => completed.includes(c.id))
        .length;
      return {
        ...PHASES.find((p) => p.id === id)!,
        total: phaseConcepts.length,
        done,
        prefix,
      };
    });
  }, [completed]);

  const recentUnlocks = useMemo(() => {
    return completed.slice(-10).reverse();
  }, [completed]);

  const level = levelFromXP(xp);
  const lvlStart = xpForLevel(level);
  const lvlEnd = xpForNextLevel(level);
  const isMaxLevel = lvlEnd === MAX_XP;
  const lvlPct = isMaxLevel
    ? 100
    : ((xp - lvlStart) / (lvlEnd - lvlStart)) * 100;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <header className="mb-6">
        <div className="text-[10px] text-faint uppercase tracking-wider flex items-center gap-1">
          <Trophy size={10} className="text-accent" />
          Your Progress
        </div>
        <h1 className="font-serif text-3xl text-ink mt-1">Leaderboard</h1>
        <p className="text-sm text-dim mt-1">
          Track concepts unlocked, XP earned, and your current level.
        </p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="flex items-center gap-2 text-[10px] text-faint uppercase tracking-wider">
            <Target size={11} /> Concepts
          </div>
          <div className="mt-1 text-2xl font-mono text-ink">
            {completed.length}
            <span className="text-faint text-sm"> / {totalConcepts}</span>
          </div>
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="flex items-center gap-2 text-[10px] text-faint uppercase tracking-wider">
            <Zap size={11} /> XP
          </div>
          <div className="mt-1 text-2xl font-mono text-accent">{xp}</div>
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="flex items-center gap-2 text-[10px] text-faint uppercase tracking-wider">
            <Flame size={11} /> Streak
          </div>
          <div className="mt-1 text-2xl font-mono text-warn">{streak}</div>
        </div>
      </div>

      {/* Level progress */}
      <div className="bg-card border border-line rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider">
              Current Level
            </div>
            <div className="text-2xl font-mono text-ink">Level {level}</div>
          </div>
          <div className="text-right text-xs text-dim">
            {isMaxLevel
              ? "Max level reached"
              : `${xp - lvlStart} / ${lvlEnd - lvlStart} XP to next`}
          </div>
        </div>
        <div
          className="w-full h-2 bg-elev rounded-full overflow-hidden"
          role="progressbar"
          aria-label="Level progress"
          aria-valuenow={Math.round(lvlPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${lvlPct}%` }}
          />
        </div>
      </div>

      {/* Phase progress */}
      <div className="bg-card border border-line rounded-xl p-4 mb-6">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
          Phases
        </div>
        <div className="space-y-2.5">
          {phaseProgress.map((p) => {
            const pct = p.total === 0 ? 0 : (p.done / p.total) * 100;
            return (
              <div key={p.id} className="flex items-center gap-3">
                <span
                  className="w-1 h-5 rounded-sm shrink-0"
                  style={{ background: p.color }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink truncate">{p.title}</span>
                    <span className="text-faint font-mono shrink-0 ml-2">
                      {p.done}/{p.total}
                    </span>
                  </div>
                  <div
                    className="w-full h-1.5 bg-elev rounded-full overflow-hidden"
                    role="progressbar"
                    aria-label={`${p.title} progress`}
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full transition-all"
                      style={{ width: `${pct}%`, background: p.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent unlocks */}
      <div className="bg-card border border-line rounded-xl p-4 mb-6">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
          Recent unlocks
        </div>
        {recentUnlocks.length === 0 ? (
          <div className="text-center py-8">
            <Award size={28} className="mx-auto text-faint" />
            <p className="mt-3 text-sm text-dim">
              No concepts unlocked yet. Start with L1 on the course map.
            </p>
          </div>
        ) : (
          <ol className="space-y-1.5">
            {recentUnlocks.map((id, i) => {
              const c = CONCEPT_BY_ID[id];
              if (!c) return null;
              return (
                <li
                  key={id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-elev/40 transition"
                >
                  {i === 0 ? (
                    <Medal size={14} className="text-accent shrink-0" />
                  ) : (
                    <span className="w-3.5 text-center text-[10px] text-faint font-mono">
                      #{i + 1}
                    </span>
                  )}
                  <span className="text-[10px] text-faint font-mono w-6">
                    {id}
                  </span>
                  <span className="text-sm text-ink flex-1 truncate">
                    {c.title}
                  </span>
                  <span className="text-[10px] text-accent font-mono">
                    +{c.xp} XP
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Data management — own your progress */}
      <div className="bg-card border border-line rounded-xl p-4">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
          Your data
        </div>
        <p className="text-xs text-dim leading-relaxed mb-4">
          Progress is stored in this browser only. Back it up by exporting to
          a JSON file; restore on another device by importing it.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-line text-sm text-ink hover:bg-elev transition"
          >
            <Download size={14} />
            Export
          </button>
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-line text-sm text-ink hover:bg-elev transition cursor-pointer">
            <Upload size={14} />
            Import
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-label="Import progress file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = ""; // allow re-importing same file
              }}
            />
          </label>
          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-warn/40 text-sm text-warn hover:bg-warn/10 transition"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-2 rounded-md bg-warn text-canvas text-sm font-medium hover:bg-warn/90 transition"
              >
                Confirm reset
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3 py-2 rounded-md border border-line text-sm text-dim hover:bg-elev transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {importMsg && (
          <div
            role={importErr ? "alert" : "status"}
            className={`mt-3 text-xs ${importErr ? "text-warn" : "text-dim"}`}
          >
            {importMsg}
          </div>
        )}
      </div>
    </div>
  );
}