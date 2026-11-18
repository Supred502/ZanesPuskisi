"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/ProductCard";
import { CATEGORIES, currentPrice, type Product } from "@/lib/catalog";

const SORTS = { jaunakie: "Jaunākie", leti: "Lētākie", dargi: "Dārgākie" } as const;
type Sort = keyof typeof SORTS;

/** Category chips + sort over a list the server already loaded. State lives in the URL (?k=…&s=…) so links can be shared. */
export function CatalogBrowser({ products, sortable = true }: { products: Product[]; sortable?: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();

  const present = CATEGORIES.filter((c) => products.some((p) => p.category === c));
  const k = params.get("k");
  const category = present.find((c) => c === k) ?? null;
  const sort: Sort = (params.get("s") as Sort) in SORTS ? (params.get("s") as Sort) : "jaunakie";

  const shown = category ? products.filter((p) => p.category === category) : [...products];
  if (sort === "leti") shown.sort((a, b) => currentPrice(a) - currentPrice(b));
  if (sort === "dargi") shown.sort((a, b) => currentPrice(b) - currentPrice(a));

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  };

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {present.length > 1 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Kategorijas">
            <button type="button" className="chip" aria-pressed={!category} onClick={() => set("k", null)}>
              Visi <span className="ml-1.5 opacity-70">{products.length}</span>
            </button>
            {present.map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={c === category} onClick={() => set("k", c)}>
                {c} <span className="ml-1.5 opacity-70">{products.filter((p) => p.category === c).length}</span>
              </button>
            ))}
          </div>
        )}
        {sortable && (
          <label className="flex shrink-0 items-center gap-2 text-sm text-ink-soft">
            Kārtot
            <select className="input !min-h-9 !w-auto !py-1 text-sm" value={sort} onChange={(e) => set("s", e.target.value === "jaunakie" ? null : e.target.value)}>
              {Object.entries(SORTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        )}
      </div>
      <ProductGrid products={shown} />
    </>
  );
}
