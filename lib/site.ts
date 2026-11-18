export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zanespuskisi.lv";
export const SITE_NAME = "Zanes Maģija";
export const TIKTOK_URL = "https://www.tiktok.com/@zanepoznaka";

/** Link that opens WhatsApp with a message; /wa adds the shop's number on the server. */
export const waHref = (text = "Sveiki! Vēlos ko pasūtīt.") => `/wa?text=${encodeURIComponent(text)}`;
