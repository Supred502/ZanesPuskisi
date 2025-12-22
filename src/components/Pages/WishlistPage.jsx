import React, { useMemo, useState } from "react";
import ProductModal from "../Modal/ProductModal.jsx";
import useWishlist from "../../hooks/useWishlist";
import readImagesStore from "../../utils/readImagesStore";
import { pushUrlPreserveScroll, replaceUrlPreserveScroll } from "../../utils/history";
import ProgressiveImage from "../ProgressiveImage";

import { openWhatsApp } from "../../utils/whatsapp";

function buildShareLink(productId) {
  try {
    return `${window.location.origin}/s/${productId}`;
  } catch {
    return `/s/${productId}`;
  }
}


export default function WishlistPage({ user }) {
  const { mode, loading, items, clearLocal } = useWishlist(user);
  const [selected, setSelected] = useState(null);

  const normalized = useMemo(
    () =>
      (items || []).map((it) => ({
        productId: it.productId || it.id,
        name: it.name,
        description: it.description,
        price: it.price,
        imageURL: it.imageURL,
        holidaySpecial: it.holidaySpecial,
        _raw: it,
      })),
    [items]
  );

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vēlmju saraksts</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {mode === "synced"
              ? "Sinhronizēts ar kontu."
              : "Saglabāts tikai šajā ierīcē. Pieslēdzies, lai sinhronizētu starp ierīcēm."}
          </p>
        </div>

        {mode === "local" && normalized.length > 0 && (
          <button type="button" className="btn btn-ghost" onClick={clearLocal}>
            Notīrīt
          </button>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <div style={{ color: "var(--muted)" }}>Ielādē...</div>
        ) : normalized.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>Nav saglabātu produktu.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {normalized.map((it) => (
              <div
                key={it.productId}
                className="border rounded p-4 h-full flex flex-col"
                style={{ backgroundColor: "var(--panel)", borderColor: "var(--btn-ghost-border)" }}
              >
                <div className="w-full aspect-square rounded overflow-hidden mb-3 relative" style={{ background: "var(--hero-bg)" }}>
                  {it.imageURL ? (
                    <ProgressiveImage
                      src={it.imageURL}
                      alt={it.name || "Produkts"}
                      className="w-full h-full"
                      objectFit="cover"
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--muted)" }}>
                      Nav attēla
                    </div>
                  )}

                  {it.holidaySpecial && (
                    <div
                      className="absolute top-3 right-3 p-1 rounded-lg pointer-events-none select-none"
                      style={{ backgroundColor: "var(--panel)", border: "1px solid var(--btn-ghost-border)" }}
                      aria-hidden="true"
                    >
                      <img
                        src="/holiday.png"
                        alt=""
                        className="w-8 h-8"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  {it.price != null && <div className="text-xl font-semibold">{it.price} €</div>}
                  <div className="font-semibold text-lg truncate" style={{ minWidth: 0 }}>{it.name || "Produkts"}</div>
                </div>

                {/* description removed from cards for consistent heights */}

                <div className="mt-auto md:pt-4 btn-group">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const cached = readImagesStore.getProduct?.(it.productId);
                      setSelected(
                        cached || {
                          id: it.productId,
                          name: it.name,
                          description: it.description,
                          price: it.price,
                          images: it.imageURL ? [it.imageURL] : [],
                          available: true,
                        }
                      );
                      pushUrlPreserveScroll(`${window.location.pathname}#product-${it.productId}`);
                    }}
                  >
                    Atvērt
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const share = buildShareLink(it.productId);
                      const text = `Sveiki! Mani interesē šis produkts: ${it.name || it.productId}.\nCena: ${it.price ?? "?"} €\nSaite: ${share}`;
                      openWhatsApp(text);
                    }}
                  >
                    WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ProductModal
          product={selected}
          user={user}
          startIndex={0}
          onClose={() => {
            setSelected(null);
            replaceUrlPreserveScroll(window.location.pathname);
          }}
        />
      )}
    </main>
  );
}
