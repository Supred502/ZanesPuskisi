export const INSPIRATION_CATEGORIES = [
  "Ūdensrozes",
  "Rožu pušķīši",
  "Rozes dāvanu kastes",
  "Adventes kompozīcijas",
  "Ziemassvētku",
  "Valentīna dienas",
  "Lieldienas",
  "Māmiņdienas",
  "Citu ziedu dekori",
];

export const DEFAULT_INSPIRATION_CATEGORY = "Citu ziedu dekori";

function normalizeForMatch(value) {
  const s = String(value || "")
    .toLocaleLowerCase("lv")
    // Remove diacritics so "ūdens" also matches "udens".
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
  return s;
}

/**
 * Suggests an inspiration category from a product name.
 *
 * This is a best-effort hint: callers should only apply it when the admin
 * hasn't manually chosen a category.
 */
export function suggestInspirationCategoryFromName(name) {
  const n = normalizeForMatch(name);
  if (!n) return DEFAULT_INSPIRATION_CATEGORY;

  // More specific matches first to avoid overlaps.
  if (
    n.includes("udensroze") ||
    n.includes("udensrozes") ||
    n.includes("udensrozu")
  ) {
    return "Ūdensrozes";
  }

  if (n.includes("advent") || n.includes("adventes")) {
    return "Adventes kompozīcijas";
  }

  if (n.includes("ziemassvet") || n.includes("ziemassv")) {
    return "Ziemassvētku";
  }

  if (n.includes("valentin") || n.includes("mila") || n.includes("sird")) {
    return "Valentīna dienas";
  }

  if (n.includes("lieldien")) {
    return "Lieldienas";
  }

  if (
    n.includes("mamin") ||
    n.includes("mammu") ||
    n.includes("mate") ||
    n.includes("mami")
  ) {
    return "Māmiņdienas";
  }

  // Roses: gift boxes vs small bouquets.
  const looksLikeBox =
    n.includes("kaste") || n.includes("kastes") || n.includes("box");
  const looksLikeBouquet =
    n.includes("pusk") ||
    n.includes("puski") ||
    n.includes("puski") ||
    n.includes("buket");
  const mentionsRose =
    n.includes("roze") || n.includes("rozes") || n.includes("rozu");

  if (mentionsRose && looksLikeBox) {
    return "Rozes dāvanu kastes";
  }
  if (mentionsRose && looksLikeBouquet) {
    return "Rožu pušķīši";
  }

  return DEFAULT_INSPIRATION_CATEGORY;
}

export function coerceInspirationCategory(value) {
  if (INSPIRATION_CATEGORIES.includes(value)) return value;
  return DEFAULT_INSPIRATION_CATEGORY;
}
