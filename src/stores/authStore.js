import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebase";

const STORAGE_KEY = "zp_auth_cache_v1";
const CHANNEL_NAME = "zp_auth_channel_v1";

/** @typedef {{uid:string,email?:string|null,photoURL?:string|null,displayName?:string|null}} CachedUser */

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function toCachedUser(firebaseUser) {
  if (!firebaseUser?.uid) return null;
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? null,
    photoURL: firebaseUser.photoURL ?? null,
    displayName: firebaseUser.displayName ?? null,
  };
}

function loadCachedUser() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = safeParse(raw, null);
  if (!parsed || typeof parsed !== "object") return null;
  if (!parsed.uid) return null;
  return /** @type {CachedUser} */ ({
    uid: String(parsed.uid),
    email: parsed.email ?? null,
    photoURL: parsed.photoURL ?? null,
    displayName: parsed.displayName ?? null,
  });
}

function saveCachedUser(cachedUser) {
  if (typeof window === "undefined") return;
  try {
    if (!cachedUser) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cachedUser));
    }
  } catch {
    // ignore
  }
}

/**
 * Auth snapshot rules:
 * - `status: 'unknown'` means we haven't heard from Firebase yet in this tab.
 * - `optimisticUser` is sourced from sessionStorage to prevent UI flicker.
 * - `user` is the authoritative Firebase user (or null).
 */
let snapshot = {
  status: /** @type {'unknown'|'signedIn'|'signedOut'} */ ("unknown"),
  user: /** @type {import('firebase/auth').User|null} */ (null),
  optimisticUser: /** @type {CachedUser|null} */ (null),
};

/** @type {Set<() => void>} */
const listeners = new Set();

function emit() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // ignore
    }
  }
}

let didInit = false;
let channel = null;

function applyFromFirebaseUser(u) {
  const cached = toCachedUser(u);
  snapshot = {
    status: u ? "signedIn" : "signedOut",
    user: u || null,
    optimisticUser: cached,
  };
  saveCachedUser(cached);
  broadcastSnapshot();
  emit();
}

function applyFromBroadcast(msg) {
  if (!msg || typeof msg !== "object") return;
  const type = msg.type;
  if (type !== "auth") return;

  const nextStatus = msg.status;
  if (nextStatus !== "signedIn" && nextStatus !== "signedOut") return;

  const nextOptimistic =
    msg.optimisticUser && msg.optimisticUser.uid
      ? {
          uid: String(msg.optimisticUser.uid),
          email: msg.optimisticUser.email ?? null,
          photoURL: msg.optimisticUser.photoURL ?? null,
          displayName: msg.optimisticUser.displayName ?? null,
        }
      : null;

  // Broadcast is advisory: it should only update optimistic UI and clear bad caches.
  // We do NOT set `user` from it.
  snapshot = {
    ...snapshot,
    status: snapshot.status === "unknown" ? "unknown" : snapshot.status,
    optimisticUser: nextOptimistic,
  };
  saveCachedUser(nextOptimistic);
  emit();
}

function broadcastSnapshot() {
  if (typeof window === "undefined") return;
  const payload = {
    type: "auth",
    status: snapshot.user ? "signedIn" : "signedOut",
    optimisticUser: snapshot.optimisticUser,
    ts: Date.now(),
  };

  try {
    channel?.postMessage(payload);
  } catch {
    // ignore
  }

  // localStorage event fallback for Safari/private cases
  try {
    window.localStorage.setItem(
      "zp_auth_broadcast_v1",
      JSON.stringify(payload)
    );
  } catch {
    // ignore
  }
}

export function ensureAuthStoreInit() {
  if (didInit) return;
  didInit = true;

  snapshot = {
    ...snapshot,
    optimisticUser: loadCachedUser(),
  };

  if (typeof window !== "undefined") {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (e) => applyFromBroadcast(e?.data);
    } catch {
      channel = null;
    }

    window.addEventListener("storage", (e) => {
      if (e.key !== "zp_auth_broadcast_v1" || !e.newValue) return;
      applyFromBroadcast(safeParse(e.newValue, null));
    });
  }

  // Prefer immediate currentUser if already available (helps reduce time-to-correct).
  if (auth.currentUser?.uid) {
    applyFromFirebaseUser(auth.currentUser);
  }

  onAuthStateChanged(auth, (u) => {
    applyFromFirebaseUser(u);
  });
}

export function subscribe(listener) {
  ensureAuthStoreInit();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot() {
  ensureAuthStoreInit();
  return snapshot;
}

export async function authSignInWithGoogle() {
  ensureAuthStoreInit();
  await signInWithPopup(auth, googleProvider);
}

export async function authSignOut() {
  ensureAuthStoreInit();
  await signOut(auth);
  // onAuthStateChanged will clear caches too
}
