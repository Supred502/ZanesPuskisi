// The old site (until 2026) installed an offline service worker at /sw.js that kept serving stale pages.
// Browsers still re-check this URL, get this file, and it removes itself and the old caches.
// shortcut: safe to delete this file in 2027, once old visitors have all come back once.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) await caches.delete(key);
      await self.registration.unregister();
      for (const client of await self.clients.matchAll({ type: "window" })) client.navigate(client.url);
    })(),
  );
});
