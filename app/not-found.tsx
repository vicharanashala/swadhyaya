import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-elev/60 border border-line text-faint mb-6">
        <Compass size={20} />
      </div>
      <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
        Error 404
      </div>
      <h1 className="font-serif text-4xl text-ink mb-3">
        That page hasn't been written yet.
      </h1>
      <p className="text-dim leading-relaxed mb-8">
        The curriculum is a directed graph, not a list — every concept is a
        step in a chain. If you got here from a broken link, the route may
        have moved. Head back to the course map.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-canvas font-medium hover:bg-accent/90 transition"
        >
          <Compass size={14} />
          <span>Open the course map</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-line text-ink hover:bg-elev transition"
        >
          <ArrowLeft size={14} />
          <span>Back to home</span>
        </Link>
      </div>
    </div>
  );
}