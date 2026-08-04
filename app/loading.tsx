import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div
      className="max-w-4xl mx-auto px-6 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 text-dim">
        <Loader2 size={16} className="animate-spin text-accent motion-reduce:animate-none" />
        <span className="text-sm">Loading…</span>
      </div>
      <div className="mt-6 space-y-3" aria-hidden="true">
        <div className="h-6 w-1/3 bg-elev/60 rounded motion-reduce:animate-none animate-pulse" />
        <div className="h-4 w-2/3 bg-elev/40 rounded motion-reduce:animate-none animate-pulse" />
        <div className="h-4 w-1/2 bg-elev/40 rounded motion-reduce:animate-none animate-pulse" />
        <div className="mt-8 h-40 w-full bg-elev/30 border border-line rounded-xl motion-reduce:animate-none animate-pulse" />
      </div>
    </div>
  );
}