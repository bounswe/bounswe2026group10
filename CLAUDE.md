# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Roots & Recipes** — A cross-generational recipe and food heritage platform (CMPE354 Group 10, BounSWE 2026). The workspace contains three independent apps sharing one backend:

- `backend/` — Node.js/Express REST API (TypeScript, Supabase/PostgreSQL)
- `frontend/` — React web app (TypeScript, Vite, Redux Toolkit)
- `mobile/` — React Native app (TypeScript, Expo SDK 54)

---

## Commands

### Backend (`cd backend`)
```bash
npm run dev          # ts-node dev server on port 3000
npm run build        # compile TypeScript → dist/
npm test             # Jest (--runInBand)
npm run test:coverage
npx jest src/__tests__/recipes.test.ts   # run a single test file
```

### Frontend (`cd frontend`)
```bash
npm run dev          # Vite dev server (proxies /api → localhost:3000)
npm run build        # TypeScript + Vite build
npm run lint         # ESLint
npm run preview      # preview production build
```

### Mobile (`cd mobile`)
```bash
npm start            # Expo CLI
npm run android
npm run ios
npm test             # Jest + jest-expo
npx jest path/to/test.ts   # run a single test file
```

---

## Architecture

### Backend
- **Framework:** Express 5 + TypeScript, Supabase (PostgreSQL + Auth)
- **Validation:** Zod on all routes
- **Routes:** `/auth`, `/recipes`, `/media`, `/dish-genres`, `/dish-varieties`, `/discovery`, `/dietary-tags`, `/ingredients`, `/substitutions`, `/tools`, `/units`, `/parse`
- **Key dirs:** `src/routes/`, `src/middleware/` (auth, validate), `src/config/`
- **Docker:** Multi-stage Dockerfile in `backend/`, no docker-compose
- **Detailed docs:** `backend/CLAUDE.md` — full DB schema, all endpoint signatures, error codes, testing patterns

### Frontend
- **Data flow (mandatory):** `pages/components → store (slices/thunks) → services → lib/http-client → API`
- **Services** (`src/services/*-service.ts`): one file per backend resource, async functions only, no React/dispatch
- **State:** Redux Toolkit slices in `src/store/slices/`; use `useAppSelector`/`useAppDispatch` from `src/store/hooks.ts`
- **HTTP:** Axios instance in `src/lib/http-client.ts`; dev Vite proxy `/api` → `localhost:3000`
- **i18n:** EN/TR via i18next; all user-visible strings must use `useTranslation('common')` with keys in `src/locales/{en,tr}/common.json`
- **Styling:** CSS variables (design tokens) in `index.css`; follow breakpoints from `docs/design/web/instructions/00-overview.md` (< 768px bottom nav, ≥ 768px top nav)
- **Alias:** `@/` maps to `src/`
- **Pages:** one folder per route in `src/pages/<Screen>/`; page-local components go in `Parts/`; shared components in `src/components/UiComponents/` (cards, etc.) and `src/components/Layout/` (MainLayout, HeaderUser, BottomNav)
- **Mock fallback pattern:** services fall back to mock data (in `src/mocks/`) when the API returns empty or errors — remove mocks once backend endpoints are stable

### Mobile
- **Navigation:** React Navigation v7; `AuthStack` (Welcome/Register/Login) vs. `TabNavigator` (Home, Search, Create, Library, Profile) each with their own nested stack
- **Auth state:** `AuthContext` (`mobile/src/context/AuthContext.tsx`) — wraps the app, provides `user`, `login`, `logout`; consumed via `useAuth()`
- **Recipe creation:** 4-step wizard driven by `RecipeFormContext` (`mobile/src/context/RecipeFormContext.tsx`) — shared state across CreateBasicInfo → CreateIngredientsTools → CreateSteps → CreateReview screens
- **Components:** screen-specific pieces in `mobile/src/components/<screen>/`; shared primitives (Badge, StarRating, RecipeCardSmall, etc.) in `mobile/src/components/shared/`
- **API calls:** made directly in screens/contexts via `fetchApi` helper (no Redux); base URL set in `mobile/src/api/`
- **Detailed docs:** `mobile/CLAUDE.md` — full screen inventory, scenario mapping, branch/PR/commit conventions

---

## Domain Glossary
- **Dish Genre** — broad food category (e.g. Pastries, Stews, Soups)
- **Dish Variety** — specific dish within a genre (e.g. Börek, Baklava) — `genreId` FK
- **Recipe** — user-created content referencing a Dish Variety; type is `'cultural'` or `'community'`

---

## User Roles
| Role | Can do |
|------|--------|
| `learner` | Browse, discover, rate recipes |
| `cook` | + Create **community** recipes, upload media |
| `expert` | + Create **cultural** recipes |

Role is set at registration and stored in `profiles.role`. The `requireRole()` middleware enforces this.

## API Response Envelope
All backend endpoints return:
```json
{ "success": true,  "data": <T>,   "error": null }
{ "success": false, "data": null,  "error": { "code": "ERROR_CODE", "message": "..." } }
```

## Backend API Shape (key normalizations for frontend)
Backend uses `snake_case`; frontend normalizes to `camelCase` in service modules:
- `image_url` → `imageUrl`, `average_rating` → `averageRating`, `created_at` → `createdAt`
- `dish_variety.dish_genre` nests the genre on variety objects
- `profile.username` / `profile.role` on recipe objects

---

## Git Conventions
- Conventional Commits: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- Scope by area: `feat(auth):`, `feat(frontend/search):`, `feat(backend/discovery):`
- One coherent change per commit
- Branch names: `<area>/<type>_<short-description>` — e.g. `mobile/feature_login-screen`, `backend/fix_rating-delete`
- Areas: `mobile`, `frontend`, `backend`, `docs` — always branch from `main`

## PR Checklist

### Frontend
- No API calls in components directly (go through store/services)
- All user-visible strings in `locales/{en,tr}/common.json`
- Styles use CSS design tokens
- `npm run build` passes (runs TypeScript + Vite)

### Mobile
- No raw `fetch` calls outside of `fetchApi` helper
- Auth-gated screens check `useAuth()` before rendering
- `npm test` passes
