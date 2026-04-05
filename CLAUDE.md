# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Roots & Recipes** — A cross-generational recipe & food heritage platform. CMPE354 Software Engineering course project at Bogazici University (bounswe2026group10).

**Workspace structure:** Three independent apps sharing one backend:
- `backend/` — Node.js/Express REST API (TypeScript, Supabase/PostgreSQL)
- `frontend/` — React web app (TypeScript, Vite, Redux Toolkit)
- `mobile/` — React Native app (TypeScript, Expo SDK 54)

Wiki: https://github.com/bounswe/bounswe2026group10/wiki

---

## Tech Stack

- **TypeScript everywhere** — shared types across all layers
- **Backend:** Node.js + Express 5, Supabase (PostgreSQL, Auth, Storage, Edge Functions), Zod validation
- **Frontend:** React + Tailwind CSS, Vite, Redux Toolkit, Vercel deployment
- **Mobile:** React Native + Expo SDK 54 + NativeWind (Tailwind for RN)

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
- **Routes:** `/auth`, `/recipes`, `/media`, `/dish-genres`, `/dish-varieties`, `/discovery`, `/dietary-tags`; also `GET /meta/regions`
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
See `mobile/CLAUDE.md` for detailed screen inventory, domain glossary, and scenario mapping.

---

## Domain Model

### Glossary
- **Dish Genre** — broad food category (e.g. Pastries, Stews, Soups)
- **Dish Variety** — specific dish within a genre (e.g. Börek, Baklava) — `genreId` FK
- **Recipe** — user-created content referencing a Dish Variety; type is `'cultural'` or `'community'`

Dish hierarchy: **DishGenre** → **DishVariety** → **Recipe**. Each recipe has RecipeIngredient, Step, Tool, Story, Video (with Annotations), and Media components.

### User Roles
| Role | Can do |
|------|--------|
| `learner` | Browse, discover, rate recipes |
| `cook` | + Create **community** recipes, upload media |
| `expert` | + Create **cultural** recipes (requires cultural story) |

Role is set at registration and stored in `profiles.role`. The `requireRole()` middleware enforces this.

**Role inheritance:** Learner → Cook → Expert (each level includes previous permissions).

---

## API Standards

### Response Envelope
All backend endpoints return:
```json
{ "success": true,  "data": <T>,   "error": null }
{ "success": false, "data": null,  "error": { "code": "ERROR_CODE", "message": "..." } }
```

### API Shape (Frontend Normalization)
Backend uses `snake_case`; frontend normalizes to `camelCase` in service modules:
- `image_url` → `imageUrl`, `average_rating` → `averageRating`, `created_at` → `createdAt`
- `dish_variety.dish_genre` nests the genre on variety objects
- `profile.username` / `profile.role` on recipe objects

---

## Git Conventions

**Branches:** `<area>/<type>_<short-description>` (e.g., `frontend/feature_user-auth`, `backend/fix_payment-crash`). `docs` branches skip the area prefix. Always branch off `main`, delete after merge.

**Commits:** Conventional Commits — `<type>(<scope>): <message> (#issue)`. 
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`
- Scope by area: `feat(auth):`, `feat(frontend/search):`, `feat(backend/discovery):`
- Imperative mood, under 72 chars, always link an issue

**PRs:** `[Area/Type] Description` (e.g., `[Frontend/Feature] Add auth flow`). Squash on merge, 1+ reviewer required. Use the PR template (What/How to test/Related issue).

**Issues:** `[AREA/TYPE] Description` in uppercase. Areas: FRONTEND, BACKEND, DOCS, DESIGN. Types: FEATURE, FIX, REFACTOR, TASK.

---

## Frontend PR Checklist

- No API calls in components directly (go through store/services)
- All user-visible strings in `locales/{en,tr}/common.json`
- Styles use CSS design tokens
- `npm run build` passes
- Follow data flow: pages → store/slices → services → HTTP client

---

## Custom Agents

- **architect** — Project decision-making, requirement→implementation mapping, dependency analysis. Read-only, Opus model.
- **frontend-mobile** — React Native screen/component development. Can delegate to architect.
- **mobile-api-requirements** — Generate backend API requirements from completed mobile screens. For mobile team to hand off to backend.

---

## Documentation

- **Design docs:** `docs/design/{web,mobile}/` — Figma extracts and guidelines
- **Backend detailed docs:** `backend/CLAUDE.md` — full DB schema, all endpoint signatures, error codes, testing patterns
- **Mobile detailed docs:** `mobile/CLAUDE.md` — screen inventory, domain glossary, scenario mapping
