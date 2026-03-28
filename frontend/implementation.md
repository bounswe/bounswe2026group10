# Frontend implementation guide

This document defines **rules and conventions** for building the Roots & Recipes web app. Follow it during implementation so the codebase stays consistent, reviewable, and aligned with the backend and design specs.

---

## 1. Scope and references

- **Product design (screens, IA, breakpoints):** [`docs/design/web/instructions/`](../docs/design/web/instructions/) (start with `00-overview.md`).
- **Visual identity (colors, typography):** [`docs/design/DESIGN.md`](../docs/design/DESIGN.md).
- **UI reference implementation (to adapt, not copy blindly):** the separate `web-design` prototype in the workspace—port layouts and styles into this app’s `pages/` and `components/` structure.
- **API:** Express backend under `backend/`; keep service modules aligned with route prefixes (`/auth`, `/recipes`, `/discovery`, etc.).

---

## 2. Repository layout (root of this app)

| Path | Responsibility |
|------|----------------|
| `index.html` | SPA entry. |
| `vite.config.ts` | Build, `@` alias, dev **proxy** (`/api` → backend). |
| `package.json` | Dependencies and scripts. |
| `.env` / `.env.example` | `VITE_*` variables only; never commit secrets. `.env.example` documents safe defaults. |
| `public/` | Static files served as-is (favicon, large fixed-URL assets). |
| `src/` | All application source code. |

---

## 3. Folder structure under `src/`

```
src/
├── main.tsx                 # createRoot; global providers (Redux, i18n)
├── App.tsx                  # RouterProvider only
├── index.css                # Global styles, design tokens (CSS variables)
├── vite-env.d.ts            # Vite / ImportMetaEnv typings
│
├── i18n/
│   └── i18n.ts              # i18next initialization
├── locales/
│   ├── en/
│   │   └── common.json      # (and feature namespaces as you add them)
│   └── tr/
│       └── common.json
│
├── router/
│   ├── index.tsx            # createBrowserRouter, route tree
│   └── RouteError.tsx       # Route-level error UI
│
├── auth/
│   ├── ProtectedRoute.tsx   # Redirect unauthenticated users
│   └── session.ts           # Token read/write strategy (no UI)
│
├── components/
│   ├── Layout/              # Shell: header, nav, outlet—no page business logic
│   └── UiComponents/        # Shared UI: buttons, modals, skeletons, toasts
│
├── pages/                   # One folder per top-level route / screen
│   ├── Home/
│   ├── Login/
│   └── …                    # e.g. Search/, RecipeDetail/, Parts/ for page-only UI
│
├── services/                # HTTP calls only; no React, no dispatch
│   └── *-service.ts         # e.g. auth-service.ts, recipes-service.ts
│
├── store/
│   ├── store.ts             # configureStore, RootState, AppDispatch
│   ├── hooks.ts             # useAppDispatch, useAppSelector
│   ├── slices/              # createSlice per domain
│   └── actions/             # Optional: thunks / complex flows (team choice)
│
├── common/                  # Shared constants, cross-feature helpers
├── hooks/                   # Reusable React hooks
├── utils/                   # Pure functions (dates, formatters, validators)
├── lib/                     # Thin wrappers (e.g. axios instance: http-client.ts)
└── assets/                  # Images, fonts, bundled static files
```

**Empty folders:** Use `.gitkeep` until the first real file lands so Git preserves the directory.

---

## 4. Data flow (mandatory direction)

```text
pages / components  →  store (slices / thunks)  →  services  →  lib (http-client)  →  API
```

**Rules:**

- **UI** must not call `axios`/`fetch` directly for app API traffic—use **services** + **http-client**.
- **Services** must **not** import the Redux store or call `dispatch`. They return data (or throw); callers update state.
- **Side effects** (loading flags, errors) live in **thunks** (or slice listeners) in `store/`, not inside service modules.

---

## 5. Layer-specific rules

### 5.1 `pages/`

- One **folder per primary screen** (matches a route or a clear sub-flow).
- Route components stay thin: compose **Layout** + hooks + presentational pieces.
- **Page-only** components go under `pages/<Screen>/Parts/` (or `components/` local to that page). If a component is used on **two or more pages**, move it to `components/UiComponents/` (or `common/` if not visual).

### 5.2 `components/Layout/`

- Provides **chrome** only: navigation regions, `<Outlet />`, optional theme wrapper.
- No fetching, no domain rules—delegate to pages or hooks.

### 5.3 `components/UiComponents/`

- Presentational building blocks with stable APIs (props, variants).
- No direct API calls; may receive data and callbacks from parents.

### 5.4 `services/`

- **One module per backend resource** or bounded context, e.g. `auth-service.ts`, `discovery-service.ts`.
- Export **async functions** that use `httpClient` from `lib/http-client.ts`.
- Parse or validate responses with **TypeScript types** shared or colocated in `src/types/` or next to services if small.
- Align URL paths with the backend (`/auth/login`, `/discovery/recipes`, …).

### 5.5 `store/`

- Use **Redux Toolkit** (`configureStore`, `createSlice`).
- Prefer **small slices** per domain (auth, discovery, recipeDraft, …).
- Use **`src/store/hooks.ts`** (`useAppSelector`, `useAppDispatch`) everywhere—avoid raw `useDispatch`/`useSelector` without types.

### 5.6 `auth/`

- **`session.ts`:** single place for token storage (memory, `sessionStorage`, or future httpOnly cookie contract with backend). Components do not read `localStorage` for tokens directly—go through helpers here.
- **`ProtectedRoute.tsx`:** gate children; redirect to `/login` (or welcome) when unauthenticated. Keep **auth callback / OAuth return URLs** outside the protected layout tree when you add them (avoid redirect loops).

### 5.7 `router/`

- **Only** route definitions and router-related small components (`RouteError`).
- Use **`createBrowserRouter`** + **`RouterProvider`**.
- Use **`errorElement`** (and/or a catch-all route) for failures.
- **Lazy loading:** prefer `React.lazy` + `Suspense` on heavy routes when bundle size grows.

### 5.8 `i18n/` and `locales/`

- No user-visible string literals in **pages** for product copy—use **`useTranslation`** and JSON namespaces.
- Add namespaces by feature when `common.json` grows too large (`auth.json`, `recipe.json`, …).

### 5.9 Styling and design tokens

- Define **colors and typography** to match [`docs/design/DESIGN.md`](../docs/design/DESIGN.md) via **CSS variables** in `index.css` (or a dedicated `theme.css` imported from `main.tsx`).
- When porting from `web-design`, **replace** ad-hoc colors with tokens.
- Respect **breakpoints** from `00-overview.md` (narrow &lt; 768px vs wide ≥ 768px) for shell layout (bottom nav vs top nav).

---

## 6. Imports and aliases

- Use the **`@/`** alias for imports from `src/` (configured in Vite and `tsconfig.app.json`).
- Prefer **named exports** for new modules where it improves tree-shaking and refactors; keep consistency within a folder.

**Example:**

```ts
import { httpClient } from '@/lib/http-client'
import { useAppSelector } from '@/store/hooks'
```

---

## 7. Environment variables

- Only variables prefixed with **`VITE_`** are exposed to the client.
- **`VITE_API_BASE_URL`:** in local dev, typically `/api` so Vite’s **proxy** forwards to the backend without CORS issues.
- Document new variables in **`.env.example`**; never commit **`.env`**.

---

## 8. Git and commit hygiene

- **One commit = one coherent change** (e.g. `feat(auth): add login service`, not mixed with unrelated proxy fixes).
- Prefer **[Conventional Commits](https://www.conventionalcommits.org/)**: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`.
- **Large UI ports** from `web-design`: separate commits or PRs per screen or feature slice.
- If backend is missing an endpoint, **document** it (issue/wiki) and ship UI with a clear **TODO** or feature flag—avoid silent mocks in production paths without a follow-up.

---

## 9. TypeScript and quality bar

- **`strict`** mode stays on; do not loosen compiler options without team agreement.
- **Avoid `any`**; use `unknown` and narrow, or define API DTO types.
- Run **`npm run lint`** and **`npm run build`** before pushing.
- Add **unit tests** for pure `utils/` and critical **services** (parsing, error mapping) when logic grows.

---

## 10. Security notes

- Never log or commit **tokens**, passwords, or service keys.
- Prefer **httpOnly cookies** for refresh tokens if the backend moves that way; until then, document risks of `localStorage` in `session.ts` comments.

---

## 11. Checklist before opening a PR

- [ ] New files live in the correct **layer** (no API calls in components except through store/services).
- [ ] Strings user-visible in EN/TR (or documented fallback) via **i18n** where appropriate.
- [ ] Styles use **design tokens** where applicable.
- [ ] **`.env.example`** updated if new `VITE_` vars were added.
- [ ] `npm run build` passes.

---

*This guide is the single source of truth for frontend structure and process in this repository. Update it when the team agrees on a new convention.*