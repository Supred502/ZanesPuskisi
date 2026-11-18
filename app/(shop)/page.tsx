import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Hand, MessageCircle, Package } from "lucide-react";
import { ProductGrid } from "@/components/ProductCard";
import { getProducts } from "@/lib/data";
import { CATEGORIES } from "@/lib/catalog";
import { waHref } from "@/lib/site";

export default async function Home() {
  const products = await getProducts();
  const available = products.filter((p) => p.available);
  const past = products.filter((p) => !p.available);
  // Past works first: they are the proven, nicely photographed pieces
  const heroPics = [...past, ...available].filter((p) => p.images[0]).slice(0, 3);
  const pastByCategory = CATEGORIES.map((c) => ({ c, items: past.filter((p) => p.category === c && p.images[0]) })).filter((g) => g.items.length);

  return (
    <>
      {/* Hero */}
      <section className="wrap grid items-center gap-6 pt-6 pb-8 md:grid-cols-[1.1fr_1fr] md:gap-10 md:py-16">
        <div>
          <p className="eyebrow">Roku darbs Latvijā</p>
          <h1 className="mt-2 font-display text-[2.6rem] leading-[1.2] text-balance min-[380px]:text-[3.1rem] sm:text-6xl lg:text-7xl">
            Roku darbi ar mazliet <span className="text-gold">maģijas</span>
          </h1>
          <p className="mt-4 max-w-lg text-ink-soft sm:text-lg">
            Ziedi, dāvanas un dekori, kas tapuši ar rokām, ar rūpību un mīlestību. Dzimšanas dienai, svētkiem vai vienkārši tāpat.
          </p>
          <div className="mt-6 grid gap-2 min-[360px]:grid-cols-2 sm:flex sm:gap-3">
            <Link href="/produkti" className="btn btn-primary sm:!px-6">
              Produkti <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a href={waHref("Sveiki! Vēlos pasūtīt individuālu darbu.")} target="_blank" rel="noopener" className="btn btn-ghost sm:!px-6">
              Pasūtīt individuāli
            </a>
          </div>
        </div>
        {heroPics.length === 3 && (
          <div className="-order-1 grid grid-cols-3 gap-2 md:order-none md:grid-cols-2 md:grid-rows-2 md:gap-4">
            {heroPics.map((p, i) => (
              <Link
                key={p.id}
                href={`/produkti/${p.id}`}
                className={`relative overflow-hidden rounded-card border border-line bg-soft aspect-[3/4] ${i === 0 ? "md:row-span-2 md:aspect-[3/5]" : "md:aspect-square"}`}
              >
                <Image src={p.images[0]} alt={p.name} fill priority sizes="(min-width: 768px) 25vw, 33vw" className="object-cover transition-transform duration-300 hover:scale-[1.03]" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Available now */}
      <section className="wrap py-8 md:py-12" aria-labelledby="pieejams">
        <SectionHead id="pieejams" eyebrow="Gatavi paņemšanai" title="Pieejams tagad" href="/produkti" link={available.length > 8 ? `Visi produkti (${available.length})` : undefined} />
        {available.length ? (
          <ProductGrid products={available.slice(0, 8)} />
        ) : (
          <div className="card bg-soft p-8 text-center">
            <p className="text-xl font-semibold">Šobrīd visi darbi ir izpārdoti</p>
            <p className="mt-2 text-ink-soft">Bet jaunu var izveidot tieši tev: izvēlies krāsas un stilu.</p>
            <a href={waHref()} target="_blank" rel="noopener" className="btn btn-primary mt-5">Pasūtīt savu darbu</a>
          </div>
        )}
      </section>

      {/* How to order */}
      <section className="border-y border-line bg-soft/60 py-10 md:py-14" aria-labelledby="ka-pasutit">
        <div className="wrap">
          <p className="eyebrow">Vienkārši</p>
          <h2 id="ka-pasutit" className="mt-1 font-display text-4xl leading-[1.2] md:text-5xl">Kā pasūtīt</h2>
          <ol className="mt-6 grid gap-3 md:mt-8 md:grid-cols-3 md:gap-6">
            {[
              [Hand, "Izvēlies", "Paņem kādu no pieejamajiem darbiem vai iedvesmojies no iepriekšējiem."],
              [MessageCircle, "Uzraksti", "Spied „Pasūtīt”, un WhatsApp atvērsies ar gatavu ziņu. Vienojamies par krāsām un termiņu."],
              [Package, "Saņem", "Vienojamies par saņemšanu, un darbs ir tavs: gatavs dāvināšanai."],
            ].map(([Icon, title, text], i) => {
              const I = Icon as typeof Hand;
              return (
                <li key={i} className="card flex gap-4 p-4 md:block md:p-6">
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-md bg-soft text-brand"><I className="size-5" aria-hidden /></span>
                    <span className="hidden text-sm font-semibold text-ink-soft md:inline">{i + 1}. solis</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold md:mt-4 md:text-lg"><span className="md:hidden">{i + 1}. </span>{title as string}</h3>
                    <p className="mt-1 text-sm text-ink-soft md:mt-2 md:text-base">{text as string}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Past works */}
      {pastByCategory.length > 0 && (
        <section className="wrap py-10 md:py-14" aria-labelledby="iedvesma">
          <SectionHead id="iedvesma" eyebrow="Iedvesmai" title="Darbu galerija" href="/iedvesma" link="Visa galerija" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {pastByCategory.slice(0, 6).map(({ c, items }) => (
              <li key={c}>
                <Link href={`/iedvesma?k=${encodeURIComponent(c)}`} className="group relative block aspect-[4/3] overflow-hidden rounded-card border border-line bg-soft">
                  <Image src={items[0].images[0]} alt="" fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-white md:p-4">
                    <p className="text-sm leading-tight font-semibold [overflow-wrap:anywhere] md:text-base">{c}</p>
                    <p className="text-xs opacity-90 md:text-sm">{items.length} darbi</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* About teaser */}
      <section className="wrap py-6 md:py-10" aria-labelledby="par">
        <div className="card grid items-center md:grid-cols-[1fr_1.4fr]">
          <div className="relative aspect-[16/9] bg-soft md:aspect-auto md:h-full md:min-h-80">
            <Image src="/darbnica.jpeg" alt="Darbnīca, kurā top darbi" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
          </div>
          <div className="p-5 sm:p-10">
            <p className="eyebrow">Par mani</p>
            <h2 id="par" className="mt-2 font-display text-4xl leading-[1.2] md:text-5xl">Viss sākās ar manām kāzām</h2>
            <p className="mt-4 text-ink-soft">
              Pirmos ziedus veidoju savām kāzām, pirmos satīna pušķīšus kolēģēm Sieviešu dienā. Kopš tā laika katrs darbs top nesteidzīgi, ar uzmanību pret detaļām un sirds siltumu.
            </p>
            <Link href="/par-mani" className="btn btn-ghost mt-6">Lasīt vairāk</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHead({ id, eyebrow, title, href, link }: { id: string; eyebrow: string; title: string; href: string; link?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 md:mb-8">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="mt-1 font-display text-4xl leading-[1.2] md:text-5xl">{title}</h2>
      </div>
      {link && (
        <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline">
          {link} <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
