"use client";

import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { ProductGrid } from "@/components/ProductCard";
import { useWishlist } from "@/components/wishlist";
import type { Product } from "@/lib/catalog";
import { waHref } from "@/lib/site";

export function WishlistView({ products }: { products: Product[] }) {
  const ids = useWishlist();
  const saved = products.filter((p) => ids.includes(p.id)); // removed products just drop out
  if (!saved.length)
    return (
      <div className="card bg-soft p-10 text-center">
        <Heart className="mx-auto size-8 text-brand" aria-hidden />
        <p className="mt-3 text-xl font-semibold">Vēl nekas nav saglabāts</p>
        <p className="mt-2 text-ink-soft">Spied sirsniņu uz kāda darba, lai to atrastu šeit.</p>
        <Link href="/produkti" className="btn btn-primary mt-5">Apskatīt produktus</Link>
      </div>
    );
  const msg = `Sveiki! Mani interesē šie darbi:\n${saved.map((p) => `• ${p.name} — ${location.origin}/produkti/${p.id}`).join("\n")}`;
  return (
    <>
      <div className="mb-8">
        <a href={waHref(msg)} target="_blank" rel="noopener" className="btn btn-primary">
          <MessageCircle className="size-4" aria-hidden /> Jautāt par visiem ({saved.length}) WhatsApp
        </a>
      </div>
      <ProductGrid products={saved} />
    </>
  );
}
