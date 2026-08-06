"use client";

// AdminProctorDashboard — consumer of the same localStorage that the
// student-side ProctorPanel writes to. Because proctoring data lives
// in localStorage, this dashboard only ever sees what runs in THIS
// browser. The intended deployment model is a teacher / proctor who
// opens /admin/proctor on the SAME machine (e.g. a shared classroom
// laptop) where students have been testing.
//
// Three sections, top to bottom:
//   1. KPI strip — total attempts, active now, completed, abandoned,
//      average violations per attempt, total violations
//   2. Live sessions list — currently active attempts ordered by most
//      recent heartbeat
//   3. History table — every attempt, expandable to show the full
//      violation log + device metadata

import { useEffect, useMemo, useState } from "react";
import {
  type Attempt,
  attemptDuration,
  listAttempts,
  VIOLATION_LABEL,
} from "@/lib/proctoring";
import {
  Activity,
  Camera,
  CheckCircle2,
  Clock3,
  EyeOff,
  Filter,
  Image as ImageIcon,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";

function fmtDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function fmtDateTime(ts: number) {
  return new Date(ts).toLocaleString();
}

function relTime(ts: number, now: number) {
  const s = Math.round((now - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function AdminProctorDashboard() {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed" | "abandoned"
  >("all");
  const [conceptFilter, setConceptFilter] = useState<string>("");

  // Poll every 5 s so "active" stays fresh without re-mounting.
  useEffect(() => {
    setAttempts(listAttempts());
    setNow(Date.now());
    const t = window.setInterval(() => {
      setAttempts(listAttempts());
      setNow(Date.now());
    }, 5000);
    return () => window.clearInterval(t);
  }, []);

  if (attempts === null) {
    return (
      <div className="text-center text-xs text-faint py-12">
        Loading attempts…
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="bg-card border border-line rounded-xl p-8 text-center">
        <ShieldCheck size={32} className="mx-auto text-faint" aria-hidden="true" />
        <h2 className="mt-3 font-serif text-xl text-ink">No proctored attempts yet</h2>
        <p className="mt-1 text-sm text-dim max-w-md mx-auto">
          When a student starts a proctored Test tab from a browser that
          shares this admin's <code className="text-ink">localStorage</code>,
          their attempt will appear here.
        </p>
      </div>
    );
  }

  const kpis = computeKpis(attempts, now);
  const conceptIds = Array.from(new Set(attempts.map((a) => a.conceptId))).sort();
  const filtered = attempts.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (conceptFilter && a.conceptId !== conceptFilter) return false;
    return true;
  });

  const active = attempts
    .filter((a) => a.status === "active" && now - a.lastHeartbeatAt < 30_000)
    .sort((a, b) => b.lastHeartbeatAt - a.lastHeartbeatAt);

  return (
    <div className="space-y-6">
      {/* ── KPI strip ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Total" value={kpis.total} />
        <Kpi label="Live now" value={kpis.live} accent={kpis.live > 0} />
        <Kpi label="Completed" value={kpis.completed} />
        <Kpi label="Abandoned" value={kpis.abandoned} />
        <Kpi
          label="Avg violations"
          value={kpis.avgViolations.toFixed(1)}
          sub={`/ attempt`}
        />
        <Kpi label="Total violations" value={kpis.totalViolations} />
      </section>

      {/* ── Live sessions ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-accent" aria-hidden="true" />
          <h2 className="font-serif text-lg text-ink">Live sessions</h2>
          <span className="text-[10px] uppercase tracking-wider text-faint ml-auto">
            {active.length} active · 30 s heartbeat
          </span>
        </div>
        {active.length === 0 ? (
          <div className="bg-card border border-line rounded-xl p-4 text-xs text-dim text-center">
            Nothing live right now.
          </div>
        ) : (
          <ul className="space-y-2">
            {active.map((a) => (
              <li
                key={a.id}
                className="bg-card border border-accent/40 rounded-xl px-4 py-2 flex items-center gap-3"
              >
                <span className="w-2 h-2 rounded-full bg-correct animate-pulse" />
                <span className="font-mono text-xs">
                  {conceptLabel(a.conceptId)}
                </span>
                <span className="text-[11px] text-dim font-mono">
                  started {relTime(a.startedAt, now)}
                </span>
                <span className="text-[11px] text-dim font-mono">
                  · {fmtDuration(attemptDuration(a, now))} in
                </span>
                <span
                  className={`ml-auto text-xs font-mono ${
                    a.violationCount > 0 ? "text-warn" : "text-correct"
                  }`}
                >
                  {a.violationCount} violation{a.violationCount === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── History ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Filter size={14} className="text-faint" aria-hidden="true" />
          <h2 className="font-serif text-lg text-ink">All attempts</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="ml-2 bg-elev border border-line rounded px-2 py-1 text-xs text-ink"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
          </select>
          <select
            value={conceptFilter}
            onChange={(e) => setConceptFilter(e.target.value)}
            className="bg-elev border border-line rounded px-2 py-1 text-xs text-ink"
          >
            <option value="">All concepts</option>
            {conceptIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <span className="text-[10px] uppercase tracking-wider text-faint ml-auto">
            {filtered.length} of {attempts.length}
          </span>
        </div>

        <div className="bg-card border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-elev/40 text-faint uppercase tracking-wider text-[10px]">
                <tr>
                  <Th>Concept</Th>
                  <Th>Status</Th>
                  <Th>Started</Th>
                  <Th>Duration</Th>
                  <Th>Score</Th>
                  <Th>Violations</Th>
                  <Th>Device</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filtered.map((a) => (
                  <RowExpandable
                    key={a.id}
                    attempt={a}
                    expanded={selectedId === a.id}
                    onToggle={() =>
                      setSelectedId((v) => (v === a.id ? null : a.id))
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Subcomponents
// ───────────────────────────────────────────────────────────────────────

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-card border rounded-xl p-3 ${
        accent ? "border-accent/50" : "border-line"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-faint">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={`font-mono text-2xl tabular-nums ${
            accent ? "text-accent" : "text-ink"
          }`}
        >
          {value}
        </span>
        {sub && <span className="text-[10px] text-faint">{sub}</span>}
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
      {children}
    </th>
  );
}

function statusBadge(a: Attempt) {
  if (a.status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-correct/40 bg-correct/10 text-correct">
        <CheckCircle2 size={11} aria-hidden="true" />
        completed
      </span>
    );
  }
  if (a.status === "abandoned") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-warn/40 bg-warn/10 text-warn">
        <Clock3 size={11} aria-hidden="true" />
        ended early
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-accent/40 bg-accent/10 text-accent">
      <Activity size={11} aria-hidden="true" />
      active
    </span>
  );
}

function conceptLabel(id: string): React.ReactNode {
  if (id === "_session") {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="font-mono px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
          site
        </span>
        <span className="text-[10px] text-faint uppercase tracking-wider">
          site-wide
        </span>
      </span>
    );
  }
  return <span className="font-mono text-ink">{id}</span>;
}

function RowExpandable({
  attempt: a,
  expanded,
  onToggle,
}: {
  attempt: Attempt;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`hover:bg-elev/30 cursor-pointer ${
          expanded ? "bg-elev/20" : ""
        }`}
        onClick={onToggle}
      >
        <td className="px-3 py-2 font-mono">{conceptLabel(a.conceptId)}</td>
        <td className="px-3 py-2">{statusBadge(a)}</td>
        <td className="px-3 py-2 font-mono text-dim whitespace-nowrap">
          {fmtDateTime(a.startedAt)}
        </td>
        <td className="px-3 py-2 font-mono tabular-nums whitespace-nowrap">
          {fmtDuration(attemptDuration(a))}
        </td>
        <td className="px-3 py-2 font-mono tabular-nums">
          {a.result
            ? `${a.result.score}/${a.result.total}${a.result.passed ? " ✓" : ""}`
            : "—"}
        </td>
        <td className="px-3 py-2">
          {a.violationCount === 0 ? (
            <span className="inline-flex items-center gap-1 text-correct text-[11px]">
              <ShieldCheck size={11} aria-hidden="true" />
              0
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-warn text-[11px]">
              <ShieldAlert size={11} aria-hidden="true" />
              {a.violationCount}
            </span>
          )}
        </td>
        <td className="px-3 py-2 text-[11px] text-dim max-w-[200px] truncate font-mono">
          {a.metadata.screen} · {a.metadata.timezone.split("/").pop()}
        </td>
        <td className="px-3 py-2 text-right text-faint text-[11px]">
          {expanded ? "▾" : "▸"}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-elev/30 px-3 py-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-faint mb-1">
                  Device metadata
                </div>
                <dl className="grid grid-cols-[110px_1fr] gap-y-1 text-[11px] font-mono">
                  <dt className="text-faint">attempt id</dt>
                  <dd className="text-ink">{a.id}</dd>
                  <dt className="text-faint">user agent</dt>
                  <dd className="text-ink truncate">{a.metadata.userAgent}</dd>
                  <dt className="text-faint">language</dt>
                  <dd className="text-ink">{a.metadata.language}</dd>
                  <dt className="text-faint">screen</dt>
                  <dd className="text-ink">{a.metadata.screen}</dd>
                  <dt className="text-faint">timezone</dt>
                  <dd className="text-ink">{a.metadata.timezone}</dd>
                  <dt className="text-faint">started</dt>
                  <dd className="text-ink">{fmtDateTime(a.startedAt)}</dd>
                  {a.endedAt && (
                    <>
                      <dt className="text-faint">ended</dt>
                      <dd className="text-ink">{fmtDateTime(a.endedAt)}</dd>
                    </>
                  )}
                </dl>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-faint mb-1">
                  Violation log (last 50)
                </div>
                {a.violations.length === 0 ? (
                  <div className="text-xs text-faint bg-canvas border border-line rounded p-3 text-center">
                    <ShieldCheck
                      size={20}
                      className="mx-auto text-correct"
                      aria-hidden="true"
                    />
                    <p className="mt-1 text-correct">Clean run.</p>
                  </div>
                ) : (
                  <>
                    <ol className="bg-canvas border border-line rounded p-2 max-h-48 overflow-y-auto space-y-1">
                      {[...a.violations].reverse().map((v) => (
                        <li
                          key={v.id}
                          className="text-[11px] flex items-start gap-2 px-1"
                        >
                          <span className="font-mono text-faint tabular-nums shrink-0">
                            {new Date(v.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-warn inline-flex items-center gap-1 shrink-0">
                            <XCircle size={10} aria-hidden="true" />
                            {VIOLATION_LABEL[v.type]}
                          </span>
                          {typeof v.durationMs === "number" && v.durationMs > 0 && (
                            <span className="text-faint font-mono">
                              {fmtDuration(v.durationMs)}
                            </span>
                          )}
                          {v.snapshot && (
                            <Camera
                              size={10}
                              className="text-accent"
                              aria-label="snapshot available"
                            />
                          )}
                          {v.context && (
                            <span className="text-dim truncate">
                              {v.context}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                    {a.violations.some((v) => v.snapshot) && (
                      <SnapshotGrid attempts={a} />
                    )}
                  </>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────
// KPI helpers
// ───────────────────────────────────────────────────────────────────────

function computeKpis(attempts: Attempt[], now: number) {
  const total = attempts.length;
  const live = attempts.filter(
    (a) => a.status === "active" && now - a.lastHeartbeatAt < 30_000,
  ).length;
  const completed = attempts.filter((a) => a.status === "completed").length;
  const abandoned = attempts.filter((a) => a.status === "abandoned").length;
  const totalViolations = attempts.reduce(
    (s, a) => s + a.violationCount,
    0,
  );
  const avgViolations = total === 0 ? 0 : totalViolations / total;
  return {
    total,
    live,
    completed,
    abandoned,
    totalViolations,
    avgViolations,
  };
}

// Hint to the compiler this is the only JSX-root export (for tree-shaking in dev)
void EyeOff; // (kept around in case we want a disabled-banner variant)

// ───────────────────────────────────────────────────────────────────────
// Snapshot grid — opens a lightbox with full resolution when clicked.
// Will move to a server `/api/proctor/evidence/:id` endpoint later;
// for now we render the data URL directly from localStorage.
// ───────────────────────────────────────────────────────────────────────
function SnapshotGrid({ attempts }: { attempts: import("@/lib/proctoring").Attempt }) {
  // Always call hooks at the top — no early return before `useState`.
  const [zoom, setZoom] = useState<string | null>(null);
  const snapshots = attempts.violations.filter((v) => v.snapshot);
  if (snapshots.length === 0) return null;
  return (
    <>
      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-wider text-faint mb-1 inline-flex items-center gap-1">
          <ImageIcon size={11} aria-hidden="true" />
          Captured snapshots ({snapshots.length})
        </div>
        <div className="grid grid-cols-4 gap-1">
          {snapshots.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => v.snapshot && setZoom(v.snapshot)}
              aria-label={`Snapshot at ${new Date(v.timestamp).toLocaleTimeString()} — ${VIOLATION_LABEL[v.type]}`}
              className="relative aspect-video bg-canvas border border-line rounded overflow-hidden hover:border-accent/50 transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.snapshot!}
                alt=""
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-1 text-[9px] px-1 py-0.5 rounded bg-canvas/85 text-faint font-mono">
                {VIOLATION_LABEL[v.type]}
              </span>
            </button>
          ))}
        </div>
      </div>
      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="max-w-3xl w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoom}
              alt="Snapshot full resolution"
              className="w-full h-auto rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
            />
            <p className="mt-3 text-center text-[11px] text-faint">
              Click anywhere to close. Snapshots stay in your browser
              until a server endpoint (`/api/proctor/evidence`) is
              wired up — then they will sync to the admin dashboard.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
