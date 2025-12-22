## Copilot Instructions — ZanesPuskisi

Purpose: repo-specific notes so an AI coding agent can ship changes fast without breaking Firebase flows, deep-links, or the PWA.

### Stack & Commands

- React 19 + Vite (ESM). Tailwind via `@tailwindcss/vite`. Firebase: Auth + Firestore + Storage.
- Commands: `npm install`, `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`.

### App Structure (important)

- Entry: `src/main.jsx` mounts `src/App.jsx` and registers the PWA SW only in `import.meta.env.PROD`.
- Routing: no `react-router`. `src/App.jsx` uses `window.location.pathname` and lazily loads pages.
- Navigation: `src/components/Navbar.jsx` uses normal `<a href>` but intercepts click to `window.location.assign(...)`.

### Firebase Model & Invariants

- Products: Firestore collection `products` (readable by anyone). Admins write (see `firestore.rules`).
- Wishlist: per-user subcollection `users/{uid}/wishlist/{productId}` when signed in; local-only fallback in `localStorage` when signed out (see `src/hooks/useWishlist.js`).
- Inquiries: `products/{productId}/inquiries` subcollection; public can `create`, admins can read/manage (see `firestore.rules`, used by `src/components/Modal/ProductModal.jsx`).

### Deep-links + Share Previews (critical)

- `/s/<id>` and `/share/<id>` are Firebase Hosting rewrites to the Cloud Function `share` (see `firebase.json`, `functions/index.js`).
- The function returns OG-tag HTML and redirects to `/produkti?p=<id>`.
- The SPA opens the modal by reading `?p=<id>` or `#product-<id>` inside `src/components/Home/ProductsGrid.jsx`.
- PWA: `vite.config.js` denies SW navigate fallback for `/s/` and `/share/` to keep OG previews working.

### Storage URLs & Image Handling

- Upload paths are `products/<uid|anon>/<timestamp>_<idx>_<filename>` (see `AdminPanel.jsx`, `ProductModal.jsx`).
- When rendering stored image URLs, use `src/utils/normalizeFirebaseStorageUrl.js` to handle older `*.appspot.com` bucket URLs.
- Deleting the last image triggers a delayed product doc cleanup via `setTimeout(..., 200)` in `ProductModal.jsx`—preserve that behavior unless you replace it intentionally.

### “Source of truth” files

- `src/App.jsx`, `src/components/Home/ProductsGrid.jsx`, `src/components/Modal/ProductModal.jsx`
- `src/hooks/useWishlist.js`, `src/firebase/firebase.js`, `src/utils/normalizeFirebaseStorageUrl.js`
- `functions/index.js`, `firebase.json`, `firestore.rules`, `vite.config.js`

### Copy/paste snippets (match repo patterns)

- Toggle wishlist (signed-in): `doc(db, 'users', user.uid, 'wishlist', productId)` + `setDoc/deleteDoc` (see `src/hooks/useWishlist.js`).
- Create inquiry: `addDoc(collection(db, 'products', productId, 'inquiries'), { name, message, createdAt: serverTimestamp(), shareLink })` (see `ProductModal.jsx`).
