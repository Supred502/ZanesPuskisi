import { db } from "../../firebase/firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useWishlist from "../../hooks/useWishlist.js";
import ProductModal from "../Modal/ProductModal.jsx";
import ImageRotator from "../ImageRotator.jsx";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase/firebase.js";
import readImagesStore from "../../utils/readImagesStore.js";
import { pushUrlPreserveScroll, replaceUrlPreserveScroll } from "../../utils/history";
import { openWhatsApp } from "../../utils/whatsapp";

function buildShareLink(productId) {
  try {
    return `${window.location.origin}/s/${productId}`;
  } catch {
    return `/s/${productId}`;
  }
}

export default function ProductsGrid({ maxRows, user } = {}) {
  // When we're on the home page (maxRows provided), we only need a small preview.
  // Use a stable upper bound for desktop columns to avoid re-subscribing on resize.
  const maxPreviewLimit = maxRows ? 4 * maxRows : null;

  const [initialCache] = useState(() =>
    readImagesStore.getCachedProducts?.({
      available: true,
      limit: maxPreviewLimit ?? undefined,
    }) || null
  );

  const [products, setProducts] = useState(() => initialCache || []);
  const [loading, setLoading] = useState(() => !initialCache);
  const [guestSyncHint, setGuestSyncHint] = useState(false);
  const [sortKey, setSortKey] = useState("newest");

  // For the full products page, incrementally render cards to keep DOM small.
  const [renderLimit, setRenderLimit] = useState(() => (maxRows ? 0 : 24));
  const sentinelRef = useRef(null);

  const fetchSeqRef = useRef(0);

  useEffect(() => {
    const schedule = typeof queueMicrotask === "function" ? queueMicrotask : (fn) => setTimeout(fn, 0);

    // Firestore efficiency: first try the in-memory cache (persists across tab navigation
    // within the same session). If present, do not re-read Firestore.
    const cached = readImagesStore.getCachedProducts?.({
      available: true,
      limit: maxPreviewLimit ?? undefined,
    });

    if (cached) {
      schedule(() => {
        setProducts(cached);
        setLoading(false);
      });
      return;
    }

    schedule(() => setLoading(true));
    const seq = ++fetchSeqRef.current;
    let cancelled = false;

    readImagesStore
      .getOrFetchProducts?.({
        available: true,
        limit: maxPreviewLimit ?? undefined,
        fetcher: async () => {
          const base = query(
            collection(db, "products"),
            where("available", "==", true),
            ...(maxPreviewLimit ? [limit(maxPreviewLimit)] : [])
          );
          const snapshot = await getDocs(base);
          return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        },
      })
      .then((items) => {
        if (cancelled) return;
        if (seq !== fetchSeqRef.current) return;
        schedule(() => {
          setProducts(items || []);
          setLoading(false);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [maxPreviewLimit]);

  // Keep the read-images store updated from whatever is currently in memory
  // (covers localStorage cache and in-place updates from modal edits).
  useEffect(() => {
    readImagesStore.addFromProducts(products);
  }, [products]);

  const availableProducts = useMemo(
    () => products.filter((p) => p.available === true),
    [products]
  );

  // Track window width (used only if maxRows is provided)
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

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

  const columns =
    windowWidth >= 1024
      ? 4
      : windowWidth >= 768
        ? 3
        : windowWidth >= 640
          ? 2
          : 1;

  const minRenderLimit = useMemo(() => Math.max(24, columns * 6), [columns]);

  // Grow the rendered window as the user scrolls.
  useEffect(() => {
    if (maxRows) return;
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries?.some((e) => e.isIntersecting);
        if (!hit) return;
        setRenderLimit((n) => Math.min(availableProducts.length, n + Math.max(columns * 6, 24)));
      },
      { rootMargin: "600px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [availableProducts.length, columns, maxRows]);

  const visibleCount = maxRows
    ? columns * maxRows
    : Math.min(availableProducts.length, Math.max(renderLimit || 0, minRenderLimit));

  const displayProducts = useMemo(() => {
    const list = Array.isArray(availableProducts) ? [...availableProducts] : [];

    const getCreatedAtMs = (v) => {
      if (!v) return 0;
      if (typeof v === "number") return v;
      if (v instanceof Date) return v.getTime();
      if (typeof v.toMillis === "function") return v.toMillis();
      const seconds = typeof v.seconds === "number" ? v.seconds : 0;
      const nanoseconds = typeof v.nanoseconds === "number" ? v.nanoseconds : 0;
      if (seconds) return seconds * 1000 + Math.floor(nanoseconds / 1e6);
      return 0;
    };

    const byName = (a, b) =>
      String(a?.name || "").trim().localeCompare(String(b?.name || "").trim(), "lv", { sensitivity: "base" });

    switch (sortKey) {
      case "oldest":
        list.sort((a, b) => getCreatedAtMs(a?.createdAt) - getCreatedAtMs(b?.createdAt) || byName(a, b));
        break;
      case "price-asc":
        list.sort((a, b) => Number(a?.price ?? 0) - Number(b?.price ?? 0) || byName(a, b));
        break;
      case "price-desc":
        list.sort((a, b) => Number(b?.price ?? 0) - Number(a?.price ?? 0) || byName(a, b));
        break;
      case "name-asc":
        list.sort((a, b) => byName(a, b));
        break;
      case "name-desc":
        list.sort((a, b) => byName(b, a));
        break;
      case "holiday-first":
        list.sort((a, b) => Number(!!b?.holidaySpecial) - Number(!!a?.holidaySpecial) || byName(a, b));
        break;
      case "newest":
        list.sort((a, b) => getCreatedAtMs(b?.createdAt) - getCreatedAtMs(a?.createdAt) || byName(a, b));
        break;
      default:
        // Newest-first is the default UX.
        list.sort((a, b) => getCreatedAtMs(b?.createdAt) - getCreatedAtMs(a?.createdAt) || byName(a, b));
        break;
    }

    return list.slice(0, Math.max(0, visibleCount));
  }, [sortKey, availableProducts, visibleCount]);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // If the URL hash indicates a specific product (e.g. #product-<id>), open that product's modal.
  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const fetchedByIdRef = useRef({});

  const fetchProductById = useCallback(async (id) => {
    if (!id) return null;
    if (fetchedByIdRef.current[id]) return fetchedByIdRef.current[id];

    const p = readImagesStore.getOrFetchProductById?.(id, async () => {
      const snap = await getDoc(doc(db, "products", id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    });

    fetchedByIdRef.current[id] = p;
    try {
      return await p;
    } finally {
      // keep promise cached for this session of the component; do not delete
    }
  }, []);

  useEffect(() => {
    async function openFromHash() {
      const h = window.location.hash;
      let id = "";

      if (h && h.startsWith("#product-")) {
        id = h.replace("#product-", "");
      } else {
        try {
          const params = new URLSearchParams(window.location.search);
          id = params.get("p") || "";
        } catch {
          id = "";
        }
      }

      if (!id) {
        setSelectedProduct(null);
        return;
      }
      const found = productsRef.current.find((p) => p.id === id);

      const resolved = found || (await fetchProductById(id));
      if (!resolved) return;

      setSelectedProduct({ product: resolved, index: 0 });
      try {
        // Clean URL (remove ?p=...) while keeping a stable deep-link.
        replaceUrlPreserveScroll(`${window.location.pathname}#product-${id}`);
      } catch {
        // ignore
      }
    }

    // Try once on mount and whenever hash changes.
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [fetchProductById]);

  // If the page loads with a hash, products may not be loaded yet.
  // Re-try after products arrive.
  useEffect(() => {
    if (!products || products.length === 0) return;

    const h = window.location.hash;
    let id = "";
    if (h && h.startsWith("#product-")) {
      id = h.replace("#product-", "");
    } else {
      try {
        const params = new URLSearchParams(window.location.search);
        id = params.get("p") || "";
      } catch {
        id = "";
      }
    }

    if (!id) return;
    const alreadyOpen =
      (selectedProduct?.product?.id || selectedProduct?.id) === id;
    if (alreadyOpen) return;

    const found = products.find((p) => p.id === id);
    const schedule =
      typeof queueMicrotask === "function"
        ? queueMicrotask
        : (fn) => setTimeout(fn, 0);

    if (found) {
      schedule(() => setSelectedProduct({ product: found, index: 0 }));
      try {
        replaceUrlPreserveScroll(`${window.location.pathname}#product-${id}`);
      } catch {
        // ignore
      }
      return;
    }

    // If we're in limited preview mode, the deep-linked product may not be
    // included in the snapshot. Fetch it once on-demand.
    if (maxPreviewLimit) {
      fetchProductById(id).then((resolved) => {
        if (!resolved) return;
        schedule(() => setSelectedProduct({ product: resolved, index: 0 }));
        try {
          replaceUrlPreserveScroll(`${window.location.pathname}#product-${id}`);
        } catch {
          // ignore
        }
      });
    }
  }, [fetchProductById, maxPreviewLimit, products, selectedProduct]);

  const wishlist = useWishlist(user);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  // Idle-prefetch images beyond the first row to speed up subsequent reveals.
  useEffect(() => {
    // Image performance:
    // - The grid should only fetch the first image immediately.
    // - Prefetch additional images during idle time for a few rows near the top
    //   so rotation stays smooth without downloading everything at once.
    const PREFETCH_ROWS_AHEAD = 2;
    const prefetchCount = Math.max(0, columns * (PREFETCH_ROWS_AHEAD + 1));
    const candidates = displayProducts.slice(0, prefetchCount);

    const toPrefetch = [];
    for (const p of candidates) {
      const urls = Array.isArray(p?.images)
        ? p.images
        : p?.imageURL
        ? [p.imageURL]
        : [];
      // Skip the first image (it's the one the grid renders initially).
      for (const u of urls.slice(1)) toPrefetch.push(u);
    }

    if (toPrefetch.length === 0) return;

    readImagesStore.prefetchImagesIdle?.(toPrefetch);
  }, [displayProducts, columns]);

  return (
    <>
      <section id="produkti" className="p-8">
        <h2 className="text-3xl font-bold mb-6">Mūsu Produkti - Pieejami</h2>
        {guestSyncHint && !user && (
          <div
            className="mb-4 border rounded p-3 text-sm"
            style={{ backgroundColor: "var(--panel)", borderColor: "var(--btn-ghost-border)", color: "var(--text)" }}
          >
            <div style={{ color: "var(--muted)" }}>
              Saglabāts tikai šajā ierīcē. Pieslēdzies, lai sinhronizētu starp ierīcēm.
            </div>
            <div className="mt-2">
              <button type="button" className="btn btn-primary" onClick={handleSignIn}>
                <img src="/google.png" alt="Google" className="login-google-icon" />
                Pieslēgties
              </button>
            </div>
          </div>
        )}

        <div
          className="mb-4 border rounded p-3 flex flex-col sm:flex-row sm:items-center gap-2"
          style={{ backgroundColor: "var(--panel)", borderColor: "var(--btn-ghost-border)" }}
        >
          <label className="text-sm" style={{ color: "var(--muted)" }}>
            Kārtot:
          </label>
          <select
            className="border rounded px-3 py-2 w-full sm:w-auto"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            style={{ backgroundColor: "var(--panel)", color: "var(--text)", borderColor: "var(--btn-ghost-border)" }}
          >
            <option value="newest">Jaunākie vispirms</option>
            <option value="oldest">Vecākie vispirms</option>
            <option value="price-asc">Cena: zemākā vispirms</option>
            <option value="price-desc">Cena: augstākā vispirms</option>
            <option value="name-asc">Nosaukums: A → Z</option>
            <option value="name-desc">Nosaukums: Z → A</option>
            <option value="holiday-first">Svētku piedāvājumi vispirms</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
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
          ) : availableProducts.length === 0 ? (
            <div className="col-span-full text-center py-8" style={{ color: "var(--muted)" }}>
              Nav pieejamu produktu.
            </div>
          ) : (
            displayProducts.map((p, idx) => (
            <div
              key={p.id}
              className="border p-4 rounded h-full flex flex-col"
              style={{ backgroundColor: 'var(--panel)', color: 'var(--text)', borderColor: 'var(--btn-ghost-border)' }}
            >
              <div className="mb-2 w-full aspect-square rounded overflow-hidden relative">
                <ImageRotator
                  images={p.images || (p.imageURL ? [p.imageURL] : [])}
                  autoRotateInterval={3000}
                  useClock={true}
                  pauseOnInteraction={false}
                  priority={idx < columns}
                    preloadAdjacent={false}
                  alt={p?.name ? `Produkts: ${p.name}` : "Produkts"}
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
              <div className="flex items-center gap-3 min-w-0">
                <p className="text-xl font-semibold">{p.price} €</p>
                <h3 className="text-xl font-semibold truncate" style={{ minWidth: 0 }}>{p.name}</h3>
              </div>

              {/* Description removed from cards for consistency */}

              <div className="mt-auto md:pt-4 btn-group">
                <button
                  type="button"
                  className={`btn ${wishlist.isSaved(p.id) ? "btn-danger" : "btn-primary"}`}
                  onClick={async () => {
                    await wishlist.toggle(p);
                    if (!user) setGuestSyncHint(true);
                  }}
                >
                  {wishlist.isSaved(p.id) ? "Saglabāts" : "Saglabāt"}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const share = buildShareLink(p.id);
                    const text = `Sveiki! Mani interesē šis produkts: ${p.name || p.id}.\nCena: ${p.price ?? "?"} €\nSaite: ${share}`;
                    openWhatsApp(text);
                  }}
                >
                  WhatsApp
                </button>
              </div>
            </div>
            ))
          )}
        </div>

        {!maxRows && displayProducts.length < availableProducts.length && (
          <div ref={sentinelRef} className="mt-6" style={{ color: "var(--muted)" }} aria-hidden="true">
            Ielādē vairāk...
          </div>
        )}
        {maxRows && availableProducts.length > visibleCount && (
          <div className="mt-6">
            <button
              type="button"
              className="w-full py-3 rounded text-lg btn btn-ghost"
              onClick={(e) => {
                e.preventDefault();
                try {
                  window.location.assign("/produkti");
                } catch {
                  window.location.href = "/produkti";
                }
              }}
            >
              Parādīt visus produktus
            </button>
          </div>
        )}
      </section>
      {selectedProduct && (
        <ProductModal
          product={selectedProduct.product || selectedProduct}
          startIndex={selectedProduct.index ?? 0}
          user={user}
          onProductUpdated={(updated) => {
            if (!updated?.id) return;
            readImagesStore.upsertProduct?.(updated);
            readImagesStore.addFromProducts([updated]);
            setProducts((prev) => {
              const next = (prev || []).map((it) => (it?.id === updated.id ? { ...it, ...updated } : it));
              return next;
            });
          }}
          onClose={() => {
            setSelectedProduct(null);
            replaceUrlPreserveScroll(window.location.pathname);
          }}
        />
      )}
    </>
  );
}
