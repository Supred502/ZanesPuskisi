"use client";

import { useSyncExternalStore } from "react";

// Device-only wishlist: product ids in localStorage. Same key as the old site, so saved hearts carry over
// (the old site stored objects with a productId; those are read too).
const KEY = "wishlist_local_v1";
const EVENT = "wishlist:changed";
const EMPTY: string[] = [];
let cache: { raw: string | null; ids: string[] } = { raw: null, ids: EMPTY };

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY; // storage blocked (private mode): wishlist just stays empty
  }
  if (raw === cache.raw) return cache.ids; // same array between renders, as useSyncExternalStore needs
  let ids: string[] = [];
  try {
    const list = JSON.parse(raw ?? "[]");
    if (Array.isArray(list)) ids = list.map((it) => (typeof it === "string" ? it : it?.productId ?? it?.id)).filter((x): x is string => typeof x === "string");
  } catch {}
  cache = { raw, ids };
  return ids;
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage); // other tabs
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useWishlist() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function toggleWish(id: string) {
  const ids = read();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}
