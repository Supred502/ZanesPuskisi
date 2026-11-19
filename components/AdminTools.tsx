"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { CheckCircle2, LogOut, Pencil, Plus, Undo2, X } from "lucide-react";
import { useConfirm } from "@/components/Confirm";

// In-page admin tools on the shop itself. Firebase Auth is only loaded on devices where an admin has
// signed in (flag set by /admin), so customers never download it.
const FLAG = "zm_admin";
const EDIT_EVENT = "zm-edit";

export function markAdmin(on: boolean) {
  try {
    if (on) localStorage.setItem(FLAG, "1");
    else localStorage.removeItem(FLAG);
  } catch {}
}

let admin: User | null = null;
let listening = false;
const subs = new Set<() => void>();

function start() {
  if (listening) return;
  try {
    if (localStorage.getItem(FLAG) !== "1") return;
  } catch {
    return;
  }
  listening = true;
  Promise.all([import("firebase/auth"), import("@/lib/firebase")]).then(
    ([{ getAuth, onAuthStateChanged }, { app, ADMIN_UIDS }]) =>
      onAuthStateChanged(getAuth(app), (u) => {
        admin = u && ADMIN_UIDS.includes(u.uid) ? u : null;
        if (!admin) markAdmin(false);
        subs.forEach((f) => f());
      }),
    () => (listening = false), // chunk failed to load (bad connection): try again on the next page
  );
}

function useAdmin() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      start();
      return () => subs.delete(cb);
    },
    () => admin,
    () => null,
  );
}

/** Opens the editor for a product (id) or a new one (null). */
const openEditor = (id: string | null) => window.dispatchEvent(new CustomEvent(EDIT_EVENT, { detail: id }));

const ProductForm = dynamic(() => import("@/components/admin/ProductForm").then((m) => m.ProductForm), {
  ssr: false,
  loading: () => <p className="py-16 text-center text-ink-soft">Ielādē…</p>,
});

const HASH = "#rediget"; // the open editor gets its own history entry, so the browser's Back button closes it

/** Gold strip under the header + the editor overlay. Renders nothing for customers. */
export function AdminBar() {
  const user = useAdmin();
  const router = useRouter();
  const [ask, confirmDialog] = useConfirm();
  const [editing, setEditing] = useState<string | null | undefined>(undefined); // undefined = closed, null = new
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const afterBack = useRef<(() => void) | null>(null); // set when we close the editor ourselves via history.back()

  useEffect(() => {
    const on = (e: Event) => {
      opener.current = document.activeElement;
      history.pushState(null, "", location.pathname + location.search + HASH);
      setEditing((e as CustomEvent<string | null>).detail);
    };
    window.addEventListener(EDIT_EVENT, on);
    return () => window.removeEventListener(EDIT_EVENT, on);
  }, []);

  useEffect(() => {
    if (editing === undefined) return;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const onPop = async () => {
      if (location.hash === HASH) return;
      const then = afterBack.current;
      afterBack.current = null;
      if (then) return then();
      // The browser's Back button
      if (await ask({ title: "Aizvērt bez saglabāšanas?", text: "Nesaglabātās izmaiņas pazudīs.", ok: "Aizvērt" })) setEditing(undefined);
      else history.pushState(null, "", location.pathname + location.search + HASH);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = "";
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [editing, ask]);

  if (!user) return null;

  async function logout() {
    const [{ getAuth, signOut }, { app }] = await Promise.all([import("firebase/auth"), import("@/lib/firebase")]);
    await signOut(getAuth(app)); // onAuthStateChanged then clears the flag and hides the tools
  }

  /** Close the editor and drop its history entry, then run `then`. */
  function close(then: () => void = () => {}) {
    const fin = () => {
      setEditing(undefined);
      then();
    };
    if (location.hash !== HASH) return fin();
    afterBack.current = fin;
    history.back();
  }

  async function done(result?: { id: string; deleted?: boolean }) {
    if (!result) {
      if (await ask({ title: "Aizvērt bez saglabāšanas?", text: "Nesaglabātās izmaiņas pazudīs.", ok: "Aizvērt" })) close();
      return;
    }
    close(() => (result.deleted && location.pathname === `/produkti/${result.id}` ? router.push("/produkti") : router.refresh()));
  }

  return (
    <>
      <div className="border-b border-gold-bright/50 bg-gold-bg">
        <div className="wrap flex min-h-12 flex-wrap items-center gap-2 py-1.5 text-sm">
          <span className="mr-1 font-semibold text-gold">Pārvaldība</span>
          <button type="button" className="btn btn-primary !min-h-9 !px-3" onClick={() => openEditor(null)}>
            <Plus className="size-4" aria-hidden />Pievienot produktu
          </button>
          <Link href="/admin" className="btn btn-ghost !min-h-9 !px-3">Visi produkti</Link>
          <button type="button" className="btn btn-ghost ml-auto !min-h-9 !px-3" onClick={logout}>
            <LogOut className="size-4" aria-hidden /><span className="hidden sm:inline">Iziet</span><span className="sr-only sm:hidden">Iziet</span>
          </button>
        </div>
      </div>
      {editing !== undefined && (
        <div
          ref={dialog}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={editing ? "Rediģēt produktu" : "Jauns produkts"}
          className="fixed inset-0 z-50 overflow-y-auto bg-bg outline-none"
          onKeyDown={(e) => e.key === "Escape" && !confirmDialog && done()}
        >
          <div className="sticky top-0 z-10 bg-brand text-white shadow-[0_1px_0_rgb(212_176_98/0.35)]">
            <div className="wrap flex h-14 max-w-5xl items-center gap-3">
              <span className="font-semibold text-gold-bright">Pārvaldība</span>
              <span className="truncate text-sm text-white/75">{editing ? "Rediģēt produktu" : "Jauns produkts"}</span>
              <button type="button" className="btn ml-auto min-w-11 border-white/25 px-0 text-white hover:bg-white/10" onClick={() => done()} aria-label="Aizvērt">
                <X className="size-5" aria-hidden />
              </button>
            </div>
          </div>
          <ProductForm key={editing ?? "jauns"} id={editing} user={user} onDone={done} />
        </div>
      )}
      {confirmDialog}
    </>
  );
}

/** "Rediģēt" + sold/available toggle on a product page. */
export function AdminProductActions({ id, available }: { id: string; available: boolean }) {
  const user = useAdmin();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(available); // what we last saved, not the (possibly cached) page prop
  const [error, setError] = useState("");
  if (!user) return null;

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const { setAvailable } = await import("@/components/admin/db");
      await setAvailable(id, !now);
      setNow(!now);
      router.refresh();
    } catch {
      setError("Neizdevās mainīt. Pārbaudi internetu un mēģini vēlreiz.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2 rounded-md border border-gold-bright/50 bg-gold-bg p-3">
      <button type="button" className="btn btn-primary" onClick={() => openEditor(id)}>
        <Pencil className="size-4" aria-hidden />Rediģēt
      </button>
      <button type="button" className="btn btn-ghost" onClick={toggle} disabled={busy}>
        {now ? <CheckCircle2 className="size-4" aria-hidden /> : <Undo2 className="size-4" aria-hidden />}
        {busy ? "Saglabā…" : now ? "Atzīmēt kā pārdotu" : "Atzīmēt kā pieejamu"}
      </button>
      {error && <p role="alert" className="w-full text-sm text-danger">{error}</p>}
    </div>
  );
}

/** Small pencil on product cards. */
export function AdminCardEdit({ id, name }: { id: string; name: string }) {
  const user = useAdmin();
  if (!user) return null;
  return (
    <button
      type="button"
      onClick={() => openEditor(id)}
      className="btn absolute top-13 right-2 !min-h-9 !min-w-9 border-brand bg-brand px-0 text-white hover:bg-brand-hover"
      aria-label={`Rediģēt „${name}”`}
    >
      <Pencil className="size-4" aria-hidden />
    </button>
  );
}
