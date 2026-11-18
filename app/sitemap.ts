import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return [
    ...["", "/produkti", "/iedvesma", "/par-mani", "/privatums"].map((p) => ({ url: SITE_URL + p })),
    ...products.map((p) => ({ url: `${SITE_URL}/produkti/${p.id}`, lastModified: p.createdAt ? new Date(p.createdAt) : undefined })),
  ];
}
