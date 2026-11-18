"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { LogOut, Store } from "lucide-react";
import { ADMIN_UIDS, app } from "@/lib/firebase";
import { ProductList } from "@/components/admin/ProductList";
import { ProductForm } from "@/components/admin/ProductForm";
import { markAdmin } from "@/components/AdminTools";

const auth = getAuth(app);

/** Admin shell: Google login for the three admins (firestore.rules / storage.rules enforce it too). */
export function AdminApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState("");
  const editing = useSearchParams().get("p"); // "jauns" = new product

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        markAdmin(!!u && ADMIN_UIDS.includes(u.uid)); // turns on the admin tools on the shop pages
      }),
    [],
  );

  async function login() {
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/popup-blocked") return setError("Pārlūks bloķēja pieslēgšanās logu. Atļauj uznirstošos logus šai lapai un mēģini vēlreiz.");
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") setError("Pieslēgties neizdevās. Mēģini vēlreiz.");
    }
  }

  if (user === undefined) return <p className="wrap py-20 text-center text-ink-soft">Ielādē…</p>;

  if (!user || !ADMIN_UIDS.includes(user.uid))
    return (
      <div className="wrap flex max-w-md flex-col items-center py-24 text-center">
        <h1 className="text-3xl font-semibold">Veikala pārvaldība</h1>
        {user ? (
          <>
            <p className="mt-3 text-ink-soft">Konts {user.email} nav administrators.</p>
            <button className="btn btn-ghost mt-6" onClick={() => signOut(auth)}>Iziet</button>
          </>
        ) : (
          <>
            <p className="mt-3 text-ink-soft">Pieslēdzies ar savu Google kontu.</p>
            <button className="btn btn-primary mt-6" onClick={login}>Pieslēgties ar Google</button>
          </>
        )}
        {error && <p role="alert" className="mt-4 text-danger">{error}</p>}
        <Link href="/" className="mt-10 text-sm text-ink-soft hover:text-brand">← Uz veikalu</Link>
      </div>
    );

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="wrap flex h-14 items-center gap-3">
          <Link href="/admin" className="text-lg font-semibold">Pārvaldība</Link>
          <span className="hidden truncate text-sm text-ink-soft sm:inline">{user.displayName ?? user.email}</span>
          <div className="ml-auto flex gap-2">
            <Link href="/" className="btn btn-ghost" target="_blank"><Store className="size-4" aria-hidden /><span className="hidden sm:inline">Veikals</span></Link>
            <button className="btn btn-ghost" onClick={() => signOut(auth)} aria-label="Iziet"><LogOut className="size-4" aria-hidden /><span className="hidden sm:inline">Iziet</span></button>
          </div>
        </div>
      </header>
      {editing ? <ProductForm key={editing} id={editing === "jauns" ? null : editing} user={user} /> : <ProductList />}
    </>
  );
}
