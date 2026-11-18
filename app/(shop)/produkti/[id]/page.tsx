import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Check, ChevronLeft, Flower2, MessageCircle, Sparkles } from "lucide-react";
import { AdminProductActions } from "@/components/AdminTools";
import { Gallery } from "@/components/Gallery";
import { Badge, ProductGrid } from "@/components/ProductCard";
import { ShareButton } from "@/components/ShareButton";
import { WishButton } from "@/components/WishButton";
import { getProduct, getProducts } from "@/lib/data";
import { currentPrice, formatPrice, orderMessage } from "@/lib/catalog";
import { SITE_URL, waHref } from "@/lib/site";

export async function generateStaticParams() {
  const products = await getProducts();
  // Cache Components needs at least one param at build time; "_" just 404s.
  return products.length ? products.map((p) => ({ id: p.id })) : [{ id: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/produkti/[id]">): Promise<Metadata> {
  const p = await getProduct((await params).id);
  if (!p) return {};
  const description = [p.available ? formatPrice(currentPrice(p)) : "Iepriekšējais darbs", p.description].filter(Boolean).join(" — ").slice(0, 200);
  return { title: p.name, description, openGraph: { title: p.name, description, images: p.images.slice(0, 1) } };
}

export default function ProductPage({ params }: PageProps<"/produkti/[id]">) {
  return (
    <Suspense fallback={<div className="wrap mt-10 h-[70vh] animate-pulse rounded-card bg-soft" />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

async function ProductDetails({ params }: Pick<PageProps<"/produkti/[id]">, "params">) {
  const p = await getProduct((await params).id);
  if (!p) notFound();
  const url = `${SITE_URL}/produkti/${p.id}`;
  const price = currentPrice(p);
  const onSale = price < p.price;
  const related = (await getProducts()).filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4);
  const back = p.available ? { href: "/produkti", label: "Produkti" } : { href: "/iedvesma", label: "Iedvesma" };
  const order = waHref(p.available ? orderMessage(p, url) : `Sveiki! Vēlos pasūtīt līdzīgu darbu kā „${p.name}”.\n${url}`);

  return (
    <div className="wrap pt-6 pb-24 md:pb-0">
      <Link href={back.href} className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand">
        <ChevronLeft className="size-4" aria-hidden /> {back.label}
      </Link>

      <article className="mt-4 grid gap-8 md:grid-cols-2 lg:gap-14">
        {p.images.length ? <Gallery images={p.images} name={p.name} /> : (
          <div className="grid aspect-[4/5] place-items-center rounded-card border border-line bg-soft"><Flower2 className="size-12 text-brand/30" aria-hidden /></div>
        )}

        <div className="md:sticky md:top-24 md:self-start">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-soft text-brand">{p.category}</Badge>
            {p.available ? <Badge className="bg-ok-bg text-ok">Pieejams</Badge> : <Badge className="bg-line/60 text-ink-soft">Pārdots</Badge>}
            {p.available && onSale && <Badge className="bg-gold-bg text-gold"><Sparkles className="mr-1 inline size-3" aria-hidden />Svētku piedāvājums</Badge>}
          </div>
          <h1 className="mt-4 text-3xl leading-tight font-semibold text-balance sm:text-4xl">{p.name}</h1>

          {p.available ? (
            <p className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-brand">{formatPrice(price)}</span>
              {onSale && <s className="text-lg text-ink-soft">{formatPrice(p.price)}</s>}
            </p>
          ) : (
            <p className="mt-4 rounded-md border border-line bg-soft/60 p-4 text-ink-soft">
              Šis darbs jau ir atradis mājas, bet varu izveidot līdzīgu, arī citās krāsās.
            </p>
          )}

          {p.description && <p className="mt-6 whitespace-pre-line text-ink-soft">{p.description}</p>}

          <AdminProductActions id={p.id} available={p.available} />

          <div className="mt-8 hidden flex-wrap gap-3 md:flex">
            <a href={order} target="_blank" rel="noopener" className="btn btn-primary flex-1 !text-base">
              <MessageCircle className="size-5" aria-hidden /> {p.available ? "Pasūtīt WhatsApp" : "Pasūtīt līdzīgu"}
            </a>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <WishButton id={p.id} name={p.name} withLabel />
            <ShareButton title={p.name} url={url} />
            {p.tiktokLink && <a href={p.tiktokLink} target="_blank" rel="noopener" className="btn btn-ghost">Video TikTok</a>}
          </div>

          <ul className="mt-8 space-y-2 border-t border-line pt-6 text-sm text-ink-soft">
            {["Roku darbs, katrs ir unikāls", "Krāsas, stilu un budžetu var pielāgot", "Dāvanu noformējums pēc vēlēšanās"].map((t) => (
              <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />{t}</li>
            ))}
          </ul>
        </div>
      </article>

      {/* Phones: order button always in reach */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 p-3 backdrop-blur md:hidden">
        <a href={order} target="_blank" rel="noopener" className="btn btn-primary w-full !text-base">
          <MessageCircle className="size-5" aria-hidden /> {p.available ? `Pasūtīt · ${formatPrice(price)}` : "Pasūtīt līdzīgu"}
        </a>
      </div>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="lidzigi">
          <h2 id="lidzigi" className="mb-6 font-display text-4xl leading-[1.2] md:text-5xl">Līdzīgi darbi</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
