## Copilot Instructions — ZanesPuskisi

Purpose: repo-specific notes so an AI coding agent can ship changes fast without breaking Firebase flows, deep-links, OG previews, or the PWA.

### Stack & Commands

- React 19 + Vite (ESM) + Tailwind v4 (`@tailwindcss/vite`). Firebase Web SDK (Auth/Firestore/Storage). PWA via `vite-plugin-pwa`.
- Commands: `npm install`, `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`.
- Cloud Functions live in `functions/` (Node 20) and are wired via Hosting rewrites in `firebase.json`.

### SPA Routing & Navigation (no react-router)

- `src/App.jsx` routes by `window.location.pathname` and `React.lazy` loads pages; changing routes is a full navigation.
- `src/components/Navbar.jsx` uses `<a href>` but intercepts clicks to `window.location.assign(...)` (preserve this pattern).

### Deep-links, OG Previews, and Service Worker (critical)

- Product modal deep-linking is URL-driven in `src/components/Home/ProductsGrid.jsx`:
  - open: `#product-<id>` (preferred) or `?p=<id>` (share landing)
  - URL writes preserve scroll via `src/utils/history.js` (`pushUrlPreserveScroll` / `replaceUrlPreserveScroll`).
- `/s/<id>` and `/share/<id>` are Hosting rewrites to the `share` function in `functions/index.js` (returns OG-tag HTML + meta-refresh/JS redirect to `/produkti?p=<id>`).
- WhatsApp is also function-backed: `/wa` and `/wa/**` rewrite to `whatsapp` in `functions/index.js`.
- PWA: `src/main.jsx` registers the SW only in `import.meta.env.PROD`. `vite.config.js` deny-lists `/s/`, `/share/`, and `/wa` from navigate fallback so previews/redirects keep working.

### Firebase Data Model & Access

- Products: Firestore `products` is public read; admin-only writes (see `firestore.rules`). Admin gate is `src/utils/isAdminUid.js`.
- Wishlist: `users/{uid}/wishlist/{productId}` when signed in; signed-out fallback is localStorage `wishlist_local_v1` (see `src/hooks/useWishlist.js`).
  - Synced mode is optimistic (updates local state first, then `setDoc`/`deleteDoc`, reconciled by `onSnapshot`).
  - Local mode dispatches `wishlist:changed` for cross-tab refresh.
- Inquiries: `products/{productId}/inquiries` exists but is currently admin-only in `firestore.rules` (public form submissions are disabled; UI uses WhatsApp flow).

### Images, URLs, and Caching

- Products may store `images: string[]` (preferred) or legacy `imageURL`; always normalize Storage URLs via `src/utils/normalizeFirebaseStorageUrl.js`.
- Upload paths follow `products/<uid|anon>/<timestamp>_*_<filename>` (see `src/components/Home/AdminPanel.jsx`, `src/components/Modal/ProductModal.jsx`).
- `src/utils/readImagesStore.js` caches:
  - image URLs in localStorage (`zp_read_images_v1`) for 24h
  - product lists in sessionStorage (`zp_products_session_v1`) to avoid repeated Firestore reads
  - idle-prefetch for non-first images (used by `ProductsGrid.jsx`).
- Product deletion edge case: deleting the last image triggers a delayed product doc cleanup via `setTimeout(..., 200)` in `ProductModal.jsx` — preserve unless intentionally redesigning.

### Key Files (start here)

- `src/main.jsx`, `src/App.jsx`, `src/components/Home/ProductsGrid.jsx`, `src/components/Modal/ProductModal.jsx`
- `src/hooks/useWishlist.js`, `src/utils/readImagesStore.js`, `src/utils/history.js`, `src/utils/whatsapp.js`
- `functions/index.js`, `firebase.json`, `firestore.rules`, `vite.config.js`
