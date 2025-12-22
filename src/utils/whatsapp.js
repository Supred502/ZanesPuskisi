const WHATSAPP_PROXY_PATH = "/wa";

export function buildWhatsAppProxyUrl(text) {
  const msg = typeof text === "string" ? text : String(text ?? "");
  try {
    const origin = window.location.origin;
    return `${origin}${WHATSAPP_PROXY_PATH}?text=${encodeURIComponent(msg)}`;
  } catch {
    return `${WHATSAPP_PROXY_PATH}?text=${encodeURIComponent(msg)}`;
  }
}

export function openWhatsApp(text) {
  const url = buildWhatsAppProxyUrl(text);
  window.open(url, "_blank", "noopener,noreferrer");
}
