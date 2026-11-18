"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { Flower2, Pencil, Plus, Search } from "lucide-react";
import { db, setAvailable } from "@/components/admin/db";
import { byNewest, currentPrice, formatPrice, toProduct, type Product } from "@/lib/catalog";

type Tab = "pieejami" | "pardoti" | "visi";

export function ProductList() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("pieejami");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  // Live from Firestore: always the true state, never a cached copy.
  useEffect(
    () =>
      onSnapshot(
        collection(db, "products"),
        (s) => setProducts(s.docs.map((d) => toProduct(d.id, d.data())).sort(byNewest)),
        () => setError("Neizdevās ielādēt produktus."),
      ),
    [],
  );

  async function toggle(p: Product) {
    setBusy(p.id);
    try {
      await setAvailable(p.id, !p.available);
    } catch {
      setError(`Neizdevās mainīt „${p.name}”.`);
    } finally {
      setBusy(null);
    }
  }

  if (!products) return <p className="wrap py-16 text-center text-ink-soft">{error || "Ielādē…"}</p>;

  const counts = { pieejami: products.filter((p) => p.available).length, pardoti: products.filter((p) => !p.available).length, visi: products.length };
  const needle = q.trim().toLocaleLowerCase("lv");
  const shown = products
    .filter((p) => (tab === "visi" ? true : tab === "pieejami" ? p.available : !p.available))
    .filter((p) => !needle || p.name.toLocaleLowerCase("lv").includes(needle) || p.category.toLocaleLowerCase("lv").includes(needle));

  return (
    <div className="wrap py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Produkti</h1>
        <Link href="/admin?p=jauns" className="btn btn-primary"><Plus className="size-4" aria-hidden />Jauns produkts</Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2" role="group" aria-label="Filtrs">
          {([["pieejami", "Pieejamie"], ["pardoti", "Pārdotie"], ["visi", "Visi"]] as const).map(([t, l]) => (
            <button key={t} aria-pressed={tab === t} className="chip" onClick={() => setTab(t)}>
              {l} <span className="ml-1.5 opacity-70">{counts[t]}</span>
            </button>
          ))}
        </div>
        <label className="relative sm:ml-auto sm:w-72">
          <span className="sr-only">Meklēt</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input className="input !pl-9" placeholder="Meklēt…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      {error && <p role="alert" className="mt-4 rounded-md border border-danger/30 bg-danger/5 p-3 text-danger">{error}</p>}

      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {shown.map((p) => (
          <li key={p.id} className="flex items-center gap-3 p-3 sm:gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-soft">
              {p.images[0] ? <Image src={p.images[0]} alt="" fill sizes="64px" className="object-cover" /> : <Flower2 className="absolute inset-0 m-auto size-6 text-brand/30" aria-hidden />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="truncate text-sm text-ink-soft">{formatPrice(currentPrice(p))} · {p.category}</p>
            </div>
            <button
              className={`btn shrink-0 !min-h-9 !px-3 text-xs ${p.available ? "border-ok/30 bg-ok-bg text-ok" : "btn-ghost"}`}
              onClick={() => toggle(p)}
              disabled={busy === p.id}
              title="Mainīt: pieejams / pārdots"
            >
              {busy === p.id ? "…" : p.available ? "Pieejams" : "Pārdots"}
            </button>
            <Link href={`/admin?p=${p.id}`} className="btn-icon shrink-0" aria-label={`Rediģēt „${p.name}”`}><Pencil className="size-4" aria-hidden /></Link>
          </li>
        ))}
        {!shown.length && <li className="p-8 text-center text-ink-soft">Nekas nav atrasts.</li>}
      </ul>
    </div>
  );
}
