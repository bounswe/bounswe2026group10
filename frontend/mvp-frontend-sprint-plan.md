# Frontend MVP Sprint Plan
> **Project:** Roots & Recipes — Cross-Generational Recipe Platform  
> **MVP Deadline:** April 7, 2026  
> **Responsible (Frontend):** Ökkeş Berkay Acer, Yüksel Ege Boyacı, Hikmet Can Köseoğlu, Yunus Yücesoy  
> **References:** [Implementation Plan (MVP + Final)](https://github.com/bounswe/bounswe2026group10/wiki/Implementation-Plan-%28MVP---Final-Milestone%29) · [Development Guideline](https://github.com/bounswe/bounswe2026group10/wiki/Development-Guideline) · [Open Issues](https://github.com/bounswe/bounswe2026group10/issues)

This document tracks [Frontend tasks](https://github.com/bounswe/bounswe2026group10/wiki/Implementation-Plan-%28MVP---Final-Milestone%29#frontend) for **Milestone 1 (MVP)** from the Wiki. Status legend: **✅** done, **🟡** partial, **⬜** not started.

---

## Wiki MVP — Frontend summary (aligned with Implementation Plan)

| Wiki item (MVP) | Status |
|-------------------|--------|
| Responsive basic UI shell (`MainLayout`, bottom navigation) | ✅ |
| Registration and login pages | ✅ |
| Forms wired to backend authentication | ✅ |
| Recipe listing (`/home`, `/search`, dish variety `/dish-variety/:id`) | ✅ |
| Recipe detail — ingredients, tools, steps, (optional) video and story | ✅ 🟡 (video link; no comments UI beyond placeholder) |
| Recipe detail — comments | ⬜ (no comment endpoints in backend) |
| Recipe detail — rating component (submit) | ✅ (`rating-service`, `RecipeRating`, `POST/GET/DELETE .../ratings`, own-recipe guard via `creatorUsername` vs profile `username`, remove with confirm modal, EN/TR i18n) |
| Recipe creation form | 🟡 (multi-step + `POST /recipes`; real `ingredientId` / draft–publish flow still incomplete) |
| Draft save (server-side draft + publish) | 🟡 (`isPublished` in single `POST`; `PATCH` + `publish` not used) |
| Accessibility — large text, contrast, keyboard | 🟡 (full audit / usability test pending; see **S3-6**) |
| Usability testing with representative users | ⬜ |

---

## Backend — endpoint inventory vs frontend usage

Source: `backend/src/index.ts` and `backend/src/routes/*.ts` (Express). **Comments:** no REST routes defined yet; MVP “comments” feature is not in the backend.

### Root and meta

| Method | Path | Used in frontend? | Notes |
|--------|------|-------------------|-------|
| `GET` | `/health` | No | Deploy / CI health |
| `GET` | `/meta/regions` | Yes | `discoveryService.getRegions()` |

### `/auth`

| Method | Path | Used? |
|--------|------|-------|
| `POST` | `/auth/register` | Yes |
| `POST` | `/auth/login` | Yes |
| `POST` | `/auth/logout` | Yes (`authService`, `logoutAsync`) |
| `POST` | `/auth/refresh` | Yes (`refresh-session.ts`, `httpClient` 401 refresh) |
| `GET` | `/auth/me` | Yes (`profile-service`, bootstrap) |

### `/recipes`

| Method | Path | Used? | Notes |
|--------|------|-------|-------|
| `GET` | `/recipes/:id` | Yes | `recipeService.getById` |
| `POST` | `/recipes` | Yes | `recipeService.create` |
| `PATCH` | `/recipes/:id` | No | Draft updates |
| `POST` | `/recipes/:id/publish` | No | Publish with validation |
| `POST` | `/recipes/:id/ratings` | Yes | `ratingService.submitRating` |
| `GET` | `/recipes/:id/ratings/me` | Yes | `ratingService.getMyRating` |
| `DELETE` | `/recipes/:id/ratings/me` | Yes | `ratingService.deleteMyRating` |
| `POST` | `/recipes/:id/media` | No | Attach URL |
| `GET` | `/recipes/:id/media` | No | Detail payload from `GET /recipes/:id` |
| `DELETE` | `/recipes/:id/media/:mediaId` | No | |

### `/media`

| Method | Path | Used? |
|--------|------|-------|
| `POST` | `/media/upload` | No |

### `/dish-genres`, `/dish-varieties`

| Method | Path | Used? | Notes |
|--------|------|-------|-------|
| `GET` | `/dish-genres` | Yes | |
| `GET` | `/dish-varieties` | Yes | Optional `?genreId=`; `?search=` exists on backend, UI limited |
| `GET` | `/dish-varieties/:id` | Yes | Published recipes for variety included |
| `GET` | `/dish-varieties/:id/recipes` | No | Community/expert split; overlaps with `GET :id` |

### `/discovery`

| Method | Path | Used? | Notes |
|--------|------|-------|-------|
| `GET` | `/discovery/recipes` | Yes | `excludeAllergens`, `tagIds` on backend; `DiscoveryParams` still limited in UI |
| `GET` | `/discovery/recipes/by-ingredients` | No | Search by ingredient IDs |

### `/dietary-tags`

| Method | Path | Used? |
|--------|------|-------|
| `GET` | `/dietary-tags` | No | Not sent as `tagIds` in create flow yet |

**Summary:** Auth, discovery listing, genre/variety APIs, recipe read/create, and **recipe ratings (submit / my rating / delete)** are wired. Media upload/attach, recipe update/publish flow, dietary tags, ingredient-based discovery, and some `dish-varieties` sub-routes are **not** in the frontend yet (partly Final milestone or later sprint).

---

## Current State of the Project (April 1, 2026)

### Completed infrastructure
- ✅ React + Vite + TypeScript
- ✅ Redux Toolkit: `auth-slice`, `profile-slice` (login, register, logout, profile)
- ✅ `httpClient` (axios, Bearer, **401 → `POST /auth/refresh`** and retry)
- ✅ `authService` + `profileService` + `discoveryService` + `recipeService` + **`ratingService`**
- ✅ `ProtectedRoute` (role: `/create-recipe` for `cook` \| `expert`)
- ✅ Routes: `/`, `/login`, `/register`, `/home`, `/search`, `/library`, `/profile`, `/recipes/:id`, `/dish-variety/:id`, `/create-recipe`
- ✅ i18n (TR / EN), including recipe rating and remove-rating modal strings
- ✅ `WelcomePage`, `LoginPage`, `RegisterPage`
- ✅ `MainLayout` + `HeaderUser` + `useLogout` (server logout + redirect `/`)
- ✅ `BottomNav` (role-based “create recipe”)
- ✅ `HomePage`, `SearchPage`, `DishVarietyPage`, `RecipeDetailPage` (serving scale, **interactive stars**, average/count, login / own-recipe / rate / remove with **`ConfirmModal`**), `CreateRecipePage` (multi-step; ingredients not fully wired to backend IDs)
- ✅ `useAuthBootstrap` + `GET /auth/me` for session refresh and profile

### Backend overlap — short endpoint list
- **In use:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/me`, `GET /meta/regions`, `GET /discovery/recipes`, `GET /dish-genres`, `GET /dish-varieties`, `GET /dish-varieties/:id`, `GET /recipes/:id`, `POST /recipes`, **`POST /recipes/:id/ratings`**, **`GET /recipes/:id/ratings/me`**, **`DELETE /recipes/:id/ratings/me`**
- **Not connected yet:** e.g. `PATCH /recipes/:id`, `POST /recipes/:id/publish`, `/media/upload`, `GET /dietary-tags`, `GET /discovery/recipes/by-ingredients`

### Currently open frontend issues (MVP scope)
| # | Title |
|---|-------|
| #223 | [FRONTEND/Task] Integrate server-side logout and clear client session |
| #194 | [FRONTEND/TASK] Language Switcher and Translated Recipe Display |
| #191 | [FRONTEND/TASK] Dietary and Allergen Tag Selection in Recipe Creation Form |
| #188 | [FRONTEND/TASK] Display Converted Units in Recipe Creation Review |
| #170 | [FRONTEND/TASK] Dish Name Search Bar on Discovery Page |
| #167 | [FRONTEND/TASK] Ingredient Substitution UI on Recipe Detail Page |
| #164 | [FRONTEND/TASK] Serving Size Control on Recipe Detail Page |
| #161 | [FRONTEND/TASK] Recipe Detail Page with Video Guide and Story |
| #158 | [FRONTEND/TASK] Recipe Listing Page for a Dish Variety |
| #114 | [TASK] Recipe Detail Page — Ingredients, Steps, Video Guide & Story |
| #115 | [TASK] Serving Size Adjustment with Dynamic Ingredient Recalculation |
| #116 | [TASK] Ingredient Substitution: View Suggestions and Apply Substitute |
| #113 | [TASK] Community/Expert Recipe Listing with Rating-Based Sorting |
| #112 | [TASK] Recipe Discovery: Region Selector, Allergen Filter, Dish Genre/Variety Navigation |
| #111 | [TASK] User Registration, Login, and Role-Based Access Control |

---

## Sprint schedule

| Sprint | Dates | Focus |
|--------|-------|-------|
| Sprint 1 | Mar 29 – Apr 1 | Auth completion + core infrastructure |
| Sprint 2 | Apr 1 – Apr 4 | Discovery page + recipe listing |
| Sprint 3 | Apr 4 – Apr 7 | Recipe detail + creation form + MVP polish |

---

## Sprint 1 — Auth completion & core infrastructure
**Dates:** March 29 – April 1, 2026

### Goal
End-to-end user management: registration, login, session persistence, logout, profile display.

---

### S1-1: Server-side logout integration
**Priority:** Critical  
**Related Issue:** [#223](https://github.com/bounswe/bounswe2026group10/issues/223)  
**Branch:** `frontend/feature_server-side-logout`

**Tasks:**
- [x] Verify `logoutAsync` calls `POST /auth/logout`
- [x] Wire logout in `MainLayout` via `useLogout`
- [x] Clear Redux and `localStorage` (`session.clearTokens()`) after logout
- [x] Redirect to `/` (`WelcomePage`) after successful logout
- [x] Clear client session even if network fails
- [x] Disable control while `isLoggingOut`

---

### S1-2: User profile via `GET /auth/me`
**Priority:** High  
**Related Issue:** [#111](https://github.com/bounswe/bounswe2026group10/issues/111)  
**Branch:** `frontend/feature_user-profile-display`

**Tasks:**
- [x] `profileService.ts` — `GET /auth/me`
- [x] `profile-slice.ts` — `userId`, `username`, `email`, `role`
- [x] On startup (`useAuthBootstrap`), if session exists load profile into Redux
- [x] Show username + role in `MainLayout` (`HeaderUser`)
- [x] Use role in `ProtectedRoute` (`/create-recipe` → cook \| expert)

#### S1-2 — Components, modules & file plan (reference)

##### 1. API & types
| Artifact | Path (suggested) | Responsibility |
|----------|------------------|----------------|
| Types | `src/services/types/auth.ts` or `profile-service.ts` | `MeResponse`, `UserRole` aligned with backend |
| Profile service | `src/services/profile-service.ts` | `getCurrentUser()` → unwrap `success` envelope |

##### 2. Redux
| Artifact | Path | Responsibility |
|----------|------|----------------|
| Slice | `src/store/slices/profile-slice.ts` | Profile state + async load |

##### 3. Bootstrap
| Artifact | Path | Responsibility |
|----------|------|----------------|
| Hook | `src/hooks/useAuthBootstrap.ts` | Dispatch profile fetch when token exists |

##### 4. UI
| Component | Path | Responsibility |
|-----------|------|----------------|
| `HeaderUser` | `src/components/Layout/HeaderUser.tsx` | Username, role, loading |
| `MainLayout` | `src/components/Layout/MainLayout.tsx` | Compose header + logout |

##### Summary checklist
- [x] `profile-service.ts`, `profile-slice.ts`, `useAuthBootstrap.ts`, `HeaderUser.tsx`
- [x] `store.ts`, `App` / `main`, `MainLayout`, `auth-slice` profile clear on logout

---

### S1-3: Token refresh integration
**Priority:** High  
**Related Issue:** [#111](https://github.com/bounswe/bounswe2026group10/issues/111)  
**Branch:** `frontend/feature_token-refresh`

**Tasks:**
- [x] 401 interceptor on `httpClient`
- [x] On 401, `POST /auth/refresh` (`refreshSession`) and retry
- [x] If refresh fails, sign out and redirect to `/login`
- [x] Serialize concurrent refresh (`refreshPromise` / `ensureRefresh`)

---

### S1-4: Role-based UI
**Priority:** Medium  
**Related Issue:** [#111](https://github.com/bounswe/bounswe2026group10/issues/111)  
**Branch:** `frontend/feature_role-based-ui`

**Tasks:**
- [x] `useUserRole()` — role from Redux
- [x] Navigation varies by role (`BottomNav`: create for cook/expert only)
- [x] `ProtectedRoute` for `/create-recipe`

---

### S1-5: MainLayout navigation
**Priority:** High  
**Branch:** `frontend/feature_main-navigation`

**Tasks:**
- [x] Header: brand + `HeaderUser` + logout
- [x] Bottom nav: home, search, (role) create, library, profile
- [x] Profile link `/profile`
- [x] Mobile-first bottom navigation
- [x] Sprint 1 scope for navigation is complete. **App-wide accessibility (ARIA, keyboard, full audit)** is **not** a Sprint 1 deliverable; see **S3-6** (moved from earlier S1-5 wording).

---

### Sprint 1 acceptance criteria
- [x] Register and auto-login works
- [x] Login; token in `localStorage`
- [x] Session survives refresh
- [x] Token refresh on 401
- [x] Logout invalidates server session
- [x] Username and role in header
- [x] Role-based nav (bottom nav + create)

**Sprint 1 summary:** No blocking open items for auth/nav; full accessibility audit is **S3-6**.

---

## Sprint 2 — Discovery page & recipe listing
**Dates:** April 1 – April 4, 2026

### Goal
Screens to explore genres/regions and list recipes.

---

### S2-1: Discovery — region, genre & filters
**Priority:** Critical  
**Related Issues:** [#112](https://github.com/bounswe/bounswe2026group10/issues/112), [#170](https://github.com/bounswe/bounswe2026group10/issues/170)  
**Branch:** `frontend/feature_discovery-page`

**Tasks:**
- [x] `discoveryService`: `GET /discovery/recipes`, `GET /dish-genres`, `GET /dish-varieties`, `GET /meta/regions`, `GET /dish-varieties/:id`
- [x] Separate `/discovery` route — **not required for MVP**; flow is `/home` + `/search` + `/dish-variety/:id`
- [x] Discovery under protected shell (`/home`, `/search`)
- [x] Region: `getRegions()` + filter (Home / Search)
- [x] Genre cards: `getGenres()` + UI
- [x] Varieties: `getVarieties({ genreId })` + `/dish-variety/:id`
- [ ] **Allergen filter:** backend supports `excludeAllergens`; UI may still need full selection / list source
- [ ] **Dish name search:** [#170] — client filter or backend `search` query TBD
- [ ] Sync filter state to URL query params
- [x] Loading / error (partial)

---

### S2-2: Recipe listing page
**Priority:** Critical  
**Related Issues:** [#158](https://github.com/bounswe/bounswe2026group10/issues/158), [#113](https://github.com/bounswe/bounswe2026group10/issues/113)  
**Branch:** `frontend/feature_recipe-listing`

**Tasks:**
- [x] Variety-based list: `/dish-variety/:id` (`DishVarietyPage`)
- [x] `RecipeCard` / list rows
- [x] Title, variety, rating, date, author, type — as applicable
- [x] Sorting: by rating where backend provides it
- [ ] Pagination: `GET /discovery/recipes` pagination may not be fully used in the service
- [x] Empty states (partial)
- [x] Navigation from discovery to variety

---

### S2-3: Shared service layer
**Priority:** High  
**Branch:** `frontend/feature_recipe-services`

**Tasks:**
- [x] `discovery-service.ts` + `recipe-service.ts`
- [ ] Optional `useDiscovery` refactor (pages use local state today)
- [ ] Global error boundary

---

### Sprint 2 acceptance criteria
- [x] Discovery: region + genre + variety flow works
- [ ] Dish name search (strategy TBD)
- [x] Recipes list when variety is selected
- [x] Rating-based ordering where supported
- [ ] Full pagination
- [x] Loading / error (partial)

---

## Sprint 3 — Recipe detail + recipe creation + MVP polish
**Dates:** April 4 – April 7, 2026

### Goal
Recipe detail (ingredients, steps, video, story, **rating**), creation form, MVP readiness. **Comments** remain blocked without backend.

---

### S3-1: Recipe detail page
**Priority:** Critical  
**Related Issues:** [#161](https://github.com/bounswe/bounswe2026group10/issues/161), [#114](https://github.com/bounswe/bounswe2026group10/issues/114)  
**Branch:** `frontend/feature_recipe-detail`

**Tasks:**
- [x] `/recipes/:id` under `MainLayout`
- [x] `recipeService.getById` — `GET /recipes/:id`
- [x] **`RecipeDetailPage`:** title, variety/genre, story, video link, ingredients, steps, tools, **average rating & count**, **interactive rating (logged-in, not own recipe)**, author
- [ ] **Comments** — placeholder only; no API
- [x] Navigation from lists to detail

---

### S3-2: Serving size control
**Priority:** High  
**Related Issues:** [#164](https://github.com/bounswe/bounswe2026group10/issues/164), [#115](https://github.com/bounswe/bounswe2026group10/issues/115)  
**Branch:** `frontend/feature_serving-size-control`

**Tasks:**
- [x] Serving stepper (`RecipeDetailPage`)
- [x] Proportional ingredient amounts vs reference `servingSize`
- [ ] Optional: two-tone typography for original vs scaled amounts

---

### S3-3: Rating and comment components
**Priority:** High  
**Branch:** `frontend/feature_rating-comment` (rating); comments pending backend

**Tasks:**
- [x] `rating-service.ts` — `POST /recipes/:id/ratings`, `GET /recipes/:id/ratings/me`, `DELETE /recipes/:id/ratings/me`
- [ ] `commentService` — no backend route yet
- [x] **`RecipeRating`** — stars, hover/focus, `busy`; **`RecipeDetailPage`** loads `getMyRating`, submits `submitRating`, refetches recipe; **own recipe** hidden via `creatorUsername === profile.username` (no `profileId` on `GET /auth/me`)
- [x] **Remove rating** — `deleteMyRating` + **`ConfirmModal`** (stable loading button width, no dismiss while busy)
- [x] Logged-out: copy + link to `/login`
- [ ] **Comment UI** — after API exists

---

### S3-4: Recipe creation form
**Priority:** Critical  
**Branch:** `frontend/feature_recipe-creation-form`

**Tasks:**
- [x] `/create-recipe` (`ProtectedRoute` cook \| expert)
- [x] `CreateRecipePage` — multi-step form

**Step 1 — Basic information:**
- [x] Title, type (cultural for expert), variety, servings, story, video URL

**Step 2 — Ingredients:**
- [ ] Rows exist; backend needs **`ingredientId`** — no `GET /ingredients` in use; not sent

**Step 3 — Preparation steps:**
- [x] Numbered steps, add/remove

**Step 4 — Tools (optional):**
- [x] Tool list

**Draft & publish:**
- [x] Draft / publish via single `POST /recipes` with `isPublished`
- [ ] Full MVP flow: `PATCH` draft + `POST .../publish` (when ingredients are persisted)
- [x] Validation (title, at least one step)
- [x] Success + redirect `/home`

---

### S3-5: Allergen & dietary tags (creation)
**Priority:** Medium  
**Related Issue:** [#191](https://github.com/bounswe/bounswe2026group10/issues/191)  
**Branch:** `frontend/feature_allergen-dietary-tags`

**Tasks:**
- [ ] `tagIds` + `GET /dietary-tags`
- [ ] Allergen list (clarify if no `GET /allergens`)
- [ ] Multi-select UI
- [ ] Send in payload

---

### S3-6: Accessibility improvements
**Priority:** Medium  
**Branch:** `frontend/feature_accessibility`

**Tasks:**
- [ ] **Scope moved from S1-5:** `MainLayout` header and `BottomNav` plus **all pages** — ARIA, tab order, keyboard use; forms and primary actions (first-pass audit)
- [ ] Minimum ~16px body text where applicable
- [ ] Contrast review
- [ ] Screen-reader-friendly error messages
- [ ] Visible focus styles

---

### S3-7: MVP final polish & testing
**Priority:** High  
**Branch:** `frontend/fix_mvp-polish`

**Tasks:**
- [ ] Consistent loading/error across pages
- [ ] Improve `RouteError`
- [ ] Tablet / desktop layouts
- [ ] Meaningful empty states
- [ ] Form scenarios
- [ ] Role combinations
- [ ] Token refresh E2E smoke
- [ ] `VITE_API_BASE_URL` for deploy

---

### Sprint 3 acceptance criteria
- [ ] Cook/Expert: full draft + server publish (`PATCH` + `publish` + ingredients) — **not done**
- [x] Recipe detail content (except real comments)
- [x] Serving scale recalculates ingredients
- [x] **Submit / view / remove own rating** (comments still ⬜)
- [ ] Accessibility standard (S3-6)
- [ ] End-to-end MVP including comments / ingredient search — **partial** (rating done; comments & some discovery/create gaps remain)

---

## Summary of issues to open (or refine)

Many items below are already implemented or tracked; this table is historical. **Rating on detail** is implemented (`rating-service`, `RecipeRating`, `RecipeDetailPage`, `ConfirmModal`).

### Sprint 1
| Issue title | Suggested branch | Priority |
|-------------|------------------|----------|
| Profile on load | `frontend/feature_user-profile-display` | High |
| 401 refresh interceptor | `frontend/feature_token-refresh` | High |
| Main navigation | `frontend/feature_main-navigation` | High |

### Sprint 2
| Issue title | Suggested branch | Priority |
|-------------|------------------|----------|
| Discovery + recipe services | `frontend/feature_recipe-services` | High |
| Discovery filters (full) | `frontend/feature_discovery-page` | Critical |

### Sprint 3
| Issue title | Suggested branch | Priority |
|-------------|------------------|----------|
| Recipe detail layout | `frontend/feature_recipe-detail` | Critical |
| ~~Rating on recipe detail~~ | — | **Done (current codebase)** |
| Comment section | `frontend/feature_rating-comment` | High (blocked by backend) |
| Multi-step create + draft/publish | `frontend/feature_recipe-creation-form` | Critical |
| Accessibility audit | `frontend/feature_accessibility` | Medium |

---

## Suggested task assignment

| Developer | Sprint 1 | Sprint 2 | Sprint 3 |
|-----------|----------|----------|----------|
| **Yunus Yücesoy** | S1-1 (Logout), S1-3 (Token refresh) | S2-3 (Service layer) | S3-7 (Polish & deploy) |
| **Yüksel Ege Boyacı** | S1-2 (Profile), S1-4 (Role UI) | S2-1 (Discovery filters) | S3-4 (Recipe creation form) |
| **Hikmet Can Köseoğlu** | S1-5 (Nav bar) | S2-2 (Recipe listing) | S3-1 (Recipe detail) |
| **Ökkeş Berkay Acer** | S1-4 (Role UI support) | S2-1 (Allergen, search) | S3-3 (Comments + accessibility), S3-6 (Accessibility) |

> Note: S3-2 (Serving size) and S3-5 (Allergen tags) are secondary after core flows. **S3-3 rating** is largely implemented; **comments** remain with Ökkeş / team when API exists.

---

## Git convention reminders

```
# Branch format
frontend/feature_recipe-detail
frontend/fix_logout-redirect

# Commit format
feat(recipe): add recipe detail page with ingredients and steps (#161)
fix(auth): redirect to login after token refresh failure (#223)
feat(discovery): add region and allergen filters to discovery page (#112)
```

---

## Dependency map

```
Sprint 1 (Auth infrastructure)
    └── Sprint 2 (Discovery & Listing — requires auth)
            └── Sprint 3 (Detail & Creation — discovery and listing should be usable)
                    ├── S3-1 Recipe Detail (from listing cards)
                    ├── S3-3 Rating (done) / Comment (needs API)
                    └── S3-4 Recipe Creation (requires S1-4 role control)
```

---

*Last updated: April 1, 2026 — full English pass; rating integration and endpoint inventory aligned with current frontend.*
