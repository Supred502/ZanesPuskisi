import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { WishCount } from "@/components/WishButton";
import { SITE_NAME, waHref } from "@/lib/site";

// Navy bar with the gold-and-cream logo, like the brand image.
export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-brand text-white shadow-[0_1px_0_rgb(212_176_98/0.35)]">
      <div className="wrap flex h-16 items-center gap-2 sm:gap-4">
        <Link href="/" className="min-w-0 text-gold-bright" aria-label={`${SITE_NAME} — sākums`}>
          <Logo />
        </Link>
        <NavLinks className="ml-6 hidden md:flex" />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link href="/velmes" className="btn relative min-w-11 border-white/25 px-0 text-white hover:bg-white/10" aria-label="Vēlmju saraksts">
            <Heart className="size-5" aria-hidden />
            <WishCount />
          </Link>
          <a href={waHref()} className="btn btn-gold" target="_blank" rel="noopener">
            <MessageCircle className="size-4" aria-hidden />
            <span className="hidden sm:inline">Pasūtīt</span>
            <span className="sr-only sm:hidden">Pasūtīt WhatsApp</span>
          </a>
        </div>
      </div>
      <NavLinks className="wrap -mt-1 flex gap-1 pb-1.5 md:hidden" />
    </header>
  );
}
