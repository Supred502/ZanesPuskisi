"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, ArrowRight, ChevronLeft, ImagePlus, Star, Trash2, X } from "lucide-react";
import { db, removeProduct, saveProduct, uploadImage } from "@/components/admin/db";
import { CATEGORIES, DEFAULT_CATEGORY, suggestCategory, toProduct } from "@/lib/catalog";

type Pic = { url: string; file?: File }; // file = picked now, not uploaded yet (url is a local preview)

type Done = (result?: { id: string; deleted?: boolean }) => void;

/** onDone: set when opened on top of a shop page (components/AdminTools.tsx); otherwise it returns to /admin. */
export function ProductForm({ id, user, onDone }: { id: string | null; user: User; onDone?: Done }) {
  const router = useRouter();
  const finish: Done = onDone ?? (() => router.push("/admin"));
  const fileInput = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(!id);
  const [original, setOriginal] = useState<string[]>([]);
  const [pics, setPics] = useState<Pic[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [categoryTouched, setCategoryTouched] = useState(!!id);
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(true);
  const [holiday, setHoliday] = useState(false);
  const [holidayPrice, setHolidayPrice] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [tried, setTried] = useState(false);
  const busy = status !== "";

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "products", id)).then(
      (s) => {
        if (!s.exists()) return setError("Produkts nav atrasts.");
        const p = toProduct(s.id, s.data());
        setOriginal(p.images);
        setPics(p.images.map((url) => ({ url })));
        setName(p.name);
        setPrice(String(p.price || ""));
        setCategory(p.category);
        setDescription(p.description);
        setAvailable(p.available);
        setHoliday(p.holidaySpecial);
        setHolidayPrice(p.holidayPrice != null ? String(p.holidayPrice) : "");
        setTiktok(p.tiktokLink ?? "");
        setLoaded(true);
      },
      () => setError("Neizdevās ielādēt produktu."),
    );
  }, [id]);

  // Free local previews when they leave the form
  const picsRef = useRef(pics);
  useEffect(() => {
    picsRef.current = pics;
  });
  useEffect(() => () => picsRef.current.forEach((p) => p.file && URL.revokeObjectURL(p.url)), []);

  function addFiles(files: FileList | File[]) {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    setPics((prev) => [...prev, ...imgs.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }
  function removePic(i: number) {
    setPics((prev) => {
      const p = prev[i];
      if (p.file) URL.revokeObjectURL(p.url);
      return prev.filter((_, n) => n !== i);
    });
  }
  const move = (i: number, to: number) =>
    setPics((prev) => {
      const next = [...prev];
      const [p] = next.splice(i, 1);
      next.splice(Math.max(0, Math.min(to, next.length)), 0, p);
      return next;
    });

  const priceNum = Number(price.replace(",", "."));
  const holidayNum = Number(holidayPrice.replace(",", "."));
  const errors = {
    name: (!name.trim() && "Ieraksti nosaukumu.") || (name.trim().length > 200 && "Nosaukums var būt līdz 200 zīmēm."),
    description: description.trim().length > 5000 && "Apraksts var būt līdz 5000 zīmēm.",
    price: !(priceNum > 0) && "Cenai jābūt lielākai par 0.",
    pics: (!pics.length && "Pievieno vismaz vienu attēlu.") || (pics.length > 20 && "Ne vairāk kā 20 attēli vienam produktam."),
    holiday: holiday && !(holidayNum > 0 && holidayNum < priceNum) && "Svētku cenai jābūt mazākai par parasto cenu.",
    tiktok: tiktok.trim() !== "" && !/^https:\/\/(www\.|vm\.|m\.)?tiktok\.com\//.test(tiktok.trim()) && "Saitei jāsākas ar https://www.tiktok.com/…",
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) => tried && errors[k] && <p className="mt-1 text-sm text-danger">{errors[k]}</p>;

  async function save(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setTried(true);
    if (!valid || busy) return;
    setError("");
    try {
      const newOnes = pics.filter((p) => p.file).length;
      let done = 0;
      setStatus(newOnes ? `Augšupielādē attēlus 0/${newOnes}…` : "Saglabā…");
      // One at a time: decoding many full-size phone photos at once can crash a phone browser
      const images: string[] = [];
      for (const [n, p] of pics.entries()) {
        if (!p.file) { images.push(p.url); continue; }
        images.push(await uploadImage(p.file, user.uid, n));
        setStatus(`Augšupielādē attēlus ${++done}/${newOnes}…`);
      }
      setStatus("Saglabā…");
      const savedId = await saveProduct(
        id,
        {
          name: name.trim(),
          description: description.trim(),
          price: priceNum,
          category,
          available,
          holidaySpecial: holiday,
          holidayPrice: holiday ? holidayNum : null,
          tiktokLink: tiktok.trim() || null,
          images,
        },
        original.filter((u) => !images.includes(u)),
      );
      finish({ id: savedId });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error && err.message.startsWith("„") ? err.message : "Saglabāt neizdevās. Pārbaudi internetu un mēģini vēlreiz.");
      setStatus("");
    }
  }

  async function del() {
    if (!id || !confirm(`Dzēst „${name}” pavisam? To nevarēs atsaukt.\n\nJa darbs ir pārdots, labāk atzīmē to kā „Pārdots”: tad tas paliek galerijā.`)) return;
    setStatus("Dzēš…");
    try {
      await removeProduct(id, original);
      finish({ id, deleted: true });
    } catch {
      setError("Dzēst neizdevās.");
      setStatus("");
    }
  }

  if (!loaded) return <p className="wrap py-16 text-center text-ink-soft">{error || "Ielādē…"}</p>;

  return (
    <form onSubmit={save} className="wrap max-w-5xl py-8" noValidate>
      {onDone ? (
        <button type="button" onClick={() => onDone()} disabled={busy} className="inline-flex cursor-pointer disabled:opacity-50 items-center gap-1 text-sm text-ink-soft hover:text-brand"><ChevronLeft className="size-4" aria-hidden />Atpakaļ uz lapu</button>
      ) : (
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand"><ChevronLeft className="size-4" aria-hidden />Visi produkti</Link>
      )}
      <h1 className="mt-3 text-2xl font-semibold">{id ? "Rediģēt produktu" : "Jauns produkts"}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Photos */}
        <section aria-labelledby="att">
          <h2 id="att" className="label">Attēli <span className="font-normal text-ink-soft">(pirmais ir galvenais)</span></h2>
          <div
            className="grid grid-cols-3 gap-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            {pics.map((p, i) => (
              <div key={p.url} className={`group relative aspect-square overflow-hidden rounded-md border bg-soft ${i === 0 ? "col-span-2 row-span-2 border-brand" : "border-line"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob previews can't go through next/image */}
                <img src={p.url} alt={`${i + 1}. attēls`} className="size-full object-cover" />
                {i === 0 && <span className="absolute top-1.5 left-1.5 rounded-md bg-brand px-1.5 py-0.5 text-[11px] font-semibold text-white">Galvenais</span>}
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
                  <div className="flex gap-1">
                    {i > 0 && <PicBtn label="Pa kreisi" onClick={() => move(i, i - 1)}><ArrowLeft className="size-3.5" /></PicBtn>}
                    {i < pics.length - 1 && <PicBtn label="Pa labi" onClick={() => move(i, i + 1)}><ArrowRight className="size-3.5" /></PicBtn>}
                    {i > 0 && <PicBtn label="Padarīt par galveno" onClick={() => move(i, 0)}><Star className="size-3.5" /></PicBtn>}
                  </div>
                  <PicBtn label="Noņemt attēlu" onClick={() => removePic(i)} danger><X className="size-3.5" /></PicBtn>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-ink-soft/40 bg-surface text-sm text-ink-soft hover:border-brand hover:text-brand ${pics.length ? "" : "col-span-3 aspect-[3/1]"}`}
            >
              <ImagePlus className="size-6" aria-hidden />
              Pievienot
            </button>
          </div>
          <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
          {show("pics")}
        </section>

        {/* Details */}
        <section className="space-y-5">
          <div>
            <label htmlFor="name" className="label">Nosaukums</label>
            <input id="name" className="input" value={name} onChange={(e) => { setName(e.target.value); if (!categoryTouched) setCategory(suggestCategory(e.target.value)); }} />
            {show("name")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="label">Cena (€)</label>
              <input id="price" className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
              {show("price")}
            </div>
            <div>
              <label htmlFor="cat" className="label">Kategorija</label>
              <select id="cat" className="input" value={category} onChange={(e) => { setCategoryTouched(true); setCategory(e.target.value); }}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="desc" className="label">Apraksts</label>
            <textarea id="desc" className="input min-h-32" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Krāsas, izmērs, kam piemērots…" />
            {show("description")}
          </div>

          <Toggle checked={available} onChange={setAvailable} label="Pieejams pārdošanā" hint={available ? "Rādās sadaļā „Produkti”." : "Rādās galerijā „Iedvesma” kā iepriekšējais darbs."} />
          <Toggle checked={holiday} onChange={(v) => { setHoliday(v); if (!v) setHolidayPrice(""); }} label="Svētku piedāvājums" hint="Rāda atlaides cenu ar nosvītrotu parasto cenu." />
          {holiday && (
            <div>
              <label htmlFor="hprice" className="label">Svētku cena (€)</label>
              <input id="hprice" className="input" inputMode="decimal" value={holidayPrice} onChange={(e) => setHolidayPrice(e.target.value)} />
              {show("holiday")}
            </div>
          )}
          <div>
            <label htmlFor="tt" className="label">TikTok video saite <span className="font-normal text-ink-soft">(nav obligāti)</span></label>
            <input id="tt" className="input" type="url" placeholder="https://www.tiktok.com/@zanepoznaka/video/…" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
            {show("tiktok")}
          </div>
        </section>
      </div>

      {error && <p role="alert" className="mt-6 rounded-md border border-danger/30 bg-danger/5 p-3 text-danger">{error}</p>}

      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-3 border-t border-line bg-bg/95 py-4 backdrop-blur">
        <button type="submit" className="btn btn-primary !px-8" disabled={busy}>{busy ? status : id ? "Saglabāt izmaiņas" : "Pievienot produktu"}</button>
        {onDone ? <button type="button" className="btn btn-ghost" onClick={() => onDone()} disabled={busy}>Atcelt</button> : <Link href="/admin" className="btn btn-ghost">Atcelt</Link>}
        {id && <button type="button" className="btn btn-danger ml-auto" onClick={del} disabled={busy}><Trash2 className="size-4" aria-hidden />Dzēst</button>}
        <span aria-live="polite" className="sr-only">{status}</span>
      </div>
    </form>
  );
}

function PicBtn({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={`grid size-8 place-items-center rounded-md border border-line bg-surface/95 ${danger ? "text-danger" : "text-ink"} hover:bg-soft`}>
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-surface p-3">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden className={`mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-md border p-0.5 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-brand ${checked ? "justify-end border-brand bg-brand" : "border-line bg-soft"}`}>
        <span className="size-4.5 rounded-[4px] bg-white shadow-sm" />
      </span>
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-sm text-ink-soft">{hint}</span>
      </span>
    </label>
  );
}
