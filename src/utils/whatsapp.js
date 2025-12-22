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
  const proxyUrl = buildWhatsAppProxyUrl(text);
  const jsonUrl = `${proxyUrl}${proxyUrl.includes("?") ? "&" : "?"}format=json`;

  // Key idea: avoid navigating to /wa at all (a stale Service Worker can
  // incorrectly serve the SPA shell for /wa navigations). Instead, fetch the
  // final WhatsApp URL and navigate there directly.

  // Keep an optional blank tab opened synchronously (still counts as user gesture).
  let popup = null;
  try {
    popup = window.open("about:blank", "_blank");
  } catch {
    popup = null;
  }

  // Fire-and-forget async flow.
  (async () => {
    try {
      const resp = await fetch(jsonUrl, { cache: "no-store" });
      const data = await resp.json();
      const target = typeof data?.url === "string" ? data.url : "";
      if (!target) throw new Error("Missing target url");

      if (popup && !popup.closed) {
        popup.location.href = target;
        return;
      }

      window.location.assign(target);
    } catch {
      // Fallback: navigate to /wa (HTML redirect page). This may still be
      // affected by very stale SWs, but is better than nothing.
      try {
        if (popup && !popup.closed) {
          popup.location.href = proxyUrl;
          return;
        }
      } catch {
        // ignore
      }

      try {
        window.location.assign(proxyUrl);
      } catch {
        window.location.href = proxyUrl;
      }
    }
  })();
}
