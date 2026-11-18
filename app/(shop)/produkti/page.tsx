import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { PageHead } from "@/components/PageHead";
import { ProductGrid } from "@/components/ProductCard";
import { getProducts } from "@/lib/data";
import { waHref } from "@/lib/site";

export const metadata: Metadata = { title: "Produkti", description: "Pieejamie roku darbi, dāvanas un dekori, gatavi paņemšanai." };

export default async function ProductsPage() {
  const available = (await getProducts()).filter((p) => p.available);
  return (
    <div className="wrap">
      <PageHead eyebrow="Veikals" title="Pieejamie produkti">
        Gatavi darbi, ko var paņemt uzreiz. Neatradi īsto? <a href={waHref()} target="_blank" rel="noopener" className="text-brand underline underline-offset-4">Pasūti savu</a>.
      </PageHead>
      {/* Suspense: the chips read the URL, which only exists at request time */}
      <Suspense fallback={<ProductGrid products={available} />}>
        <CatalogBrowser products={available} />
      </Suspense>
    </div>
  );
}
