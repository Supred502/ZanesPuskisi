"use client";

import { Heart } from "lucide-react";
import { toggleWish, useWishlist } from "@/components/wishlist";

export function WishButton({ id, name, withLabel = false, className = "" }: { id: string; name: string; withLabel?: boolean; className?: string }) {
  const saved = useWishlist().includes(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault(); // inside a card link: don't open the product
        toggleWish(id);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Izņemt „${name}” no vēlmēm` : `Saglabāt „${name}” vēlmēs`}
      className={`${withLabel ? "btn btn-ghost" : "btn-icon"} ${className}`}
    >
      <Heart className={`size-5 transition-colors ${saved ? "fill-brand text-brand" : "text-ink-soft"}`} aria-hidden />
      {withLabel && (saved ? "Saglabāts vēlmēs" : "Saglabāt vēlmēs")}
    </button>
  );
}

export function WishCount() {
  const n = useWishlist().length;
  return n ? <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-md bg-gold-bright px-1 text-[11px] font-semibold text-brand">{n}</span> : null;
}
