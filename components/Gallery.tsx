"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const go = (d: number) => setI((n) => (n + d + images.length) % images.length);
  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-card border border-line bg-soft">
        {images.map((src, n) => (
          <Image
            key={src}
            src={src}
            alt={n === 0 ? name : `${name}, ${n + 1}. attēls`}
            fill
            priority={n === 0}
            sizes="(min-width: 1024px) 580px, 100vw"
            className={`object-cover transition-opacity duration-200 ${n === i ? "opacity-100" : "opacity-0"}`}
            aria-hidden={n !== i}
          />
        ))}
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Iepriekšējais attēls" className="btn-icon absolute top-1/2 left-3 -translate-y-1/2 bg-surface/95"><ChevronLeft className="size-5" aria-hidden /></button>
            <button type="button" onClick={() => go(1)} aria-label="Nākamais attēls" className="btn-icon absolute top-1/2 right-3 -translate-y-1/2 bg-surface/95"><ChevronRight className="size-5" aria-hidden /></button>
            <span className="absolute right-3 bottom-3 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">{i + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, n) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setI(n)}
                aria-label={`Rādīt ${n + 1}. attēlu`}
                aria-current={n === i}
                className={`relative block aspect-square w-full overflow-hidden rounded-md border-2 ${n === i ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                <Image src={src} alt="" fill sizes="110px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
