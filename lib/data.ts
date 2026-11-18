import { cacheLife, cacheTag } from "next/cache";
import { getFirestore, collection, getDocs } from "firebase/firestore/lite";
import { app } from "@/lib/firebase";
import { byNewest, toProduct, type Product } from "@/lib/catalog";

// Products are public (firestore.rules), so the server reads them with the web SDK, no service account needed.
// The admin clears the "products" tag on every save (app/admin/actions.ts), but that cache lives in one server instance,
// so other instances and fresh starts re-read Firestore after at most 5 minutes.
// shortcut: loads the whole catalogue in one read (~50 docs); add queries/pagination past ~1000 products.
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 86400 });
  cacheTag("products");
  const snap = await getDocs(collection(getFirestore(app), "products"));
  return snap.docs.map((d) => toProduct(d.id, d.data())).sort(byNewest);
}

export async function getProduct(id: string): Promise<Product | null> {
  return (await getProducts()).find((p) => p.id === id) ?? null;
}
