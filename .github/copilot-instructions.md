## Copilot Instructions — ZanesPuskisi

Purpose: concise, actionable guidance for an AI coding agent to be productive quickly.

**Stack & Runtime:** React 19 + Vite; Tailwind via `@tailwindcss/vite`. Firebase (Auth, Firestore, Storage) powers the backend.

**Quick Commands:**

- `npm install`: install deps
- `npm run dev`: start Vite dev server (HMR)
- `npm run build`: build
- `npm run preview`: preview build
- `npm run lint`: run ESLint

**High‑value files to read first:**

- `src/main.jsx` → imports `src/App.jsx` (edit the file actually imported by `main.jsx`).
- `src/firebase/firebase.js` → exports `auth`, `db`, `storage`, `googleProvider` (credentials are committed).
- `src/hooks/useLikes.js` → canonical like logic and listener patterns.
- `src/components/Home/ProductsGrid.jsx`, `src/components/Modal/ProductModal.jsx`, `src/components/Modal/CommentsSection.jsx` → listing, like/comment UI, image upload/delete, and cleanup flows.

**Data model & important invariants:**

- Primary collection: `products`.
- Likes: stored per-product at `products/{productId}/likes/{userUid}` — keep this shape (UI uses per-product listeners; `useLikes.js` relies on it).
- Comments: runtime expects `products/{productId}/comments` subcollections (do not assume any top-level `comments` script unless explicitly present).

**Patterns & gotchas to preserve:**

- `useLikes.js`: subscribes to each product's `likes` subcollection (preferred over collectionGroup for robustness). Follow its structure when adding listeners.
- `ProductModal.jsx`: uses `getStoragePathFromUrl(url)` to derive storage object paths before deleting — keep storage URL decoding compatible.
- Product/image deletion: code schedules background cleanup using `setTimeout` to avoid race conditions; preserve or explicitly replace that behavior.
- Mixed `.js`/`.jsx`: always follow the import used by `src/main.jsx` (currently `App.jsx`).

**Auth & security notes:**

- Firebase credentials are in `src/firebase/firebase.js`. If switching projects, update this file (and any seed scripts) or refactor to env vars.
- Like documents include `userId` to satisfy Firestore rules; preserve that shape when creating/deleting likes.

**Examples (copy/paste):**

- Toggle like: `doc(db, 'products', productId, 'likes', user.uid)` then `setDoc` / `deleteDoc` (see `src/hooks/useLikes.js`).
- Add comment: `addDoc(collection(db, 'products', productId, 'comments'), { message, name, createdAt: serverTimestamp() })` (see `CommentsSection.jsx`).
- Listen to products: `onSnapshot(collection(db, 'products'), ...)` (see `ProductsGrid.jsx`).

If you want, I can expand this with a short migration checklist (e.g., moving comments to a top-level collection) or add a small troubleshooting section for common runtime errors. Please tell me which section to expand.
