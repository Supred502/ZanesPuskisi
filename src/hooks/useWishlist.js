import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const LOCAL_KEY = "wishlist_local_v1";

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function loadLocalWishlist() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LOCAL_KEY);
  const items = raw ? safeParse(raw, []) : [];
  return Array.isArray(items) ? items : [];
}

function saveLocalWishlist(items) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("wishlist:changed"));
  } catch {
    // ignore
  }
}

export default function useWishlist(user) {
  const uid = user?.uid;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const mode = uid ? "synced" : "local";

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Synced mode: listen to users/{uid}/wishlist
  useEffect(() => {
    if (!uid) return;
    const col = collection(db, "users", uid, "wishlist");
    const unsub = onSnapshot(
      col,
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(next);
        setLoading(false);
      },
      (err) => {
        console.warn("Wishlist listener error:", err);
        setItems([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [uid]);

  // Local mode: load from localStorage and listen for changes
  useEffect(() => {
    if (uid) return;
    const refresh = () => {
      setItems(loadLocalWishlist());
      setLoading(false);
    };
    refresh();
    window.addEventListener("wishlist:changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("wishlist:changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [uid]);

  const itemsById = useMemo(() => {
    const map = {};
    for (const it of items) {
      const id = it.productId || it.id;
      if (id) map[id] = it;
    }
    return map;
  }, [items]);

  const ids = useMemo(() => Object.keys(itemsById), [itemsById]);

  const isSaved = (productId) => Boolean(itemsById[productId]);

  const toggle = async (product) => {
    const productId = product?.id;
    if (!productId) return;

    if (uid) {
      const ref = doc(db, "users", uid, "wishlist", productId);
      const wasSaved = isSaved(productId);
      const prev = itemsRef.current;

      // Optimistic UI: update immediately, then reconcile with snapshot.
      try {
        if (wasSaved) {
          setItems((cur) =>
            (cur || []).filter((it) => (it.productId || it.id) !== productId)
          );
          await deleteDoc(ref);
        } else {
          const images =
            product.images || (product.imageURL ? [product.imageURL] : []);
          const optimistic = {
            productId,
            name: product.name || null,
            description: product.description || null,
            price:
              typeof product.price === "number"
                ? product.price
                : product.price ?? null,
            imageURL: images[0] || null,
            createdAt: Date.now(),
          };
          setItems((cur) => [
            ...(cur || []).filter(
              (it) => (it.productId || it.id) !== productId
            ),
            optimistic,
          ]);
          await setDoc(ref, {
            productId,
            name: product.name || null,
            description: product.description || null,
            price:
              typeof product.price === "number"
                ? product.price
                : product.price ?? null,
            imageURL: images[0] || null,
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.warn("Wishlist toggle failed:", err);
        // Revert optimistic change; snapshot will also correct shortly.
        setItems(Array.isArray(prev) ? prev : []);
      }
      return;
    }

    const current = loadLocalWishlist();
    const exists = current.some((it) => (it.productId || it.id) === productId);
    if (exists) {
      saveLocalWishlist(
        current.filter((it) => (it.productId || it.id) !== productId)
      );
    } else {
      const images =
        product.images || (product.imageURL ? [product.imageURL] : []);
      saveLocalWishlist([
        ...current,
        {
          productId,
          name: product.name || null,
          description: product.description || null,
          price:
            typeof product.price === "number"
              ? product.price
              : product.price ?? null,
          imageURL: images[0] || null,
          createdAt: Date.now(),
        },
      ]);
    }
  };

  const clearLocal = () => {
    if (uid) return;
    saveLocalWishlist([]);
  };

  return { mode, loading, items, ids, itemsById, isSaved, toggle, clearLocal };
}
