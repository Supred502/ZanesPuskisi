import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { PageHead } from "@/components/PageHead";
import { ProductGrid } from "@/components/ProductCard";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = { title: "Iedvesma", description: "Iepriekš veidotie roku darbi, dāvanas un dekori. Patīk kāds? Varu izveidot līdzīgu." };

export default async function InspirationPage() {
  const past = (await getProducts()).filter((p) => !p.available);
  return (
    <div className="wrap">
      <PageHead eyebrow="Iepriekšējie darbi" title="Darbu galerija">
        Šie darbi jau atraduši mājas, bet līdzīgu var izveidot arī tev. Atver kādu un spied „Pasūtīt līdzīgu”.
      </PageHead>
      <Suspense fallback={<ProductGrid products={past} />}>
        <CatalogBrowser products={past} sortable={false} />
      </Suspense>
    </div>
  );
}
