import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Zanes Puskisi",
        short_name: "Puskisi",
        theme_color: "#111827",
        start_url: "/",
        display: "standalone",
        background_color: "#111827",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // Important: allow /s/* and /share/* to hit the network.
        // These routes are handled by a Cloud Function to provide OG previews + redirects.
        // If the SW serves index.html for them, the modal deep-link can't work reliably.
        // Also denylist /wa so the WhatsApp redirect function can run.
        navigateFallbackDenylist: [/^\/s\//, /^\/share\//, /^\/wa(\/|$)/],
        runtimeCaching: [
          // Never let the SW serve the SPA shell for these function-backed routes.
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin &&
              (url.pathname === "/wa" || url.pathname.startsWith("/wa/")),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin &&
              (url.pathname.startsWith("/s/") ||
                url.pathname.startsWith("/share/")),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ url }) =>
              url.origin === "https://firebasestorage.googleapis.com" ||
              url.origin === "https://storage.googleapis.com" ||
              url.hostname.endsWith(".firebasestorage.app"),
            handler: "CacheFirst",
            options: {
              cacheName: "firebase-storage-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // Keep chunk sizes smaller by extracting large node_modules into separate chunks.
    // This helps avoid a single bundle becoming >500kb after minification.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor_react";
            }
            if (id.includes("firebase")) {
              return "vendor_firebase";
            }
            if (id.includes("@tailwindcss") || id.includes("tailwindcss")) {
              return "vendor_tailwind";
            }
            return "vendor_misc";
          }
        },
      },
    },
  },
});
