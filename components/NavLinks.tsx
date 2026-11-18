"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/produkti", label: "Produkti" },
  { href: "/iedvesma", label: "Iedvesma" },
  { href: "/par-mani", label: "Par mani" },
];

export function NavLinks({ className = "" }: { className?: string }) {
  const path = usePathname();
  return (
    <nav aria-label="Galvenā izvēlne" className={className}>
      {LINKS.map((l) => {
        const active = path === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-white/10 text-gold-bright" : "text-white/75 hover:text-white"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
