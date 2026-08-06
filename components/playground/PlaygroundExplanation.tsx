"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

// Generic live-updating explanation panel for the playground tab.
// Each playground computes its own table-like content and passes it as
// children. The panel is collapsible (default open) so it lives at the
// bottom of the playground and updates as the user moves sliders.

interface PlaygroundExplanationProps {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function PlaygroundExplanation({
  title = "What's happening — the math behind the picture",
  children,
  defaultOpen = true,
}: PlaygroundExplanationProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden mt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-elev/30 transition"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Info size={14} className="text-accent" aria-hidden="true" />
          <span className="text-sm font-medium text-ink">{title}</span>
        </div>
        <span className="text-faint">
          {open ? (
            <ChevronUp size={16} aria-hidden="true" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" />
          )}
        </span>
      </button>
      {open && (
        <div className="border-t border-line bg-elev/20 text-xs">{children}</div>
      )}
    </div>
  );
}

// Reusable table primitives used by every playground's explanation.

export function ExplanationSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 border-b border-line last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-faint font-medium">
          {label}
        </span>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

// Standardized <table> with the Swadhyaya typography.
export function ExplanationTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return <table className="font-mono text-xs border-collapse">{children}</table>;
}

export function ExplanationRow({
  label,
  value,
  color,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  color?: "x" | "y" | "z" | "p1" | "p2" | "p3" | "warn" | "ok" | "dim";
  hint?: string;
}) {
  const colorClass = cn(
    color === "x" && "text-[#ff8a8a]",
    color === "y" && "text-[#8aff8a]",
    color === "z" && "text-[#8ab4ff]",
    color === "p1" && "text-[#e8864a]",
    color === "p2" && "text-[#6db3ff]",
    color === "p3" && "text-[#4dd9a8]",
    color === "warn" && "text-warn",
    color === "ok" && "text-accent",
    color === "dim" && "text-faint",
    !color && "text-ink",
  );
  return (
    <tr>
      <td className="pr-3 text-faint text-right align-top whitespace-nowrap">
        {label}
      </td>
      <td className={cn("px-2 align-top", colorClass)}>{value}</td>
      {hint && <td className="px-2 text-faint text-[10px] align-top">{hint}</td>}
    </tr>
  );
}

export function ExplanationKeyValue({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="text-faint min-w-[80px]">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

// Number formatting helpers used across playgrounds.
export const fmt = (v: number): string => {
  if (Math.abs(v) < 1e-6) return "0";
  const rounded = Math.round(v * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(2)}`;
};

export const fmtVec = (v: number): string => {
  if (Math.abs(v) < 1e-6) return "0";
  const rounded = Math.round(v * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(2)}`;
};