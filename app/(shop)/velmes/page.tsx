import type { Metadata } from "next";
import { PageHead } from "@/components/PageHead";
import { WishlistView } from "@/components/WishlistView";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = { title: "Vēlmju saraksts", robots: { index: false } };

export default async function WishlistPage() {
  return (
    <div className="wrap">
      <PageHead eyebrow="Saglabātie" title="Vēlmju saraksts">Saglabāts tikai šajā ierīcē, bez reģistrēšanās.</PageHead>
      <WishlistView products={await getProducts()} />
    </div>
  );
}
