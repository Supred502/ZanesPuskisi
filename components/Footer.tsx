import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SITE_NAME, TIKTOK_URL, waHref } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 bg-brand text-white/75">
      <div className="wrap grid grid-cols-2 gap-8 py-10 sm:grid-cols-[2fr_1fr_1fr] sm:py-12">
        <div className="col-span-2 sm:col-span-1">
          <Logo className="text-gold-bright" />
          <p className="mt-3 max-w-sm text-sm">Roku darbi, dāvanas un dekori, kas top Latvijā. Katrs darbs ir unikāls.</p>
        </div>
        <FooterList title="Veikals" links={[["/produkti", "Pieejamie produkti"], ["/iedvesma", "Iepriekšējie darbi"], ["/velmes", "Vēlmju saraksts"]]} />
        <FooterList title="Kontakti" links={[[waHref(), "WhatsApp"], [TIKTOK_URL, "TikTok"], ["/par-mani", "Par mani"], ["/privatums", "Privātums"]]} />
      </div>
      <div className="wrap border-t border-white/15 py-5 text-xs">© {SITE_NAME}</div>
    </footer>
  );
}

function FooterList({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gold-bright">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([href, label]) => (
          <li key={label}>
            {href.startsWith("/") && !href.startsWith("/wa") ? (
              <Link href={href} className="hover:text-white">{label}</Link>
            ) : (
              <a href={href} target="_blank" rel="noopener" className="hover:text-white">{label}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
