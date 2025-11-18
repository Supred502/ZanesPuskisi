<!-- Project-specific Copilot instructions for contributors and AI agents -->

# ZanesPuskisi — Copilot Instructions

Purpose: short, actionable guidance for AI coding agents to be immediately productive in this repository.

- Project type: React (v19) + Vite. Tailwind is integrated via `@tailwindcss/vite` plugin in `vite.config.js`.
- Backend: Firebase (Auth, Firestore, Storage) initialized in `src/firebase/firebase.js` and used throughout UI components.

Quick start (developer commands)

- Install deps: `npm install`
- Dev server: `npm run dev` (runs `vite`)
- Build: `npm run build`
- Preview production build: `npm run preview` (runs `vite preview`)
- Lint: `npm run lint` (runs `eslint .`)

Key files to read first

- `src/firebase/firebase.js` — Firebase initialization and exported `auth`, `db`, `storage`, `googleProvider`.
- `seedFirestore.js` — example seeding script (note: writes a top-level `comments` collection; runtime code uses per-product subcollections).
- `src/hooks/useLikes.js` — central custom hook illustrating how likes are stored and observed.
- `src/components/ProductsGrid.js` and `src/components/ProductModal.js` — core UI flows: listing, liking, image upload/delete, and background product deletion.
- `src/components/CommentsSection.js` — comments are read/written under `products/{productId}/comments`.
- `vite.config.js` and `eslint.config.js` — build and lint behavior (React compiler babel plugin is enabled).

Important architecture & data-flow notes (read these before changing data code)

- Primary data model: Firestore `products` collection. Each product may have:
  - fields: `name`, `description`, `price`, `images` (array), `available`, `holidaySpecial`, `tiktokLink`.
  - subcollections: `products/{productId}/likes/{uid}` and `products/{productId}/comments/{cid}`.
- Likes: stored as documents under `products/{productId}/likes/{userUid}`. The UI listens using a `collectionGroup(db, 'likes')` query (see `useLikes.js`) to compute counts across products. Any code changing likes must maintain that shape.
- Comments: UI code uses `collection(db, 'products', productId, 'comments')`. Note: `seedFirestore.js` writes a top-level `comments` collection for demo data — do not assume seed structure matches runtime shape.
- Product deletion: `ProductModal` removes images and, if images become empty, schedules background deletion of likes, comments, and the product document itself (uses `setTimeout` to avoid race conditions). Keep this background behavior in mind when changing deletion logic.
- Storage URLs: code uses `getStoragePathFromUrl(url)` helper in `ProductModal.js` to compute storage object paths for deletion. When adding/changing upload paths, keep download URL -> storage path decoding compatible.

Auth & security

- Auth uses Firebase Auth with Google provider (`googleProvider` exported from `src/firebase/firebase.js`). UI components rely on `auth.onAuthStateChanged` or `onAuthStateChanged(auth, ...)`.
- The repo currently contains an embedded Firebase config in `src/firebase/firebase.js` and `seedFirestore.js`. If you intend to run against a different Firebase project, update those files or refactor to use environment variables — searches/changes should start at those two files.

Tooling and conventions

- ESLint: configured in `eslint.config.js`. Rule: unused vars are allowed if matching `^[A-Z_]` (used to permit React components, constants). Run `npm run lint`.
- Vite uses `@vitejs/plugin-react` with `babel-plugin-react-compiler` enabled in `vite.config.js`. Be cautious when editing Babel/plugin behavior — HMR and React Compiler are intentionally enabled.
- File extensions: mix of `.js` and `.jsx`. Note: `src/main.jsx` imports `./App.jsx` (so `App.jsx` is currently the entry). There is also `src/App.js` (older/alternate app). Modify the file referenced by `src/main.jsx` when changing the mounted app.

Examples (patterns to follow)

- Toggle a like: `doc(db, 'products', productId, 'likes', user.uid)` and use `setDoc` / `deleteDoc` as implemented in `useLikes.js`.
- Listen for products: `onSnapshot(collection(db, 'products'), ...)` used in `ProductsGrid.js` with a cleanup return function.
- Add a comment: `addDoc(collection(db, 'products', productId, 'comments'), { message, name, createdAt: serverTimestamp() })` (see `CommentsSection.js`).

What to watch for / known quirks

- Duplicate app files: both `src/App.jsx` and `src/App.js` exist. `src/main.jsx` imports `App.jsx` — editing the wrong file may have no effect.
- Seed vs runtime comments mismatch: `seedFirestore.js` writes a top-level `comments` collection with `productId` fields; runtime expects per-product subcollections. If you run the seed script you may need to migrate or adapt demo data.
- Hard-coded Firebase config: credentials are in repo files; if you change the project, update both `src/firebase/firebase.js` and `seedFirestore.js`.

When modifying data structure

- Prefer keeping likes as a per-product `likes` subcollection keyed by user UID (keeping `collectionGroup('likes')` listeners working).
- If switching comments to a top-level collection for scalability, update all read/write sites (e.g., `CommentsSection.js`, `ProductModal` background deletion, `useLikes` assumptions) and add migration notes here.

If something is unclear or you'd like the instructions to be more detailed (examples, test commands, or a migration plan), tell me which section to expand.
