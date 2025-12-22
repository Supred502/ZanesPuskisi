import normalizeFirebaseStorageUrl from "./normalizeFirebaseStorageUrl";

const STORAGE_KEY = "zp_read_images_v1";
const STORAGE_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const STORAGE_MAX = 300;

// Session-level product cache (optional persistence via sessionStorage).
const PRODUCTS_SESSION_KEY = "zp_products_session_v1";
const PRODUCTS_SESSION_MAX = 600;

// Product document cache (in-memory only).
// Goal: prevent repeated Firestore reads for the same session/tab.
/** @type {Map<string, any>} */
const productsById = new Map();

/** @type {Set<string>} */
const missingProductIds = new Set();

/** @type {Map<string, Promise<any[]>>} */
const inflightLists = new Map();
/** @type {Map<string, Promise<any>>} */
const inflightProducts = new Map();

/** @type {Set<string>} */
const prefetchedUrls = new Set();

// Cache the last known list ordering per availability state.
// Note: Firestore query has no explicit orderBy today; we preserve the fetched order
// so UI sorting stays client-side and unchanged.
const listCacheByAvailability = {
  availableTrue: { ids: [], complete: false },
  availableFalse: { ids: [], complete: false },
};

function availabilityKey(available) {
  return available ? "availableTrue" : "availableFalse";
}

function materializeProducts(ids, limit) {
  const out = [];
  const max = typeof limit === "number" ? Math.max(0, limit) : ids.length;
  for (let i = 0; i < ids.length && out.length < max; i++) {
    const p = productsById.get(ids[i]);
    if (p) out.push(p);
  }
  return out;
}

function listKey({ available, limit }) {
  return `available:${available ? "true" : "false"}:limit:${
    typeof limit === "number" ? String(limit) : "all"
  }`;
}

function clampSessionProducts(products) {
  if (!Array.isArray(products)) return [];
  if (products.length <= PRODUCTS_SESSION_MAX) return products;
  return products.slice(0, PRODUCTS_SESSION_MAX);
}

function toJsonSafe(value, depth = 0) {
  if (depth > 6) return null;
  if (value == null) return value;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return value;

  // Firestore Timestamp and similar objects
  if (typeof value?.toMillis === "function") {
    try {
      return value.toMillis();
    } catch {
      return null;
    }
  }

  if (Array.isArray(value)) return value.map((v) => toJsonSafe(v, depth + 1));
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = toJsonSafe(v, depth + 1);
    }
    return out;
  }

  return null;
}

/** @type {Set<string>} */
const urls = new Set();
/** @type {Set<() => void>} */
const listeners = new Set();

// useSyncExternalStore requires getSnapshot() to be referentially stable
// when the underlying store hasn't changed.
let cachedSnapshot = [];

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function loadFromStorage() {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  const parsed = safeParse(raw, null);
  if (!parsed || typeof parsed !== "object") return;

  const ts = typeof parsed.ts === "number" ? parsed.ts : 0;
  const items = Array.isArray(parsed.items) ? parsed.items : null;
  if (!ts || !items) return;

  const age = Date.now() - ts;
  if (age < 0 || age > STORAGE_TTL_MS) return;

  for (const u of items) {
    if (typeof u !== "string") continue;
    const nu = normalizeFirebaseStorageUrl(u);
    if (nu) urls.add(nu);
  }

  cachedSnapshot = Array.from(urls);
}

function saveToStorage() {
  if (typeof window === "undefined") return;
  try {
    const items = Array.from(urls).slice(0, STORAGE_MAX);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ts: Date.now(), items })
    );
  } catch {
    // ignore (quota/private mode)
  }
}

let didInit = false;
function ensureInit() {
  if (didInit) return;
  didInit = true;
  loadFromStorage();
  loadProductsFromSession();
}

function loadProductsFromSession() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(PRODUCTS_SESSION_KEY);
    if (!raw) return;
    const parsed = safeParse(raw, null);
    if (!parsed || typeof parsed !== "object") return;

    const v = parsed.v;
    if (v !== 1) return;

    const missing = Array.isArray(parsed.missing) ? parsed.missing : [];
    for (const id of missing) {
      if (typeof id === "string" && id) missingProductIds.add(id);
    }

    for (const key of ["availableTrue", "availableFalse"]) {
      const entry = parsed[key];
      if (!entry || typeof entry !== "object") continue;
      const products = Array.isArray(entry.products) ? entry.products : [];
      const complete = !!entry.complete;

      const ids = [];
      for (const p of products) {
        if (!p?.id) continue;
        const id = String(p.id);
        productsById.set(id, p);
        ids.push(id);
      }

      listCacheByAvailability[key].ids = ids;
      listCacheByAvailability[key].complete = complete;
    }
  } catch {
    // ignore sessionStorage failures
  }
}

let saveProductsTimer = 0;
function scheduleSaveProductsToSession() {
  if (typeof window === "undefined") return;
  if (saveProductsTimer) return;
  saveProductsTimer = window.setTimeout(() => {
    saveProductsTimer = 0;
    saveProductsToSession();
  }, 50);
}

function saveProductsToSession() {
  if (typeof window === "undefined") return;
  try {
    const packList = (key) => {
      const entry = listCacheByAvailability[key];
      const ids = Array.isArray(entry?.ids) ? entry.ids : [];
      const products = [];
      for (const id of ids) {
        const p = productsById.get(id);
        if (p) products.push(toJsonSafe(p));
        if (products.length >= PRODUCTS_SESSION_MAX) break;
      }
      return {
        complete: !!entry?.complete,
        products: clampSessionProducts(products),
      };
    };

    const payload = {
      v: 1,
      missing: Array.from(missingProductIds).slice(0, 500),
      availableTrue: packList("availableTrue"),
      availableFalse: packList("availableFalse"),
    };
    window.sessionStorage.setItem(
      PRODUCTS_SESSION_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // ignore sessionStorage failures (quota/private mode)
  }
}

function emit() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  }
}

function refreshSnapshot() {
  cachedSnapshot = Array.from(urls);
}

function normalizeMany(nextUrls) {
  const out = [];
  for (const u of nextUrls || []) {
    if (typeof u !== "string") continue;
    const nu = normalizeFirebaseStorageUrl(u);
    if (nu) out.push(nu);
  }
  return out;
}

function prefetchImagesNow(urlsToFetch) {
  const uniq = Array.from(new Set(urlsToFetch));
  for (const u of uniq) {
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = u;
    } catch {
      // ignore
    }
  }
}

const readImagesStore = {
  /** Subscribe for React useSyncExternalStore */
  subscribe(listener) {
    ensureInit();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Snapshot for React useSyncExternalStore */
  getSnapshot() {
    ensureInit();
    return cachedSnapshot;
  },

  /** Add one or more URLs */
  addMany(nextUrls) {
    ensureInit();
    const normalized = normalizeMany(nextUrls);
    if (normalized.length === 0) return;

    let changed = false;
    for (const u of normalized) {
      if (!urls.has(u)) {
        urls.add(u);
        changed = true;
      }
    }

    if (!changed) return;
    refreshSnapshot();
    saveToStorage();
    emit();
  },

  /**
   * Deduplicated, idle-time prefetch for image URLs.
   * - Does not change rendered UI.
   * - Avoids repeated network requests across components.
   */
  prefetchImagesIdle(nextUrls) {
    ensureInit();
    const normalized = normalizeMany(nextUrls);
    if (normalized.length === 0) return;

    // Keep the global URL tracker updated (used by other components), but only
    // actually prefetch URLs we haven't tried to prefetch before.
    this.addMany(normalized);

    const toFetch = [];
    for (const u of normalized) {
      if (!prefetchedUrls.has(u)) {
        prefetchedUrls.add(u);
        toFetch.push(u);
      }
    }

    if (toFetch.length === 0) return;
    if (prefetchedUrls.size > 3000) prefetchedUrls.clear();

    const cb = () => prefetchImagesNow(toFetch);
    (window.requestIdleCallback || ((fn) => setTimeout(fn, 150)))(cb);
  },

  /** Convenience: add URLs from products list */
  addFromProducts(products) {
    ensureInit();
    if (!Array.isArray(products) || products.length === 0) return;

    const next = [];
    for (const p of products) {
      const list = Array.isArray(p?.images)
        ? p.images
        : p?.imageURL
        ? [p.imageURL]
        : [];
      for (const u of list) next.push(u);
    }

    this.addMany(next);
  },

  // --------------------
  // Product document cache
  // --------------------

  /** Get a cached product document (in-memory), or null. */
  getProduct(productId) {
    if (!productId) return null;
    return productsById.get(String(productId)) || null;
  },

  /** Upsert a product document into the in-memory cache. */
  upsertProduct(product) {
    if (!product?.id) return;
    const id = String(product.id);
    const prev = productsById.get(id);
    const merged = prev ? { ...prev, ...product } : product;
    productsById.set(id, merged);
    missingProductIds.delete(id);

    // Keep availability lists roughly consistent when product availability changes.
    const prevAvail =
      typeof prev?.available === "boolean" ? prev.available : null;
    const nextAvail =
      typeof merged?.available === "boolean" ? merged.available : null;
    if (prevAvail !== null && nextAvail !== null && prevAvail !== nextAvail) {
      const fromKey = availabilityKey(prevAvail);
      const toKey = availabilityKey(nextAvail);

      listCacheByAvailability[fromKey].ids = (
        listCacheByAvailability[fromKey].ids || []
      ).filter((x) => x !== id);
      const toIds = listCacheByAvailability[toKey].ids || [];
      if (!toIds.includes(id)) toIds.push(id);
      listCacheByAvailability[toKey].ids = toIds;
    }

    scheduleSaveProductsToSession();
  },

  /**
   * Cache the result of a products query.
   * - `complete=true` means this list represents the full set for that availability.
   * - `complete=false` represents a limited subset; it can still be reused for smaller limits.
   */
  cacheProductsQuery({ available, products, complete } = {}) {
    if (!Array.isArray(products)) return;
    for (const p of products) this.upsertProduct(p);

    const key = availabilityKey(!!available);
    const ids = products.map((p) => String(p.id)).filter(Boolean);
    const entry = listCacheByAvailability[key];
    // Keep the largest subset we've seen (helps avoid extra reads when maxRows changes).
    if (!!complete || ids.length >= (entry.ids?.length || 0)) {
      entry.ids = ids;
    }
    entry.complete = entry.complete || !!complete;
    scheduleSaveProductsToSession();
  },

  /**
   * Return cached products for an availability filter if present.
   * - If `limit` is provided, returns when we have at least that many cached.
   * - If `limit` is null/undefined, returns only when we have a complete list.
   */
  getCachedProducts({ available, limit } = {}) {
    const key = availabilityKey(!!available);
    const entry = listCacheByAvailability[key];
    if (!entry || !Array.isArray(entry.ids) || entry.ids.length === 0)
      return null;

    if (typeof limit === "number") {
      if (entry.ids.length < limit) return null;
      return materializeProducts(entry.ids, limit);
    }

    if (!entry.complete) return null;
    return materializeProducts(entry.ids);
  },

  /** True if we've already determined the product is missing. */
  isProductMissing(productId) {
    if (!productId) return false;
    return missingProductIds.has(String(productId));
  },

  /**
   * Deduplicated list fetch.
   * - Checks cache first.
   * - Deduplicates concurrent calls for the same availability+limit.
   * - Optionally persists to sessionStorage for reload resilience.
   */
  async getOrFetchProducts({ available, limit, fetcher } = {}) {
    ensureInit();
    const cached = this.getCachedProducts({ available, limit });
    if (cached) return cached;

    const k = listKey({ available: !!available, limit });
    const existing = inflightLists.get(k);
    if (existing) return existing;

    const p = (async () => {
      try {
        const items = await fetcher?.();
        if (!Array.isArray(items)) return [];
        this.addFromProducts(items);
        this.cacheProductsQuery({
          available: !!available,
          products: items,
          complete: typeof limit !== "number",
        });
        return items;
      } catch (err) {
        console.warn("Products list fetch error:", err);
        return [];
      }
    })();

    inflightLists.set(k, p);
    try {
      return await p;
    } finally {
      inflightLists.delete(k);
    }
  },

  /**
   * Deduplicated per-product fetch.
   * - Returns cached product if present.
   * - Deduplicates concurrent calls.
   * - Remembers missing products to avoid repeated reads.
   */
  async getOrFetchProductById(productId, fetcher) {
    ensureInit();
    const id = String(productId || "");
    if (!id) return null;
    const cached = this.getProduct(id);
    if (cached) return cached;
    if (missingProductIds.has(id)) return null;

    const existing = inflightProducts.get(id);
    if (existing) return existing;

    const p = (async () => {
      try {
        const data = await fetcher?.();
        if (!data) {
          missingProductIds.add(id);
          scheduleSaveProductsToSession();
          return null;
        }
        this.upsertProduct(data);
        this.addFromProducts([data]);
        return data;
      } catch (err) {
        console.warn("Product fetch error:", id, err);
        return null;
      }
    })();

    inflightProducts.set(id, p);
    try {
      return await p;
    } finally {
      inflightProducts.delete(id);
    }
  },
};

export default readImagesStore;
