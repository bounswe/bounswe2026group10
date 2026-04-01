# Frontend MVP Sprint Plan
> **Project:** Roots & Recipes — Cross-Generational Recipe Platform  
> **MVP Deadline:** April 7, 2026  
> **Responsible (Frontend):** Ökkeş Berkay Acer, Yüksel Ege Boyacı, Hikmet Can Köseoğlu, Yunus Yücesoy  
> **References:** [Implementation Plan](https://github.com/bounswe/bounswe2026group10/wiki/Implementation-Plan-%28MVP---Final-Milestone%29) · [Development Guideline](https://github.com/bounswe/bounswe2026group10/wiki/Development-Guideline) · [Open Issues](https://github.com/bounswe/bounswe2026group10/issues)

---

## Current State of the Project (March 29, 2026)

### Completed Infrastructure
- React + Vite + TypeScript setup done
- Redux Toolkit `auth-slice` (login, register, logout) ready
- `httpClient` (axios + Bearer token interceptor) ready
- `authService` (login, register, logout endpoint bindings) ready
- `ProtectedRoute` component ready
- React Router configured; `/`, `/login`, `/register`, `/home` routes defined
- i18n infrastructure (Turkish + English) set up
- `WelcomePage`, `LoginPage`, `RegisterPage` pages completed
- `MainLayout` basic skeleton ready
- `HomePage` exists at skeleton level (title only; logout lives in `MainLayout` header via `useLogout`)

### Existing Backend Endpoints
- `POST /auth/register` — User registration
- `POST /auth/login` — Login
- `POST /auth/logout` — Logout (requires Bearer token)
- `POST /auth/refresh` — Token refresh
- `GET /auth/me` — Current user info
- `POST /recipes` — Create recipe (cook/expert)
- `PATCH /recipes/:id` — Update recipe (draft)
- `POST /recipes/:id/publish` — Publish recipe
- `GET /discovery/recipes` — List published recipes (region, allergen, genre, variety filters)
- `GET /dish-genres` — List dish genres
- `GET /dish-varieties` — List dish varieties

### Currently Open Frontend Issues (MVP Scope)
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

## Sprint Schedule

| Sprint | Dates | Focus |
|--------|-------|-------|
| Sprint 1 | Mar 29 – Apr 1 | Auth completion + Core infrastructure fixes |
| Sprint 2 | Apr 1 – Apr 4 | Discovery page + Recipe Listing |
| Sprint 3 | Apr 4 – Apr 7 | Recipe Detail + Recipe creation form + MVP polish |

---

## Sprint 1 — Auth Completion & Core Infrastructure
**Dates:** March 29 – April 1, 2026

### Goal
Complete the user management flow end-to-end: registration, login, session persistence, logout, and profile info display.

---

### S1-1: Server-Side Logout Integration
**Priority:** Critical  
**Related Issue:** [#223 — FRONTEND/Task: Integrate server-side logout and clear client session](https://github.com/bounswe/bounswe2026group10/issues/223)  
**Branch:** `frontend/feature_server-side-logout`

**Tasks:**
- [ ] Verify `logoutAsync` thunk calls `POST /auth/logout` endpoint ✅ (present in auth-slice, but not fully wired to UI)
- [ ] Wire the logout button in `MainLayout` or `HomePage` to `logoutAsync`
- [ ] Clear Redux state and localStorage (`session.clearTokens()`) after logout
- [ ] Redirect to `/` (WelcomePage) after successful logout
- [ ] Ensure local session is cleared even if network call fails (current code is correct — verify)
- [ ] Disable button during loading state

**New Issues to Open:**
- `[FRONTEND/TASK] Logout button state management and redirect` (if not already covered by #223)

---

### S1-2: User Profile Display via `GET /auth/me`
**Priority:** High  
**Related Issue:** [#111 — User Registration, Login, and Role-Based Access Control](https://github.com/bounswe/bounswe2026group10/issues/111)  
**Branch:** `frontend/feature_user-profile-display`

**Tasks:**
- [ ] Create `profileService.ts` — wraps `GET /auth/me` call
- [ ] Create `profile-slice.ts` — stores `userId`, `username`, `email`, `role`
- [ ] On app startup (App.tsx or AuthGuard), if session exists call `GET /auth/me` and load profile into Redux
- [ ] Display username + role in `MainLayout` header
- [ ] Retrieve role from Redux and use it in `ProtectedRoute`s (per learner/cook/expert)

**New Issues to Open:**
- `[FRONTEND/TASK] Fetch and display authenticated user profile on app load`

#### S1-2 — Required components, modules & file plan

This section lists **what to build** for S1-2: services, state, bootstrap, and UI pieces. Names are suggestions; keep consistency with existing `src/` layout (`services/`, `store/slices/`, `components/`, `hooks/`).

##### 1. API & types

| Artifact | Path (suggested) | Responsibility |
|----------|-------------------|----------------|
| **Types** | `src/services/types/auth.ts` or inline in `profile-service.ts` | `MeResponse`, `UserRole` (`learner` \| `cook` \| `expert`) aligned with backend `GET /auth/me` payload (`userId`, `email`, `username`, `role`, `createdAt`). |
| **Profile service** | `src/services/profile-service.ts` | `getCurrentUser()` → `httpClient.get('/auth/me')`, unwrap `success` envelope (`data`), return typed user object. |

No new React “component” here — pure TS module used by Redux thunks.

##### 2. Redux state

| Artifact | Path (suggested) | Responsibility |
|----------|-------------------|----------------|
| **Option A — dedicated slice** | `src/store/slices/profile-slice.ts` | State: `username`, `email`, `role`, `userId`, `status` (`idle` \| `loading` \| `succeeded` \| `failed`), `error`. Reducers + `fetchProfileAsync` (or `loadCurrentUserAsync`) thunk calling `profileService.getCurrentUser()`. |
| **Option B — extend auth slice** | `src/store/slices/auth-slice.ts` | Same fields + thunk co-located with `loginAsync` / `logoutAsync`. Fewer stores; slightly larger file. **Pick one approach for the team; do not duplicate user fields in two slices.** |

**Exports:** Selectors (e.g. `selectCurrentUser`, `selectUserRole`, `selectProfileStatus`) either in the slice file or `store/selectors/auth.ts` / `profile.ts`.

##### 3. Store registration

| Artifact | Path | Responsibility |
|----------|------|----------------|
| **Root reducer** | `src/store/store.ts` | If Option A: register `profileReducer`. If Option B: no new reducer key. |

##### 4. Bootstrap (when to call `GET /auth/me`)

| Artifact | Path (suggested) | Responsibility |
|----------|------------------|----------------|
| **Hook** | `src/hooks/useAuthBootstrap.ts` | On mount: if `session.getTokens().accessToken` exists, `dispatch(fetchProfileAsync())`. Optionally skip if profile already `succeeded` for this session. Returns `{ profileStatus }` for optional global loading UI. |
| **Wrapper component** | `src/auth/AuthBootstrap.tsx` (optional alternative to hook-only) | Renders `children`; runs the same dispatch in `useEffect`. Use if you prefer composition over calling the hook from `App.tsx`. |
| **App entry** | `src/App.tsx` or `src/main.tsx` | Either render `<AuthBootstrap><RouterProvider /></AuthBootstrap>` or call `useAuthBootstrap()` inside a small inner component under `Provider` + `RouterProvider`. **Requirement:** bootstrap must run **inside** Redux `Provider` and **after** router exists if redirects depend on location. |

**Flow:** Token in storage → fetch profile → fill Redux → `MainLayout` can read `username` / `role`. No token → no `GET /auth/me` (guest or logged-out).

##### 5. UI components (header & display)

| Component | Path (suggested) | Responsibility |
|-----------|------------------|----------------|
| **`UserBadge` or `HeaderUser`** | `src/components/Layout/HeaderUser.tsx` or `src/components/User/UserBadge.tsx` | Presentational: shows **username** and optional **role** label (string or pill). Props: `username`, `role`, optional `loading`. Used inside `MainLayout` header next to logout. |
| **`MainLayout` (update)** | `src/components/Layout/MainLayout.tsx` | Compose header: left — app title; right — **`<HeaderUser />`** (only when `isAuthenticated` and profile loaded or loading) + existing **logout** button from `useLogout`. Handle **loading** state: skeleton text or spinner next to name while `profileStatus === 'loading'`. |
| **`MainLayout.css` (update)** | `src/components/Layout/MainLayout.css` | Flex row for title + `app-header__user` cluster (username, role chip, logout). Responsive: wrap or shorten username on small screens. |

**Optional (not blocking S1-2):**

| Component | Notes |
|-----------|--------|
| **`UserAvatar`** | Initials circle from `username`; add when design requires avatars. |
| **`ProfilePage` placeholder** | Route `/profile` stub — only if issue #111 explicitly requires a profile *page* in S1-2; otherwise defer to later sprint. |

##### 6. Login / register integration

| Artifact | Path | Responsibility |
|----------|------|----------------|
| **After login/register fulfilled** | `auth-slice` thunks | Option A: chain `dispatch(fetchProfileAsync())` in `loginAsync.fulfilled` / `registerAsync.fulfilled` extraReducers or thunk `.unwrap()` handlers in pages. Option B: rely on **bootstrap** only — on success, tokens exist; next navigation or full reload triggers `GET /auth/me`. **Recommended:** dispatch `fetchProfileAsync` once after login/register success so header updates immediately without full page reload. |

##### 7. Logout integration

| Artifact | Path | Responsibility |
|----------|------|----------------|
| **`logout` reducer / `logoutAsync`** | `auth-slice.ts` | Clear **profile** fields when session clears (either `profileSlice` reset action or extraReducer listening to `logout` / `logoutAsync.fulfilled`). Avoid stale username after logout. |

##### 8. Protected routes & role (S1-2 scope boundary)

| Artifact | Path | Responsibility |
|----------|------|----------------|
| **`ProtectedRoute`** | `src/auth/ProtectedRoute.tsx` | Wire into `router/index.tsx` for routes that require auth (minimal for S1-2: optional — can stay “prep only”). |
| **Role-aware guard** | Same file or `RequireRole.tsx` | **Full role checks** (learner vs cook vs expert) are listed here for traceability but often land in **S1-4**; S1-2 should at least **expose `role` in Redux** and show it in the header. |

##### 9. Summary checklist (files)

**Create (typical set):**

- [ ] `src/services/profile-service.ts`
- [ ] `src/store/slices/profile-slice.ts` *(if Option A)* **or** extend `auth-slice.ts` *(Option B)*
- [ ] `src/hooks/useAuthBootstrap.ts`
- [ ] `src/components/Layout/HeaderUser.tsx` *(or `UserBadge.tsx`)*

**Modify:**

- [ ] `src/store/store.ts` — register reducer if new slice
- [ ] `src/App.tsx` and/or `src/main.tsx` — bootstrap
- [ ] `src/components/Layout/MainLayout.tsx` + `MainLayout.css` — user + role + loading
- [ ] `src/store/slices/auth-slice.ts` — clear profile on logout; optionally dispatch `fetchProfile` after login/register

**Dependencies:** Existing `httpClient`, `session`, i18n for any new strings (role labels if translated).

---

### S1-3: Token Refresh (Refresh Token) Integration
**Priority:** High  
**Related Issue:** [#111](https://github.com/bounswe/bounswe2026group10/issues/111)  
**Branch:** `frontend/feature_token-refresh`

**Tasks:**
- [ ] Add 401 response interceptor to `httpClient`
- [ ] On 401, call `POST /auth/refresh` to renew the token
- [ ] Retry the failed request with the new token
- [ ] If refresh also fails, sign out and redirect to `/login`
- [ ] Prevent multiple concurrent requests from triggering refresh simultaneously (mutex/queue)

**New Issues to Open:**
- `[FRONTEND/TASK] Implement 401 interceptor with automatic token refresh`

---

### S1-4: Role-Based UI Display
**Priority:** Medium  
**Related Issue:** [#111](https://github.com/bounswe/bounswe2026group10/issues/111)  
**Branch:** `frontend/feature_role-based-ui`

**Tasks:**
- [ ] Write `useUserRole()` custom hook — reads role from Redux
- [ ] Show different navigation items based on role:
  - `learner`: Discovery, Profile
  - `cook`: Discovery, Create Recipe, Profile
  - `expert`: Discovery, Create Recipe (including cultural), Profile
- [ ] "Create Recipe" button/link visible only for cook and expert
- [ ] Extend `ProtectedRoute` with role-based access control

---

### S1-5: MainLayout Navigation Bar
**Priority:** High  
**Related Issue:** New issue to open  
**Branch:** `frontend/feature_main-navigation`

**Tasks:**
- [ ] Fully build out `MainLayout` header into a proper nav bar
- [ ] Logo + app name (left)
- [ ] Main navigation links (Discovery, Create Recipe — role-dependent)
- [ ] User menu (right): username, profile link, logout button
- [ ] Responsive design (mobile-friendly hamburger menu or simplified version)
- [ ] Accessibility: keyboard navigation, ARIA labels

**New Issues to Open:**
- `[FRONTEND/FEATURE] Implement responsive main navigation bar with role-based items`

---

### Sprint 1 Acceptance Criteria
- [ ] User can register and is automatically logged in
- [ ] User can log in; token persists in localStorage
- [ ] Session does not expire on page refresh
- [ ] Token auto-renews when expired
- [ ] User can log out; server session is also invalidated
- [ ] Username and role are visible in the header
- [ ] Navigation items change based on role

---

## Sprint 2 — Discovery Page & Recipe Listing
**Dates:** April 1 – April 4, 2026

### Goal
Build the screens that let users explore dish genres/regions and list recipes.

---

### S2-1: Discovery Page — Region, Genre & Filter Navigation
**Priority:** Critical  
**Related Issues:**  
- [#112 — Recipe Discovery: Region Selector, Allergen Filter, and Dish Genre/Variety Navigation](https://github.com/bounswe/bounswe2026group10/issues/112)  
- [#170 — FRONTEND/TASK: Dish Name Search Bar on Discovery Page](https://github.com/bounswe/bounswe2026group10/issues/170)  
**Branch:** `frontend/feature_discovery-page`

**Tasks:**
- [ ] Create `discoveryService.ts`:
  - `GET /discovery/recipes` (region, excludeAllergens, genreId, varietyId, page, limit)
  - `GET /dish-genres`
  - `GET /dish-varieties`
- [ ] Add `DiscoveryPage` route: `/discovery`
- [ ] Add `/discovery` to the router (under MainLayout, behind ProtectedRoute)
- [ ] **Region Selector:**
  - Display Turkish regions as a dropdown or card list
  - Filter recipe list by selected region
- [ ] **Dish Genre Cards:**
  - Fetch genres with `GET /dish-genres`
  - Render a visual card for each genre (e.g. Soups, Meat Dishes, Desserts)
- [ ] **Dish Variety Navigation:**
  - When a genre is selected, list its varieties
  - `GET /dish-varieties?genreId=X`
- [ ] **Allergen Filter:**
  - Fetch allergen list from the backend
  - Exclude recipes containing selected allergens from discovery results
- [ ] **Search Bar (Dish Name Search):** [#170]
  - Text input for recipe name search
  - `GET /discovery/recipes?search=xxx` (or via existing query param)
- [ ] Sync filter state with URL query params (filters preserved on page refresh)
- [ ] Loading skeleton + error state display

**New Issues to Open:**
- `[FRONTEND/FEATURE] Discovery page with region, genre, variety and allergen filters` (if not fully covered by #112)

---

### S2-2: Recipe Listing Page
**Priority:** Critical  
**Related Issues:**  
- [#158 — FRONTEND/TASK: Recipe Listing Page for a Dish Variety](https://github.com/bounswe/bounswe2026group10/issues/158)  
- [#113 — Community/Expert Recipe Listing with Rating-Based Sorting](https://github.com/bounswe/bounswe2026group10/issues/113)  
**Branch:** `frontend/feature_recipe-listing`

**Tasks:**
- [ ] Add `/recipes` or `/discovery/variety/:varietyId` route
- [ ] Create `RecipeListingPage` component
- [ ] **Recipe Card** (`RecipeCard`) component:
  - Recipe title
  - Dish variety name
  - Average rating (`average_rating`) — star display
  - Date (`created_at`)
  - Author (`username`)
  - Recipe type badge: `community` / `cultural`
- [ ] **Sorting:** Descending by rating (already supported by backend)
- [ ] **Pagination:** Page navigation using `pagination.total` from backend
- [ ] Empty state: "No recipes yet for this variety" message
- [ ] Navigate to this page when a variety is selected from the Discovery page

---

### S2-3: Shared Service Layer for Discovery & Listing
**Priority:** High  
**Branch:** `frontend/feature_recipe-services`

**Tasks:**
- [ ] Create `recipeService.ts`:
  - `getDiscoveryRecipes(params)` — `GET /discovery/recipes`
  - `getRecipesByVariety(varietyId, page)` — `GET /discovery/recipes?varietyId=X`
  - `getDishGenres()` — `GET /dish-genres`
  - `getDishVarieties(genreId?)` — `GET /dish-varieties`
- [ ] `useDiscovery` custom hook — filter state, async fetch, loading/error
- [ ] Error boundary or global error display

**New Issues to Open:**
- `[FRONTEND/TASK] Create recipe and discovery service layer`

---

### Sprint 2 Acceptance Criteria
- [ ] Discovery page works with region, genre and allergen filters
- [ ] Dish name search bar works
- [ ] Selecting a variety lists its recipes
- [ ] Recipes arrive sorted by rating
- [ ] Pagination works
- [ ] Loading and error states are displayed

---

## Sprint 3 — Recipe Detail + Recipe Creation Form + MVP Polish
**Dates:** April 4 – April 7, 2026

### Goal
Complete the recipe detail page (ingredients, steps, video, story, rating, comments) and the recipe creation form. Bring the MVP to a ready state for end-user testing.

---

### S3-1: Recipe Detail Page
**Priority:** Critical  
**Related Issues:**  
- [#161 — FRONTEND/TASK: Recipe Detail Page with Video Guide and Story](https://github.com/bounswe/bounswe2026group10/issues/161)  
- [#114 — TASK: Recipe Detail Page — Ingredients, Steps, Video Guide & Story](https://github.com/bounswe/bounswe2026group10/issues/114)  
**Branch:** `frontend/feature_recipe-detail`

**Tasks:**
- [ ] Add `/recipes/:id` route (under MainLayout)
- [ ] Add `getRecipeById(id)` function to `recipeService.ts` — `GET /recipes/:id` (open backend issue if endpoint is missing)
- [ ] **`RecipeDetailPage`** component:
  - Title and dish variety/genre
  - **Story:** Show if present, hide if absent
  - **Video Guide:** Embed YouTube/Vimeo player or show link button if `videoUrl` is present
  - **Ingredient List:** quantity, unit, ingredient name
  - **Preparation Steps:** numbered step list
  - **Tools:** show if present
  - **Average Rating:** star display + vote count
  - **Author Info:** username, role badge
  - **Date:** publication date
- [ ] Add "Go to Detail" link to recipe cards in the listing page

**New Issues to Open:**
- `[FRONTEND/TASK] Recipe detail page — basic layout with ingredients, steps, video, story`
- `[BACKEND/TASK] GET /recipes/:id detail endpoint` (if not yet implemented)

---

### S3-2: Serving Size Control
**Priority:** High  
**Related Issues:**  
- [#164 — FRONTEND/TASK: Serving Size Control on Recipe Detail Page](https://github.com/bounswe/bounswe2026group10/issues/164)  
- [#115 — TASK: Serving Size Adjustment with Dynamic Ingredient Recalculation](https://github.com/bounswe/bounswe2026group10/issues/115)  
**Branch:** `frontend/feature_serving-size-control`

**Tasks:**
- [ ] Add a serving size input/stepper to the recipe detail page
- [ ] When the user changes the serving count, recalculate ingredient quantities proportionally (frontend-side)
- [ ] Multiply each ingredient's quantity by the ratio between the selected serving and the reference `servingSize`
- [ ] Show updated quantities in the ingredient list (original amount in grey, new amount in bold)

---

### S3-3: Rating and Comment Components
**Priority:** High  
**Related Issues:** New issues to open  
**Branch:** `frontend/feature_rating-comment`

**Tasks:**
- [ ] Create `ratingService.ts`:
  - `POST /recipes/:id/ratings` — submit rating
  - `GET /recipes/:id/ratings` — fetch ratings
- [ ] Create `commentService.ts`:
  - `POST /recipes/:id/comments` — post comment
  - `GET /recipes/:id/comments` — list comments
- [ ] **Rating Component:**
  - Logged-in user can give a 1–5 star rating
  - If user has already rated, display their current rating (no edit)
  - `learner` role can rate
- [ ] **Comment Component:**
  - Comment list (avatar, username, date, text)
  - Comment input area + submit button for logged-in users
  - Optimistic UI update
- [ ] Non-logged-in users cannot rate/comment — show "Log in" link

**New Issues to Open:**
- `[FRONTEND/TASK] Rating component on recipe detail page`
- `[FRONTEND/TASK] Comment section on recipe detail page`

---

### S3-4: Recipe Creation Form
**Priority:** Critical  
**Related Issues:** New issue to open  
**Branch:** `frontend/feature_recipe-creation-form`

**Tasks:**
- [ ] Add `/recipes/new` route (ProtectedRoute, cook and expert only)
- [ ] Create `RecipeCreatePage` component — multi-step form (stepper):

**Step 1 — Basic Information:**
- [ ] Recipe title (required)
- [ ] Recipe type: `community` / `cultural` (expert only)
- [ ] Dish variety selection: `GET /dish-varieties` dropdown
- [ ] Serving size
- [ ] Story (optional textarea)
- [ ] Video URL (optional)

**Step 2 — Ingredients:**
- [ ] Ingredient entry row: name (autocomplete), quantity, unit
- [ ] Ingredient list: add/remove rows
- [ ] `GET /ingredients` or inline text entry (depending on backend support)

**Step 3 — Preparation Steps:**
- [ ] Numbered step list
- [ ] Add/remove/reorder steps (drag & drop optional)

**Step 4 — Tools (Optional):**
- [ ] Tool name input, add/remove as a list

**Draft & Publish:**
- [ ] "Save Draft" button — `POST /recipes` with `isPublished: false`
- [ ] "Publish" button — `POST /recipes` followed by `POST /recipes/:id/publish`
- [ ] Form validation (title required; cannot publish without at least 1 ingredient and 1 step)
- [ ] Success message and redirect to recipe detail page

**New Issues to Open:**
- `[FRONTEND/TASK] Multi-step recipe creation form with draft and publish`

---

### S3-5: Allergen & Dietary Tag Selection (in Recipe Creation)
**Priority:** Medium  
**Related Issue:** [#191 — FRONTEND/TASK: Dietary and Allergen Tag Selection in Recipe Creation Form](https://github.com/bounswe/bounswe2026group10/issues/191)  
**Branch:** `frontend/feature_allergen-dietary-tags`

**Tasks:**
- [ ] Add allergen and dietary tag selection to the recipe creation form
- [ ] Fetch allergen list from backend (`GET /allergens`)
- [ ] Multi-select checkbox/tag component
- [ ] Send selected tags together with the recipe payload

---

### S3-6: Accessibility Improvements
**Priority:** Medium  
**Related Issues:** New issue to open  
**Branch:** `frontend/feature_accessibility`

**Tasks:**
- [ ] Verify readable font sizes across all pages (min 16px body)
- [ ] Review high-contrast color palette
- [ ] Test keyboard navigation — verify Tab order is logical
- [ ] ARIA labels: form fields, buttons, navigation
- [ ] Form error messages compatible with screen readers
- [ ] Visible focus styles

**New Issues to Open:**
- `[FRONTEND/TASK] Accessibility audit and improvements for MVP`

---

### S3-7: MVP Final Polish & Testing
**Priority:** High  
**Branch:** `frontend/fix_mvp-polish`

**Tasks:**
- [ ] Consistent loading state and error handling across all pages
- [ ] 404 and error pages (improve `RouteError` component)
- [ ] Responsive design: tablet and desktop compatibility
- [ ] Meaningful messages for empty states
- [ ] Test all form validation scenarios
- [ ] Test all role combinations (learner, cook, expert)
- [ ] End-to-end test of the token refresh flow
- [ ] Environment variable check before deployment (`VITE_API_BASE_URL`)

---

### Sprint 3 Acceptance Criteria
- [ ] Cook/Expert can create a recipe, save a draft, and publish it
- [ ] Recipe detail page displays all information correctly
- [ ] Changing serving size updates ingredient quantities
- [ ] Users can rate and comment on recipes
- [ ] Accessibility standards are met
- [ ] All MVP flows work end-to-end

---

## Summary of New Issues to Open

The following issues have been identified as not yet opened or requiring more specific definitions:

### Sprint 1
| Issue Title | Suggested Branch | Priority |
|-------------|-----------------|----------|
| [FRONTEND/TASK] Fetch and display authenticated user profile on app load | `frontend/feature_user-profile-display` | High |
| [FRONTEND/TASK] Implement 401 interceptor with automatic token refresh | `frontend/feature_token-refresh` | High |
| [FRONTEND/FEATURE] Implement responsive main navigation bar with role-based items | `frontend/feature_main-navigation` | High |

### Sprint 2
| Issue Title | Suggested Branch | Priority |
|-------------|-----------------|----------|
| [FRONTEND/TASK] Create recipe and discovery service layer | `frontend/feature_recipe-services` | High |
| [FRONTEND/FEATURE] Discovery page with full filter support | `frontend/feature_discovery-page` | Critical |

### Sprint 3
| Issue Title | Suggested Branch | Priority |
|-------------|-----------------|----------|
| [FRONTEND/TASK] Recipe detail page — basic layout | `frontend/feature_recipe-detail` | Critical |
| [FRONTEND/TASK] Rating component on recipe detail page | `frontend/feature_rating-comment` | High |
| [FRONTEND/TASK] Comment section on recipe detail page | `frontend/feature_rating-comment` | High |
| [FRONTEND/TASK] Multi-step recipe creation form with draft and publish | `frontend/feature_recipe-creation-form` | Critical |
| [FRONTEND/TASK] Accessibility audit and improvements for MVP | `frontend/feature_accessibility` | Medium |
| [BACKEND/TASK] GET /recipes/:id detail endpoint | — | Critical (Backend) |

---

## Suggested Task Assignment

| Developer | Sprint 1 | Sprint 2 | Sprint 3 |
|-----------|----------|----------|----------|
| **Yunus Yücesoy** | S1-1 (Logout), S1-3 (Token Refresh) | S2-3 (Service layer) | S3-7 (Polish & deploy) |
| **Yüksel Ege Boyacı** | S1-2 (Profile), S1-4 (Role-based UI) | S2-1 (Discovery filters) | S3-4 (Recipe creation form) |
| **Hikmet Can Köseoğlu** | S1-5 (Nav bar) | S2-2 (Recipe listing) | S3-1 (Recipe detail) |
| **Ökkeş Berkay Acer** | S1-4 (Role UI support) | S2-1 (Allergen, search) | S3-3 (Rating & Comment), S3-6 (Accessibility) |

> Note: S3-2 (Serving size) and S3-5 (Allergen tags) are secondary priority and should be addressed after the core MVP flows are complete.

---

## Git Convention Reminders

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

## Dependency Map

```
Sprint 1 (Auth infrastructure)
    └── Sprint 2 (Discovery & Listing — requires auth)
            └── Sprint 3 (Detail & Creation — discovery and listing must be complete)
                    ├── S3-1 Recipe Detail (navigated to from listing cards)
                    ├── S3-3 Rating/Comment (requires S3-1 detail page)
                    └── S3-4 Recipe Creation (requires S1-4 role control)
```

---

*Last updated: March 29, 2026 — Yunus Yücesoy*
