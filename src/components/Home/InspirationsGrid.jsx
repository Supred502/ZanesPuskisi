import { useMemo, useState, useEffect, useRef } from "react";
import { collection, query, where, limit, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import ProductModal from "../Modal/ProductModal.jsx";
import ImageRotator from "../ImageRotator.jsx";
import readImagesStore from "../../utils/readImagesStore.js";
import useAuth from "../../hooks/useAuth";
import { pushUrlPreserveScroll, replaceUrlPreserveScroll } from "../../utils/history";
import {
  DEFAULT_INSPIRATION_CATEGORY,
  INSPIRATION_CATEGORIES,
  coerceInspirationCategory,
} from "../../utils/inspirationCategories";

export default function InspirationsGrid({ maxRows } = {}) {
  const { user } = useAuth();
  // Home page shows a preview; use a stable upper bound for desktop columns.
  const maxPreviewLimit = maxRows ? 4 * maxRows : null;

  // Full page: category selector drives data fetching.
  const isFullPage = !maxRows;
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState(() => ({}));
  const [countsLoading, setCountsLoading] = useState(() => isFullPage);

  const STORAGE_SELECTED_CATEGORY_KEY = "zp_iedvesma_selected_category_v1";

  // Cache per-category lists so switching categories doesn't refetch.
  const categoryCacheRef = useRef(new Map());
  const countsSeqRef = useRef(0);

  const [initialCache] = useState(() =>
    readImagesStore.getCachedProducts?.({
      available: false,
      limit: maxPreviewLimit ?? undefined,
    }) || null
  );

  const [sold, setSold] = useState(() => initialCache || []);
  const [loading, setLoading] = useState(() => (isFullPage ? false : !initialCache));
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [renderLimit, setRenderLimit] = useState(() => (maxRows ? 0 : 24));
  const sentinelRef = useRef(null);

  const fetchSeqRef = useRef(0);

  // Restore last chosen category on the full Iedvesma page.
  // If there's no stored value, we keep it empty (no products shown until selection).
  useEffect(() => {
    if (!isFullPage) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_SELECTED_CATEGORY_KEY);
      if (raw && INSPIRATION_CATEGORIES.includes(raw)) {
        setSelectedCategory(raw);
      }
    } catch {
      // ignore storage failures
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullPage]);

  // Persist selection so returning to /iedvesma keeps the last opened category.
  useEffect(() => {
    if (!isFullPage) return;
    try {
      if (selectedCategory && INSPIRATION_CATEGORIES.includes(selectedCategory)) {
        window.localStorage.setItem(STORAGE_SELECTED_CATEGORY_KEY, selectedCategory);
      }
    } catch {
      // ignore storage failures
    }
  }, [isFullPage, selectedCategory]);

  const refreshCounts = async () => {
    if (!isFullPage) return;
    const seq = ++countsSeqRef.current;
    setCountsLoading(true);

    try {
      const countForCategory = async (cat) => {
        // Back-compat: missing category counts toward the default category.
        if (cat === DEFAULT_INSPIRATION_CATEGORY) {
          const q1 = query(
            collection(db, "products"),
            where("available", "==", false),
            where("category", "==", DEFAULT_INSPIRATION_CATEGORY)
          );
          const q2 = query(
            collection(db, "products"),
            where("available", "==", false),
            where("category", "==", null)
          );

          const [c1, c2] = await Promise.all([
            getCountFromServer(q1),
            getCountFromServer(q2),
          ]);
          return (c1?.data?.().count || 0) + (c2?.data?.().count || 0);
        }

        const q = query(
          collection(db, "products"),
          where("available", "==", false),
          where("category", "==", cat)
        );
        const snap = await getCountFromServer(q);
        return snap?.data?.().count || 0;
      };

      const entries = await Promise.all(
        INSPIRATION_CATEGORIES.map(async (cat) => [cat, await countForCategory(cat)])
      );

      if (seq !== countsSeqRef.current) return;
      setCategoryCounts(Object.fromEntries(entries));
    } catch (err) {
      if (import.meta?.env?.DEV) console.warn("Failed to fetch inspiration category counts", err);
    } finally {
      if (seq === countsSeqRef.current) setCountsLoading(false);
    }
  };

  // Compute counts once on full page mount.
  useEffect(() => {
    if (!isFullPage) return;
    refreshCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullPage]);

  // Fetch inspirations:
  // - Home preview: keep old behavior (small limit across all sold items)
  // - Full page: only fetch selected category, cached per category
  useEffect(() => {
    if (isFullPage) return;

    // Firestore efficiency: reuse in-memory cache across navigation within the same session.
    const cached = readImagesStore.getCachedProducts?.({
      available: false,
      limit: maxPreviewLimit ?? undefined,
    });

    if (cached) {
      const schedule = typeof queueMicrotask === "function" ? queueMicrotask : (fn) => setTimeout(fn, 0);
      schedule(() => {
        setSold(cached);
        setLoading(false);
      });
      return;
    }

    const schedule = typeof queueMicrotask === "function" ? queueMicrotask : (fn) => setTimeout(fn, 0);
    const seq = ++fetchSeqRef.current;
    let cancelled = false;
    schedule(() => setLoading(true));

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
        schedule(() => {
          setSold(items || []);
          setLoading(false);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [isFullPage, maxPreviewLimit]);

  useEffect(() => {
    if (!isFullPage) return;
    if (!selectedCategory) {
      setSold([]);
      return;
    }

    const category = coerceInspirationCategory(selectedCategory);
    const cached = categoryCacheRef.current.get(category);
    if (cached) {
      setSold(cached);
      return;
    }

    const schedule = typeof queueMicrotask === "function" ? queueMicrotask : (fn) => setTimeout(fn, 0);
    const seq = ++fetchSeqRef.current;
    let cancelled = false;
    schedule(() => setLoading(true));

    const fetcher = async () => {
      // Back-compat: missing category is treated as default category.
      if (category === DEFAULT_INSPIRATION_CATEGORY) {
        const q1 = query(
          collection(db, "products"),
          where("available", "==", false),
          where("category", "==", DEFAULT_INSPIRATION_CATEGORY)
        );
        const q2 = query(
          collection(db, "products"),
          where("available", "==", false),
          where("category", "==", null)
        );
        const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const byId = new Map();
        for (const snap of [s1, s2]) {
          for (const d of snap.docs) {
            if (!byId.has(d.id)) byId.set(d.id, { id: d.id, ...d.data() });
          }
        }
        return Array.from(byId.values());
      }

      const q = query(
        collection(db, "products"),
        where("available", "==", false),
        where("category", "==", category)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    };

    fetcher().then((items) => {
      if (cancelled) return;
      if (seq !== fetchSeqRef.current) return;
      schedule(() => {
        const list = items || [];
        categoryCacheRef.current.set(category, list);
        setSold(list);
        setLoading(false);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isFullPage, selectedCategory]);

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

  const categoryOptions = useMemo(() => {
    return INSPIRATION_CATEGORIES.map((cat) => {
      const count = Number(categoryCounts?.[cat] ?? 0);
      const label = countsLoading ? `${cat} (...)` : `${cat} (${count})`;
      return { value: cat, label };
    });
  }, [categoryCounts, countsLoading]);

  const showProducts = !isFullPage || Boolean(selectedCategory);

  return (
    <section id="idejas" className="p-8" style={{ background: 'var(--hero-bg)', color: 'var(--text)' }}>
      <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text)' }}>Iedvesma - Pārdoti</h2>

      {isFullPage && (
        <div
          className="mb-4 border rounded p-3 flex flex-col sm:flex-row sm:items-center gap-2"
          style={{ backgroundColor: "var(--panel)", borderColor: "var(--btn-ghost-border)" }}
        >
          <label className="text-sm" style={{ color: "var(--muted)" }}>
            Kategorija:
          </label>
          <select
            className="border rounded px-3 py-2 w-full sm:w-auto"
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ backgroundColor: "var(--panel)", color: "var(--text)", borderColor: "var(--btn-ghost-border)" }}
          >
            <option value="" disabled>
              Izvēlies kategoriju
            </option>
            {categoryOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {!showProducts ? (
          <div className="col-span-full text-center py-8" style={{ color: "var(--muted)" }}>
            Izvēlies kategoriju, lai redzētu produktus.
          </div>
        ) : loading ? (
          Array.from({ length: maxRows ? visibleCount : 8 }).map((_, i) => (
            <div
              key={`s-${i}`}
              className="border p-4 rounded zp-skeleton zp-pulse"
              style={{ backgroundColor: 'var(--panel)', color: 'var(--text)', borderColor: 'var(--btn-ghost-border)' }}
            >
              <div className="mb-2 w-full aspect-square rounded overflow-hidden zp-skeleton-block" />
              <div className="h-4 w-2/3 rounded zp-skeleton-block" />
              <div className="h-3 w-1/3 rounded mt-2 zp-skeleton-block" />
            </div>
          ))
        ) : visibleSold.length === 0 ? (
          <div className="col-span-full text-center py-8" style={{ color: "var(--muted)" }}>
            Nav produktu šajā kategorijā.
          </div>
        ) : (
          visibleSold.map((p) => (
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
          ))
        )}
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

            // Keep category caches consistent for the full page (no extra reads).
            if (isFullPage) {
              const next = { ...updated };
              const nextCategory = coerceInspirationCategory(next?.category);

              for (const [cat, list] of categoryCacheRef.current.entries()) {
                const filtered = (list || []).filter((it) => it?.id !== next.id);
                categoryCacheRef.current.set(cat, filtered);
              }

              if (next?.available === false) {
                const target = nextCategory || DEFAULT_INSPIRATION_CATEGORY;
                const prevList = categoryCacheRef.current.get(target) || [];
                categoryCacheRef.current.set(target, [next, ...prevList]);
              }

              // Refresh counts after edits that can affect category membership.
              refreshCounts();
            }

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
