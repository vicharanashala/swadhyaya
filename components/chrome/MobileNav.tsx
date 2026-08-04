"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Trophy, BookOpen, Home } from "lucide-react";
import { cn } from "@/lib/cn";

// MobileNav: bottom bar shown only on small screens (below md=768px).
// Gives phone users access to the same primary destinations the SideRail
// surfaces on desktop (Course Map / Progress / Credits) plus Home.
export function MobileNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    {
      href: "/learn",
      label: "Map",
      icon: Map,
      match: (p: string) => p === "/learn" || p.startsWith("/learn/"),
    },
    {
      href: "/leaderboard",
      label: "Progress",
      icon: Trophy,
      match: (p: string) => p === "/leaderboard",
    },
    {
      href: "/about",
      label: "Credits",
      icon: BookOpen,
      match: (p: string) => p === "/about",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 border-t border-line bg-canvas/95 backdrop-blur-xl flex items-stretch">
      {items.map((it) => {
        const Icon = it.icon;
        const active = it.match(pathname || "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition",
              active
                ? "text-accent"
                : "text-faint hover:text-dim",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={16} />
            <span className="text-[10px] uppercase tracking-wider">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}