<!-- Project-specific Copilot instructions for contributors and AI agents -->

# ZanesPuskisi — Copilot Instructions (concise)

Purpose: quick, actionable guidance so an AI coding agent can be immediately productive.

- **Project type:** React (v19) + Vite. Tailwind is enabled via `@tailwindcss/vite` in `vite.config.js`.
- **Backend:** Firebase (Auth, Firestore, Storage). Initialization lives in `src/firebase/firebase.js`.

Quick developer commands

- **Install:** `npm install`
- **Dev server:** `npm run dev` (runs `vite`)
- **Build:** `npm run build`
- **Preview:** `npm run preview` (runs `vite preview`)
- **Lint:** `npm run lint` (runs `eslint .`)

High-level architecture & data flow

- **UI:** React app mounts in `src/main.jsx` which imports `src/App.jsx` (note: `src/App.js` is an older alternate file).
- **Primary data model:** Firestore `products` collection. Each product document may include fields (`name`, `description`, `price`, `images`, `available`, `holidaySpecial`, `tiktokLink`) and subcollections:
  - `products/{productId}/likes/{userUid}`
  - `products/{productId}/comments/{commentId}`
- **Likes pattern:** per-product `likes` subcollection keyed by the user's UID; the UI uses `collectionGroup(db, 'likes')` (see `src/hooks/useLikes.js`) to compute counts across products. Preserve this shape when editing data logic.
- **Comments pattern:** runtime code reads/writes `collection(db, 'products', productId, 'comments')`. Note `seedFirestore.js` intentionally writes a top-level `comments` collection (demo data) — do not assume seed structure matches runtime.
- **Storage:** image upload/download URL ↔ storage path decoding is done via a helper in `src/components/ProductModal.jsx`. When changing upload paths, make sure the deletion logic (which derives storage paths from URLs) remains compatible.

Key files to read first

- `src/firebase/firebase.js` — exports `auth`, `db`, `storage`, `googleProvider`.
- `src/hooks/useLikes.js` — central hook for likes behavior and collectionGroup usage.
- `src/components/ProductsGrid.jsx` & `src/components/ProductModal.jsx` — listing, liking, uploads, and deletion flows (ProductModal schedules background cleanup when images are removed).
- `src/components/CommentsSection.jsx` — comment add/list patterns and serverTimestamp usage.
- `seedFirestore.js` — demo seeding script (writes top-level `comments` collection; read before running).

Project-specific conventions & gotchas

- **File mix:** `.js` and `.jsx` are both used. Edit the file actually imported by `src/main.jsx` to affect the running app.
- **Dev tooling:** `vite` + `@vitejs/plugin-react` with `babel-plugin-react-compiler` is enabled — be cautious when altering Babel/plugin config (HMR/react-compiler behavior matters).
- **ESLint rule:** unused vars are allowed if they match `^[A-Z_]` (this permits React components/constants). Run `npm run lint` to see results.
- **Background deletion:** `ProductModal.jsx` uses `setTimeout` to schedule deletion of likes/comments/product after removing images; avoid breaking this timing logic when modifying deletion/cleanup.
- **Auth:** Google provider-based Firebase Auth (use `googleProvider` or `onAuthStateChanged(auth, ...)` patterns present in the codebase).

Concrete examples (copy-paste patterns)

- Toggle like: `doc(db, 'products', productId, 'likes', user.uid')` + `setDoc`/`deleteDoc` (see `src/hooks/useLikes.js`).
- Listen products: `onSnapshot(collection(db, 'products'), ...)` with cleanup return in `ProductsGrid.jsx`.
- Add comment: `addDoc(collection(db, 'products', productId, 'comments'), { message, name, createdAt: serverTimestamp() })`.

When to change data shapes

- Prefer keeping the per-product `likes` subcollection (so `collectionGroup('likes')` queries continue to work). If migrating comments to a top-level collection, update every read/write site and document the migration.

Running seed data

- `node seedFirestore.js` (review the script first — it writes demo data and uses the embedded Firebase config).

If something's unclear or you want more detail (runtime examples, tests, or a migration plan), tell me which section to expand.

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
