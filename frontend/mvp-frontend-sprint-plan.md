# Frontend MVP Sprint Plan
> **Project:** Roots & Recipes — Cross-Generational Recipe Platform  
> **MVP Deadline:** April 7, 2026  
> **Responsible (Frontend):** Ökkeş Berkay Acer, Yüksel Ege Boyacı, Hikmet Can Köseoğlu, Yunus Yücesoy  
> **References:** [Implementation Plan (MVP + Final)](https://github.com/bounswe/bounswe2026group10/wiki/Implementation-Plan-%28MVP---Final-Milestone%29) · [Requirements](https://github.com/bounswe/bounswe2026group10/wiki/Requirements) · [Development Guideline](https://github.com/bounswe/bounswe2026group10/wiki/Development-Guideline) · [Open Issues](https://github.com/bounswe/bounswe2026group10/issues)

This document tracks [Frontend tasks](https://github.com/bounswe/bounswe2026group10/wiki/Implementation-Plan-%28MVP---Final-Milestone%29#frontend) for **Milestone 1 (MVP)** from the Wiki. Status legend: **✅** done, **🟡** partial, **⬜** not started.

---

## Wiki MVP — Frontend summary (aligned with Implementation Plan)

| Wiki item (MVP) | Status |
|-------------------|--------|
| Responsive basic UI shell (`MainLayout`, bottom navigation) | ✅ |
| Registration and login pages | ✅ |
| Forms wired to backend authentication | ✅ |
| Recipe listing (`/home`, `/search`, **`/discovery`**, dish variety `/dish-variety/:id`) | ✅ (Ana keşif akışı: alt nav → **`/discovery`**; bölge, alerjen, diyet etiketi, tür; sayfalama + istemci tarafı başlık araması) |
| Recipe detail — ingredients, tools, steps, (optional) video and story | ✅ 🟡 (video URL + `recipe.media` galerisi; yorumlar için yalnızca placeholder) |
| Recipe detail — comments | ⬜ (Wiki MVP’de planlı; backend’de yorum REST rotası yok) |
| Recipe detail — rating component (submit) | ✅ (`rating-service`, `RecipeRating`, `POST/GET/DELETE .../ratings`, own-recipe guard, `ConfirmModal`, EN/TR i18n) |
| Recipe creation form | 🟡 (`IngredientPicker` + `GET /ingredients`, `POST /recipes`, oluşturma sonrası **`/media/upload`** + `POST /recipes/:id/media`; **`tagIds` oluşturma payload’ında henüz yok**) |
| Draft save (server-side draft + publish) | 🟡 (`isPublished` tek `POST /recipes` ile; **`PATCH /recipes/:id`** ve **`POST .../publish` kullanılmıyor**) |
| Accessibility — large text, contrast, keyboard | 🟡 (tam denetim / kullanılabilirlik testi bekliyor; **S3-6**) |
| Usability testing with representative users | ⬜ |

---

## Backend — endpoint inventory vs frontend usage

Source: `backend/src/index.ts` and `backend/src/routes/*.ts` (Express). **Yorumlar:** REST ile yorum uç noktası yok (şema yorumları `types` içinde geleceğe dönük). **Ek:** `POST /parse` (serbest metin tarifi ayrıştırma) backend’de var; MVP frontend kapsamında değil.

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
| `PATCH` | `/recipes/:id` | No | Taslak güncelleme (UI yok) |
| `POST` | `/recipes/:id/publish` | No | Sunucu doğrulamalı yayın (UI yok) |
| `POST` | `/recipes/:id/ratings` | Yes | `ratingService.submitRating` |
| `GET` | `/recipes/:id/ratings/me` | Yes | `ratingService.getMyRating` |
| `DELETE` | `/recipes/:id/ratings/me` | Yes | `ratingService.deleteMyRating` |
| `POST` | `/recipes/:id/media` | Yes | `mediaService.attachRecipeMedia` (`CreateRecipePage` oluşturma sonrası) |
| `GET` | `/recipes/:id/media` | — | Detay `GET /recipes/:id` içinde `media` |
| `DELETE` | `/recipes/:id/media/:mediaId` | No | `mediaService.deleteRecipeMedia` tanımlı, UI yok |

### `/media`

| Method | Path | Used? |
|--------|------|-------|
| `POST` | `/media/upload` | Yes | `mediaService.uploadFile` |

### `/ingredients`

| Method | Path | Used? |
|--------|------|-------|
| `GET` | `/ingredients` | Yes | `ingredientService.search` → `IngredientPicker` |

### `/dish-genres`, `/dish-varieties`

| Method | Path | Used? | Notes |
|--------|------|-------|-------|
| `GET` | `/dish-genres` | Yes | |
| `GET` | `/dish-varieties` | Yes | Optional `?genreId=`; `?search=` exists on backend, UI limited |
| `GET` | `/dish-varieties/:id` | Yes | Published recipes for variety included |
| `GET` | `/dish-varieties/:id/recipes` | No | `GET /dish-varieties/:id` ile örtüşüyor |

### `/discovery`

| Method | Path | Used? | Notes |
|--------|------|-------|-------|
| `GET` | `/discovery/recipes` | Yes | `DiscoveryPage`: `region`, `excludeAllergens`, `tagIds`, `genreId`, `page`, `limit` |
| `GET` | `/discovery/recipes/by-ingredients` | No | Malzeme ID’leri ile arama |

### `/dietary-tags`

| Method | Path | Used? |
|--------|------|-------|
| `GET` | `/dietary-tags` | Yes | `discoveryService.getDietaryTags` → `DiscoveryPage` filtreleri; **oluşturma formunda `tagIds` gönderimi yok** |

**Özet:** Auth, **`/discovery`**, `GET /dietary-tags`, `GET /ingredients`, tarif okuma/oluşturma, **oluşturma sonrası medya yükleme ve ekleme**, ve **puanlama** tam veya kısmen bağlı. **Kalan:** `PATCH`/`publish` akışı, `DELETE` medya, `by-ingredients` keşfi, **tarif oluştururken `tagIds`**, yorum API’si.

---

## Current State of the Project (April 2, 2026)

### Completed infrastructure
- ✅ React + Vite + TypeScript
- ✅ Redux Toolkit: `auth-slice`, `profile-slice` (login, register, logout, profile)
- ✅ `httpClient` (axios, Bearer, **401 → `POST /auth/refresh`** and retry)
- ✅ `authService` + `profileService` + `discoveryService` + `recipeService` + **`ratingService`** + **`ingredientService`** + **`mediaService`**
- ✅ `ProtectedRoute` (role: `/create-recipe` for `cook` \| `expert`)
- ✅ Routes: `/`, `/login`, `/register`, `/home`, `/search`, **`/discovery`**, `/library`, `/profile`, `/recipes/:id`, `/dish-variety/:id`, `/create-recipe`
- ✅ i18n (TR / EN), including recipe rating and remove-rating modal strings
- ✅ `WelcomePage`, `LoginPage`, `RegisterPage`
- ✅ `MainLayout` + `HeaderUser` + `useLogout` (server logout + redirect `/`)
- ✅ `BottomNav` — ikinci sekme **`/discovery`** (Keşif); `/search` hâlâ rotada (çeşit/tür araması), ana navigasyon keşfe bağlı
- ✅ `HomePage`, `SearchPage`, **`DiscoveryPage`** (`DiscoveryFilters`, sayfalama, istemci tarafı başlık araması), `DishVarietyPage`, `RecipeDetailPage` (porsiyon ölçekleme, **yıldız puanlama**, `ConfirmModal`), **`CreateRecipePage`** (çok adım, **`IngredientPicker`** + katalog `ingredientId`, oluşturma sonrası **`mediaService` ile dosya yükleme ve tarife bağlama**)
- ✅ `useAuthBootstrap` + `GET /auth/me` for session refresh and profile

### Backend overlap — short endpoint list
- **In use:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/me`, `GET /meta/regions`, `GET /discovery/recipes`, `GET /dish-genres`, `GET /dish-varieties`, `GET /dish-varieties/:id`, `GET /recipes/:id`, `POST /recipes`, **`GET /ingredients`**, **`GET /dietary-tags`**, **`POST /media/upload`**, **`POST /recipes/:id/media`**, **`POST /recipes/:id/ratings`**, **`GET /recipes/:id/ratings/me`**, **`DELETE /recipes/:id/ratings/me`**
- **Not connected yet (UI):** `PATCH /recipes/:id`, `POST /recipes/:id/publish`, `DELETE /recipes/:id/media/:mediaId`, `GET /discovery/recipes/by-ingredients`; **tarif oluştururken `tagIds` gövdesi** henüz gönderilmiyor (backend şeması destekliyor)

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

> GitHub’daki başlıklar güncellenmemiş olabilir; örn. **#170** (Keşif arama çubuğu) kodda **`DiscoveryPage`** ile karşılanıyor — issue’yu kapatmadan önce ekip içi doğrulama önerilir.

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
- [x] `discoveryService`: `GET /discovery/recipes`, `getRecipeResults`, `getDietaryTags`, `GET /dish-genres`, `GET /dish-varieties`, `GET /meta/regions`, `GET /dish-varieties/:id`
- [x] **`/discovery` rotası** — `DiscoveryPage` + `BottomNav` → Keşif
- [x] Korumalı shell altında `/home`, `/search`, **`/discovery`**
- [x] Bölge: `getRegions()` + `DiscoveryFilters` (Keşif)
- [x] Tür kartları: `getGenres()` + `GenreCard` (Keşif sayfasında ızgara)
- [x] Çeşitler: `/dish-variety/:id` (Home/Search/Keşif akışlarından)
- [x] **Alerjen filtresi:** `GET /dietary-tags` ile alerjenler + `excludeAllergens` query
- [x] **Diyet etiketleri:** `tagIds` (Keşif)
- [x] **Yemek adı araması:** başlık/bölge/yazar/tür — **istemci tarafı** `visibleRecipes` (`DiscoveryPage`)
- [ ] Filtrelerin tamamının URL ile senkronu (yalnızca `genreId` gibi kısmi kullanım)
- [x] Loading / error (kısmen)

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
- [x] Pagination: **`DiscoveryPage`** içinde `getRecipeResults` + önceki/sonraki sayfa düğmeleri
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
- [x] Dish name search (Keşif’te istemci tarafı)
- [x] Recipes list when variety is selected
- [x] Rating-based ordering where supported
- [x] Keşif sayfasında sayfalama (`page` / `limit`)
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
- [x] `IngredientPicker` + `ingredientService.search` → `GET /ingredients`; **`ingredientId`** + miktar/birim `POST /recipes` ile gönderiliyor

**Step 3 — Preparation steps:**
- [x] Numbered steps, add/remove

**Step 4 — Tools (optional):**
- [x] Tool list

**Medya (opsiyonel):**
- [x] Dosya seçimi → `POST /media/upload` → `POST /recipes/:id/media` (oluşturma başarılı olduktan sonra)

**Draft & publish:**
- [x] Draft / publish via single `POST /recipes` with `isPublished`
- [ ] Tam akış: `PATCH` taslak + `POST .../publish` (backend doğrulaması)
- [x] Validation (title, at least one step)
- [x] Success + redirect `/home`

---

### S3-5: Allergen & dietary tags (creation)
**Priority:** Medium  
**Related Issue:** [#191](https://github.com/bounswe/bounswe2026group10/issues/191)  
**Branch:** `frontend/feature_allergen-dietary-tags`

**Tasks:**
- [x] `GET /dietary-tags` — Keşif filtrelerinde kullanılıyor (`allergen` / `dietary` ayrımı)
- [ ] **`tagIds` + çoklu seçim** — `CreateRecipePage` `POST` gövdesine **eklenmedi** (backend `recipeSchema` destekliyor)
- [ ] Oluşturma formunda çoklu seçim UI + payload

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
- [ ] Cook/Expert: tam taslak + sunucu `publish` (`PATCH` + `POST .../publish`) — **yapılmadı**
- [x] Recipe detail content (except real comments)
- [x] Serving scale recalculates ingredients
- [x] **Submit / view / remove own rating** (comments still ⬜)
- [ ] Accessibility standard (S3-6)
- [ ] E2E MVP: yorumlar ⬜; **malzeme ve medya** oluşturma tarafında büyük ölçüde tamam; **oluşturma `tagIds`** ve **PATCH/publish** eksik

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

*Last updated: April 2, 2026 — `/discovery`, filtreler, `ingredient` + medya entegrasyonu ve güncel endpoint envanteri; Requirements / Implementation Plan ile hizalı kalan eksikler: yorum API’si, `tagIds` ile tarif oluşturma, `PATCH`/`publish`.*

---

## Requirements (Wiki) ile hızlı kıyas

| Requirements (özet) | Frontend durumu (MVP) |
|---------------------|------------------------|
| 1.1 Oturum / kayıt | ✅ |
| 1.2 Tarif görüntüleme (malzeme, araç, adım, video, hikâye) | ✅ 🟡 (video + medya; teknik notlar Final’de) |
| 1.3 Tarif oluşturma, taslak, medya | 🟡 (taslak tek POST; medya yüklendi) |
| 1.4 Arama / filtre (ad, malzeme, bölge, alerjen) | 🟡 (Keşif: bölge, alerjen, etiket, tür; başlık istemci; **malzeme ID ile keşif** yok) |
| 1.5 Puan / yorum | Puan ✅ · Yorum ⬜ |
| 2.1 Profil rolleri (Learner/Cook/Expert) | ✅ `ProtectedRoute` + oluşturma |
| 2.2–2.4 Normalizasyon, ikame, ses/metin ayrıştırma | Final milestone (Wiki Implementation Plan) |
