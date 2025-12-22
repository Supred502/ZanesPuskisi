import { useState, useEffect, useRef } from "react";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import ProductModal from "../Modal/ProductModal.jsx";
import ImageRotator from "../ImageRotator.jsx";
import readImagesStore from "../../utils/readImagesStore.js";
import useAuth from "../../hooks/useAuth";
import { pushUrlPreserveScroll, replaceUrlPreserveScroll } from "../../utils/history";

export default function InspirationsGrid({ maxRows } = {}) {
  const { user } = useAuth();
  // Home page shows a preview; use a stable upper bound for desktop columns.
  const maxPreviewLimit = maxRows ? 4 * maxRows : null;

  const [initialCache] = useState(() =>
    readImagesStore.getCachedProducts?.({
      available: false,
      limit: maxPreviewLimit ?? undefined,
    }) || null
  );

  const [sold, setSold] = useState(() => initialCache || []);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [renderLimit, setRenderLimit] = useState(() => (maxRows ? 0 : 24));
  const sentinelRef = useRef(null);

  const fetchSeqRef = useRef(0);

  useEffect(() => {
    // Firestore efficiency: reuse in-memory cache across navigation within the same session.
    const cached = readImagesStore.getCachedProducts?.({
      available: false,
      limit: maxPreviewLimit ?? undefined,
    });

    if (cached) {
      const schedule = typeof queueMicrotask === "function" ? queueMicrotask : (fn) => setTimeout(fn, 0);
      schedule(() => setSold(cached));
      return;
    }

    const schedule = typeof queueMicrotask === "function" ? queueMicrotask : (fn) => setTimeout(fn, 0);
    const seq = ++fetchSeqRef.current;
    let cancelled = false;

    readImagesStore
      .getOrFetchProducts?.({
        available: false,
        limit: maxPreviewLimit ?? undefined,
        fetcher: async () => {
          const q = query(
            collection(db, "products"),
            where("available", "==", false),
            ...(maxPreviewLimit ? [limit(maxPreviewLimit)] : [])
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        },
      })
      .then((items) => {
        if (cancelled) return;
        if (seq !== fetchSeqRef.current) return;
        schedule(() => setSold(items || []));
      });

    return () => {
      cancelled = true;
    };
  }, [maxPreviewLimit]);

  useEffect(() => {
    readImagesStore.addFromProducts(sold);
  }, [sold]);

  // Track window width to compute columns when a row limit is requested
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    let rafId = 0;
    function onResize() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        setWindowWidth(window.innerWidth);
      });
    }
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const columns = windowWidth >= 1024 ? 4 : windowWidth >= 768 ? 3 : windowWidth >= 640 ? 2 : 1;

  const minRenderLimit = Math.max(24, columns * 6);

  useEffect(() => {
    if (maxRows) return;
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries?.some((e) => e.isIntersecting);
        if (!hit) return;
        setRenderLimit((n) => Math.min(sold.length, n + Math.max(columns * 6, 24)));
      },
      { rootMargin: "600px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [columns, maxRows, sold.length]);

  const visibleCount = maxRows
    ? columns * maxRows
    : Math.min(sold.length, Math.max(renderLimit || 0, minRenderLimit));
  const visibleSold = sold.slice(0, visibleCount);

  // Idle-prefetch additional images for a few rows near the top.
  useEffect(() => {
    const PREFETCH_ROWS_AHEAD = 2;
    const prefetchCount = Math.max(0, columns * (PREFETCH_ROWS_AHEAD + 1));
    const candidates = visibleSold.slice(0, prefetchCount);

    const toPrefetch = [];
    for (const p of candidates) {
      const urls = Array.isArray(p?.images)
        ? p.images
        : p?.imageURL
        ? [p.imageURL]
        : [];
      for (const u of urls.slice(1)) toPrefetch.push(u);
    }

    if (toPrefetch.length === 0) return;

    readImagesStore.prefetchImagesIdle?.(toPrefetch);
  }, [columns, visibleSold]);

  return (
    <section id="idejas" className="p-8" style={{ background: 'var(--hero-bg)', color: 'var(--text)' }}>
      <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text)' }}>Iedvesma - Pārdoti</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {visibleSold.map((p) => (
          <div key={p.id} className="border p-4 rounded" style={{ background: 'var(--panel)', borderColor: 'var(--btn-ghost-border)', color: 'var(--text)' }}>
            <div className="mb-2 w-full aspect-square rounded overflow-hidden relative" style={{ background: 'var(--btn-ghost-hover-bg)' }}>
              <ImageRotator
                images={p.images || (p.imageURL ? [p.imageURL] : [])}
                autoRotateInterval={3000}
                useClock={true}
                pauseOnInteraction={false}
                preloadAdjacent={false}
                alt={p?.name ? `Iedvesma: ${p.name}` : "Iedvesma"}
                onImageClick={(i) => {
                  setSelectedProduct({ product: p, index: i ?? 0 });
                  pushUrlPreserveScroll(`${window.location.pathname}#product-${p.id}`);
                }}
                className="w-full h-full"
                imgClassName="cursor-pointer"
                fallback={<div style={{ color: "var(--muted)" }}>Nav attēla</div>}
              />

              {p.holidaySpecial && (
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
            <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{p.name}</h3>
            <p style={{ color: 'var(--muted)' }}>{p.description}</p>
          </div>
        ))}
      </div>

      {!maxRows && visibleSold.length < sold.length && (
        <div ref={sentinelRef} className="mt-6" style={{ color: "var(--muted)" }} aria-hidden="true">
          Ielādē vairāk...
        </div>
      )}
      {maxRows && sold.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            className="w-full py-3 rounded text-lg btn btn-ghost"
            onClick={(e) => {
              e.preventDefault();
              try {
                window.location.assign("/iedvesma");
              } catch {
                window.location.href = "/iedvesma";
              }
            }}
          >
            Parādīt visas iedvesmas
          </button>
        </div>
      )}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct.product || selectedProduct}
          startIndex={selectedProduct.index ?? 0}
          user={user}
          onProductUpdated={(updated) => {
            if (!updated?.id) return;
            readImagesStore.upsertProduct?.(updated);
            readImagesStore.addFromProducts([updated]);
            setSold((prev) => (prev || []).map((it) => (it?.id === updated.id ? { ...it, ...updated } : it)));
          }}
          onClose={() => {
            setSelectedProduct(null);
            replaceUrlPreserveScroll(window.location.pathname);
          }}
        />
      )}
    </section>
  );
}
