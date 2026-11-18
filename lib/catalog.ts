// Shared product logic: types, categories, prices. Pure functions so both server and client (and tests) can use them.

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean; // true = for sale now, false = already made/sold (shown as inspiration)
  holidaySpecial: boolean;
  holidayPrice: number | null;
  tiktokLink: string | null;
  images: string[];
  createdAt: number; // ms, 0 if unknown
};

export const CATEGORIES = [
  "Ūdensrozes",
  "Rožu pušķīši",
  "Rozes dāvanu kastes",
  "Adventes kompozīcijas",
  "Ziemassvētku",
  "Valentīna dienas",
  "Lieldienas",
  "Māmiņdienas",
  "Citu ziedu dekori",
] as const;

export const DEFAULT_CATEGORY = "Citu ziedu dekori";

export const coerceCategory = (value: unknown): string =>
  (CATEGORIES as readonly unknown[]).includes(value) ? (value as string) : DEFAULT_CATEGORY;

const plain = (s: string) => s.toLocaleLowerCase("lv").normalize("NFD").replace(/\p{Diacritic}/gu, "");

/** Best-effort category guess from a product name; the admin can always override it. */
export function suggestCategory(name: string): string {
  const n = plain(name);
  const has = (...parts: string[]) => parts.some((p) => n.includes(p));
  if (has("udensroz")) return "Ūdensrozes";
  if (has("advent")) return "Adventes kompozīcijas";
  if (has("ziemassv")) return "Ziemassvētku";
  if (has("valentin", "mila", "sird")) return "Valentīna dienas";
  if (has("lieldien")) return "Lieldienas";
  if (has("mamin", "mammu", "mate", "mami")) return "Māmiņdienas";
  if (has("roze", "rozu")) {
    if (has("kaste", "box")) return "Rozes dāvanu kastes";
    if (has("pusk", "buket")) return "Rožu pušķīši";
  }
  return DEFAULT_CATEGORY;
}

/** The price a customer pays now: the holiday price only when it is a real discount. */
export function currentPrice(p: Pick<Product, "price" | "holidaySpecial" | "holidayPrice">): number {
  return p.holidaySpecial && p.holidayPrice != null && p.holidayPrice > 0 && p.holidayPrice < p.price
    ? p.holidayPrice
    : p.price;
}

const eur = new Intl.NumberFormat("lv-LV", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const formatPrice = (n: number) => eur.format(n);

/** Turn a raw Firestore document into a clean Product (old docs may use `imageURL` and loose types). */
export function toProduct(id: string, d: Record<string, unknown>): Product {
  const images = Array.isArray(d.images) ? d.images.filter((u): u is string => typeof u === "string" && u.length > 0)
    : typeof d.imageURL === "string" ? [d.imageURL] : [];
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
  const ts = d.createdAt as { toMillis?: () => number } | undefined;
  return {
    id,
    name: String(d.name ?? "").trim() || "Bez nosaukuma",
    description: String(d.description ?? ""),
    price: num(d.price),
    category: coerceCategory(d.category),
    available: d.available !== false,
    holidaySpecial: d.holidaySpecial === true,
    holidayPrice: d.holidayPrice == null || d.holidayPrice === "" ? null : num(d.holidayPrice),
    tiktokLink: typeof d.tiktokLink === "string" && d.tiktokLink.startsWith("https://") ? d.tiktokLink : null,
    images,
    createdAt: typeof ts?.toMillis === "function" ? ts.toMillis() : 0,
  };
}

/** Newest first. */
export const byNewest = (a: Product, b: Product) => b.createdAt - a.createdAt;

/** Message pre-filled in WhatsApp when a customer asks about a product. */
export const orderMessage = (p: Pick<Product, "name">, url: string) =>
  `Sveiki! Mani interesē „${p.name}”.\n${url}`;
