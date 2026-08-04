import Link from "next/link";
import { ArrowRight, Sparkles, Map, Trophy, Layers } from "lucide-react";
import { CONCEPTS, PHASES } from "@/lib/curriculum";

export default function HomePage() {
  return (
    <div className="relative">
      {/* Subtle background grid */}
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />

      <section className="relative max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-elev/40 text-xs text-dim">
          <Sparkles size={12} className="text-accent" />
          <span>Learn by playing. No formula memorization.</span>
        </div>

        <h1 className="mt-6 font-serif text-5xl sm:text-6xl tracking-tight text-ink leading-[1.05]">
          Linear algebra,
          <br />
          <span className="text-accent">the way your mind works.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-dim leading-relaxed">
          From a single number on a line to SVD and eigen-decomposition — see every
          concept as a <span className="text-ink">story</span>,{" "}
          <span className="text-ink">drag it</span>, and{" "}
          <span className="text-ink">discover the formula</span> by playing. The
          chain never breaks. Every topic earns the next.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/learn"
            className="group inline-flex items-center gap-2 px-5 py-3 rounded-md bg-accent text-canvas font-medium hover:bg-accent/90 transition"
          >
            Start learning
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition" />
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-line text-ink hover:bg-elev transition"
          >
            <Trophy size={16} />
            <span>Your progress</span>
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-xs text-faint">
          <span>{CONCEPTS.length} concepts</span>
          <span>·</span>
          <span>{PHASES.length} phases</span>
          <span>·</span>
          <span>Story-first, no jargon</span>
          <span>·</span>
          <span>Track your progress</span>
        </div>
      </section>

      <section className="relative max-w-5xl mx-auto px-6 py-12 border-t border-line">
        <div className="grid sm:grid-cols-3 gap-4">
          <Feature
            icon={<Map size={18} />}
            title="The full chain"
            body="From a number on a line, through systems of equations, vector spaces, four fundamental subspaces, eigen-decomposition, and SVD. Nothing skipped."
          />
          <Feature
            icon={<Sparkles size={18} />}
            title="Discover, don't memorize"
            body="Every concept is a story. Every formula is a label the student earns by playing. No flashcards. No proofs before pictures."
          />
          <Feature
            icon={<Trophy size={18} />}
            title="Track your growth"
            body="Every concept you lock in adds XP, levels you up, and feeds your streak. Your full progress is one glance away on the leaderboard."
          />
        </div>
      </section>

      <section className="relative max-w-5xl mx-auto px-6 py-12 border-t border-line">
        <h2 className="font-serif text-2xl text-ink">The phases</h2>
        <p className="mt-1 text-sm text-dim max-w-2xl">
          The curriculum is a directed graph. Each phase unlocks the next when you
          lock in the intuition. Iyengar sequence: concrete first, abstraction earned.
        </p>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PHASES.map((p) => {
            const count = CONCEPTS.filter((c) => c.phase === p.id).length;
            return (
              <Link
                key={p.id}
                href="/learn"
                className="block p-4 rounded-lg border border-line bg-elev/30 hover:bg-elev/60 transition group"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-1 h-5 rounded-sm"
                    style={{ background: p.color }}
                  />
                  <span className="text-xs text-dim">Phase {p.id}</span>
                </div>
                <h3 className="mt-2 font-medium text-ink group-hover:text-accent transition">
                  {p.title}
                </h3>
                <p className="text-xs text-dim mt-1">{p.subtitle}</p>
                <div className="mt-3 text-[10px] text-faint font-mono">
                  {count} concepts
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="relative max-w-5xl mx-auto px-6 py-12 border-t border-line">
        <h2 className="font-serif text-2xl text-ink">Built on the shoulders of</h2>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-dim">
          <span>
            <a className="text-ink hover:text-accent" href="https://nptel.ac.in/courses/111106051" target="_blank" rel="noopener noreferrer">Prof. Sudarshan Iyengar</a> (IIT Madras NPTEL)
          </span>
          <span className="text-faint">·</span>
          <span>
            <a className="text-ink hover:text-accent" href="https://sudarshansudarshan.github.io/codershigh/matrixmystics/" target="_blank" rel="noopener noreferrer">Codershigh Matrix Mystics</a> workshop
          </span>
          <span className="text-faint">·</span>
          <span>
            <a className="text-ink hover:text-accent" href="https://www.3blue1brown.com/topics/linear-algebra" target="_blank" rel="noopener noreferrer">3Blue1Brown</a> visual sequencing
          </span>
          <span className="text-faint">·</span>
          <span>
            <a className="text-ink hover:text-accent" href="https://betterexplained.com/articles/linear-algebra-guide/" target="_blank" rel="noopener noreferrer">BetterExplained</a> voice
          </span>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="p-5 rounded-lg border border-line bg-elev/30">
      <div className="text-accent">{icon}</div>
      <h3 className="mt-3 font-medium text-ink">{title}</h3>
      <p className="mt-1.5 text-sm text-dim leading-relaxed">{body}</p>
    </div>
  );
}
