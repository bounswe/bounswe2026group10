# Roots & Recipes — Backend API

> **IMPORTANT:** Always update this file after adding or changing anything in the backend. CLAUDE.md must stay in sync with the actual codebase at all times.
## Project Overview

Backend API for **Roots & Recipes**, a cross-generational recipe and food heritage platform that preserves culinary traditions by collecting recipes, cooking techniques, and food stories from experienced home cooks and communities. Built as a university project (CMPE354 — bounswe2026group10).

Wiki: https://github.com/bounswe/bounswe2026group10/wiki

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express.js 5 |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL (hosted on Supabase) |
| DB Client | Supabase JS SDK (PostgREST) — no ORM |
| Validation | Zod |
| Auth | Supabase Auth (JWT) |
| File Storage | Supabase Storage |
| File Uploads | Multer |
| Security | Helmet, CORS |
| AI | Google Gemini 2.5 Flash (@google/generative-ai) |
| Testing | Jest + Supertest + ts-jest |
| Containerization | Docker (multi-stage, node:20-alpine) |

## Commands

```bash
npm run dev            # Start dev server (ts-node, port 3000)
npm run build          # Compile TypeScript to dist/
npm start              # Run compiled JS (production)
npm test               # Run all tests (jest --runInBand)
npm run test:coverage  # Tests with coverage report
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts                 # Express app setup, middleware, route mounting
│   ├── config/
│   │   ├── supabase.ts          # Supabase client (anon + user-scoped)
│   │   └── gemini.ts            # Google Gemini AI client config
│   ├── services/
│   │   └── recipe-parser.ts     # Free-text recipe parser (Gemini AI)
│   ├── middleware/
│   │   ├── auth.ts              # requireAuth, requireRole middleware
│   │   └── validate.ts          # Zod-based request body validation
│   ├── routes/
│   │   ├── auth.ts              # Register, login, logout, refresh, me
│   │   ├── recipes.ts           # Recipe CRUD, publish, ratings, media attach
│   │   ├── media.ts             # File upload (images/videos)
│   │   ├── discovery.ts         # Recipe discovery with filters
│   │   ├── dietary-tags.ts      # Dietary/allergen tag listing
│   │   ├── dish-genres.ts       # Cuisine genre listing
│   │   ├── dish-varieties.ts    # Dish variety listing, search, recipes
│   │   ├── ingredients.ts       # Ingredient search/autocomplete
│   │   ├── substitutions.ts     # Ingredient substitution suggestions
│   │   ├── tools.ts             # Tool search/autocomplete
│   │   ├── units.ts             # Unit search/autocomplete
│   │   ├── comments.ts          # Recipe comments (create, list, delete)
│   │   └── parse.ts             # Free-text recipe parser endpoint
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces (roles, auth, response, SupportedLanguage)
│   ├── utils/
│   │   ├── response.ts          # successResponse / errorResponse helpers
│   │   ├── i18n.ts              # parseLangParam, resolveLang — ?lang= query param helpers
│   │   ├── locations.ts         # location normalization + alias expansion (#398)
│   │   └── text.ts              # Turkish-aware text helpers (#402)
│   └── __tests__/               # Jest test suite
│       ├── auth.test.ts
│       ├── middleware.test.ts
│       ├── recipes.test.ts
│       ├── discovery.test.ts
│       ├── dietary-tags.test.ts
│       ├── media.test.ts
│       ├── parse.test.ts
│       ├── ingredients.test.ts
│       ├── substitutions.test.ts
│       ├── tools.test.ts
│       ├── units.test.ts
│       ├── comments.test.ts
│       └── health.test.ts
├── Dockerfile
├── jest.config.js
├── tsconfig.json
└── package.json
```

## Database Schema

Database is managed via Supabase (no migration files in repo). Key tables:

### Core Tables

- **profiles** — `id`, `user_id` (FK auth.users), `username` (unique), `role`
- **recipes** — `id`, `creator_id` (FK profiles), `dish_variety_id` (FK), `title`, `story`, `video_url`, `serving_size`, `type` (community|cultural), `is_published`, `average_rating`, `rating_count`, `created_at`, `updated_at`
- **recipe_ingredients** — `id`, `recipe_id` (FK), `ingredient_id` (FK), `quantity`, `unit`
- **recipe_steps** — `id`, `recipe_id` (FK), `step_order`, `description`, `video_timestamp` (numeric, nullable — seconds into the recipe video)
- **recipe_tools** — `id`, `recipe_id` (FK), `name`
- **recipe_media** — `id`, `recipe_id` (FK), `url`, `type` (image|video), `created_at`
- **ratings** — `id`, `recipe_id` (FK), `user_id` (FK profiles), `score` (1-5), `created_at`, `updated_at` — unique constraint on (recipe_id, user_id)
- **recipe_dietary_tags** — `recipe_id` (FK recipes), `tag_id` (FK dietary_tags) — composite PK
- **comments** — `id` (serial PK), `recipe_id` (FK recipes ON DELETE CASCADE), `user_id` (FK profiles ON DELETE CASCADE), `text` (1–2000 chars, CHECK), `created_at`, `updated_at` (nullable). Indexed on `recipe_id`, `user_id`, and `(recipe_id, created_at DESC)`. **Unique constraint on `(recipe_id, user_id)`** — one comment per user per recipe; the API enforces this with a pre-insert existence check and also maps Postgres `unique_violation` (23505) on insert to 409 `COMMENT_ALREADY_EXISTS` to handle the race window. The API exposes the column as `body`; the route maps `body` ↔ `text` at the DB boundary.

### Reference Tables

- **ingredients** — `id`, `name`, `name_en`, `name_tr` (`name` mirrors `name_en` for backward compat; see migration 002)
- **allergens** — `id`, `name`
- **ingredient_allergens** — `ingredient_id` (FK), `allergen_id` (FK)
- **ingredient_substitutions** — `id`, `ingredient_id` (FK ingredients), `substitute_id` (FK ingredients), `source_amount` NUMERIC(10,3), `source_unit` TEXT, `sub_amount` NUMERIC(10,3), `sub_unit` TEXT, `confidence` NUMERIC(3,2), `description` TEXT — unique on (ingredient_id, substitute_id), no self-substitution
- **dietary_tags** — `id`, `name`, `name_en`, `name_tr`, `category` (dietary|allergen)
- **dish_genres** — `id`, `name`, `name_en`, `name_tr`, `description`, `description_en`, `description_tr`
- **dish_varieties** — `id`, `name`, `name_en`, `name_tr`, `description`, `description_en`, `description_tr`, `genre_id` (FK dish_genres)

### Language Fields Convention (#412)

All translatable reference fields follow the `<field>_en` / `<field>_tr` naming pattern.  
Migration `002_en_tr_language_fields.sql` adds these columns and seeds `_en` from the existing value.

- Without `?lang=`: endpoints return all fields including `_en` and `_tr`.
- With `?lang=en` or `?lang=tr`: endpoints return a single resolved `name`/`description` (preferred language, falling back to the other if null).
- Invalid `?lang=` values return 400 `VALIDATION_ERROR`.

### Database Triggers

- `update_recipe_rating()` — auto-recalculates `average_rating` and `rating_count` on the recipes table when ratings change

## API Endpoints

### Health & Meta
- `GET /health` — Health check

### Auth (`/auth`)
- `POST /auth/register` — Register (email, password, username, role)
- `POST /auth/login` — Login (returns access_token, refresh_token)
- `POST /auth/logout` — Logout (auth required)
- `POST /auth/refresh` — Refresh access token
- `GET /auth/me` — Current user info (auth required)
- `PATCH /auth/profile` — Update profile fields (auth required, all fields optional: `username`, `bio`, `avatar_url`, `preferred_language`, `region`); returns 409 if username taken

### Recipes (`/recipes`)
- `GET /recipes/:id` — Recipe detail (public if published, creator-only if draft)
- `GET /recipes` — List published recipes with pagination
  - Query params: `creatorId` (optional UUID — filter by creator's profile ID to view a specific user's published recipes), `page`, `limit`
  - Response recipe objects include `coverImageUrl` (first image from `recipe_media`, or `null`)
- `POST /recipes` — Create recipe (cook/expert only, accepts `tagIds`, optional `country`, `city`, `district`)
- `PATCH /recipes/:id` — Update draft (creator only, cook/expert, accepts `tagIds`, optional `country`, `city`, `district`)
- `POST /recipes/:id/publish` — Publish draft (validates completeness)
- `POST /recipes/:id/ratings` — Rate recipe 1-5 (cannot self-rate, upsert)
- `GET /recipes/:id/ratings/me` — Get own rating
- `DELETE /recipes/:id/ratings/me` — Delete own rating
- `POST /recipes/:id/media` — Attach media to recipe (creator only)
- `GET /recipes/:id/media` — List recipe media
- `DELETE /recipes/:id/media/:mediaId` — Remove media (creator only)
- `GET /recipes/:id/scale` — Scale ingredient quantities to a desired serving size (#163)
  - Query params: `servings` (required, integer 1–1000)
  - Returns `{ recipeId, baseServings, requestedServings, ingredients[] }` with proportionally scaled quantities
  - Returns 400 if `servings` param is invalid or recipe has no base serving size set

### Dish Genres (`/dish-genres`)
- `GET /dish-genres` — All genres with nested varieties
  - Query params: `lang` (optional — "en" or "tr"; returns resolved `name`/`description` instead of `_en`/`_tr` pair)
  - Without `lang`: each genre includes `name_en`, `name_tr`, `description_en`, `description_tr`; each nested variety includes `name_en`, `name_tr`

### Dish Varieties (`/dish-varieties`)
- `GET /dish-varieties` — List varieties (optional: genreId, search, lang filters)
  - Query params: `genreId`, `search`, `lang` (optional — "en" or "tr")
  - Without `lang`: response includes `name_en`, `name_tr`, `description_en`, `description_tr`
- `GET /dish-varieties/:id` — Single variety with published recipes
  - Query params: `lang` (optional — "en" or "tr")
- `GET /dish-varieties/:id/recipes` — Variety recipes split into expertRecipe + communityRecipes

### Ingredients (`/ingredients`)
- `GET /ingredients` — List all ingredients (optional: `?search=<string>`, `?lang=<en|tr>`)
  - Without `lang`: response includes `name`, `name_en`, `name_tr`
  - With `lang`: response includes only resolved `name` (preferred language, fallback to other)
- `POST /ingredients` — Create a new ingredient (cook/expert only)
  - Body: `{ name_en?: string, name_tr?: string }` — at least one field required
  - Returns 409 if an ingredient with the same primary name already exists
  - Stores `name_en` and `name_tr`; `name` column mirrors `name_en ?? name_tr` for backward compat
- `GET /ingredients/:id/substitutions` — Get substitute suggestions for an ingredient (#274)
  - Query params: `amount` (optional, positive number), `unit` (optional, string — e.g. `gr`)
  - Without params: returns all substitutions with base amounts
  - With `amount` + `unit`: calculates and returns the proportional substitute amount
  - Formula: `sub_amount = round((amount / source_amount) × base_sub_amount, 3)`
  - Example: 1 gr salt → 2 ml lemon; request `?amount=4&unit=gr` → returns 8 ml lemon
  - Returns 404 if ingredient not found, 400 if params are invalid

### Dietary Tags (`/dietary-tags`)
- `GET /dietary-tags` — List all supported dietary and allergen tags
  - Query params: `lang` (optional — "en" or "tr")
  - Without `lang`: response includes `name`, `name_en`, `name_tr`, `category`

### Discovery (`/discovery`)
- `GET /discovery/recipes` — Filtered recipe discovery
  - Query params: `genreId`, `varietyId`, `excludeAllergens` (comma-separated IDs), `tagIds` (comma-separated dietary tag IDs — only recipes with ALL specified tags), `search` (case-insensitive partial match on recipe title), `country`, `city`, `district` (case-insensitive, whitespace-/diacritic-tolerant; country also resolves common aliases — `"tr"`/`"Türkiye"`/`"TUR"` all match recipes stored as `"Turkey"`. See Location Normalization below), `page`, `limit`
  - Response recipe objects include `country`, `city`, `district` fields (nullable)
- `GET /discovery/recipes/by-ingredients` — Recipes fully makeable with provided ingredients
  - Query params: `ingredientIds` (comma-separated IDs, required), `page`, `limit`
  - Only returns recipes whose every ingredient is in the provided list; partial matches excluded
- `GET /discovery/locations` — Distinct location values with at least one published recipe (#323)
  - No params → distinct countries
  - `?country=Turkey` → distinct cities in Turkey (parent `country` matched case-insensitively + via known aliases — `"tr"`/`"Türkiye"`/`"TUR"` all resolve to the same set)
  - `?country=Turkey&city=Istanbul` → distinct districts in Istanbul (parent `country`/`city` matched case-insensitively; country also alias-aware)
  - Returns `{ results: string[] }` deduplicated by canonical key (alias-aware: `"Turkey"`, `"Türkiye"`, `"TR"` collapse into one entry — canonical display name wins), sorted alphabetically
  - Returns 400 if `city` is provided without `country`; null/empty fields excluded

### Media (`/media`)
- `POST /media/upload` — Upload file (cook/expert only, multipart/form-data)
  - Images: JPEG/PNG/WebP, max 10 MB
  - Videos: MP4/MOV, max 100 MB

### Ingredients (`/ingredients`)
- `GET /ingredients` — List/search ingredients by partial name (case-insensitive)
  - Query params: `search` (optional — filters by partial name match when provided)
  - Without `search`, returns all ingredients; supports autocomplete use case
- `POST /ingredients` — Create a new ingredient (cook/expert only)
  - Body: `{ name: string }`
  - Returns 409 if ingredient with same name already exists (case-insensitive)
  - Stores name lowercased

### Tools (`/tools`)
- `GET /tools` — List/search tools by partial name (case-insensitive)
  - Query params: `search` (optional — filters by partial name match when provided)
  - Returns distinct tool names from `recipe_tools`; without `search`, returns all known tools; supports autocomplete use case
### Units (`/units`)
- `GET /units` — List/search units by partial name (case-insensitive)
  - Query params: `search` (optional — filters by partial name match when provided)
  - Returns distinct unit values from `recipe_ingredients`; without `search`, returns all known units; supports autocomplete use case

### Comments (`/recipes/:id/comments`, `/comments/:id`)
Comments are coupled to ratings (Amazon-style): a non-creator must have a rating on the recipe to comment, but rating is allowed without commenting. Each user is limited to **one comment per recipe** — to revise, they edit their existing comment via `PATCH /comments/:id`.

- `POST /recipes/:id/comments` — Create a comment on a recipe (auth required, #419)
  - Body: `{ body: string, score?: number }` — `body` is 1–2000 chars (trimmed); `score` is an optional integer 1–5
  - If `score` is provided, upserts the user's rating on the recipe in the same call
  - If `score` is omitted, requires an existing rating from the user; otherwise returns 400 `RATING_REQUIRED`
  - Returns 409 `COMMENT_ALREADY_EXISTS` if the user already has a comment on the recipe (the existence check runs before rating side-effects, so a rejected request never mutates the rating)
  - Recipe creators may comment on their own recipe without a rating; passing a `score` as the creator returns 403 (self-rating forbidden, mirroring `POST /recipes/:id/ratings`)
  - Returns 404 if the recipe does not exist
  - Response: `{ comment: {...}, rating: {...} | null }`
- `GET /recipes/:id/comments` — List comments on a recipe with pagination (public)
  - Query params: `page` (default 1), `limit` (default 20, max 100)
  - Ordered by `created_at` descending (newest first)
  - Each comment includes the author's `username` (joined from `profiles`) and the author's `score` for this recipe (joined from `ratings`, `null` if no rating row — e.g. for the recipe creator)
- `PATCH /comments/:id` — Edit own comment (auth required, author only)
  - Body: `{ body: string }` (1–2000 chars, trimmed)
  - Returns 403 if the caller is not the author, 404 if the comment does not exist
- `DELETE /comments/:id` — Delete own comment (auth required, author only)
  - Returns 403 if the user is not the comment author
  - Returns 404 if the comment does not exist

### Parse (`/parse`)
- `POST /parse/recipe-text` — Parse free-text recipe into structured components (cook/expert only)
  - Body: `{ text: string }` (10–5000 chars)
  - Returns structured `{ title, ingredients[], steps[], tools[] }` without storing anything
  - Uses Gemini 2.5 Flash AI for text parsing
- `POST /parse/standardize-units` — Convert informal/colloquial ingredient units and step descriptions to standard forms (cook/expert only)
  - Body: `{ ingredients: [{ name, quantity, unit }], steps?: [{ stepOrder, description }], region?: string }`
  - Returns `{ ingredients: [{ name, originalQuantity, originalUnit, standardQuantity, standardUnit }], steps: [{ stepOrder, originalDescription, standardDescription }] }`
  - Region-aware: uses region hint (e.g. "Turkey") to resolve locale-specific units (çay bardağı → 100 ml) and expressions (kulak memesi kıvamı → clear description)
  - Uses Gemini 2.5 Flash AI for conversion

## User Roles & Permissions

| Role | Permissions |
|------|------------|
| `learner` | View recipes, rate, browse/discover |
| `cook` | + Create **community** recipes, upload media |
| `expert` | + Create **cultural** recipes (in addition to community) |

## Authentication Flow

1. Supabase Auth handles email/password authentication
2. Login returns JWT `access_token` + `refresh_token`
3. Clients send `Authorization: Bearer <token>` header
4. `requireAuth` middleware validates token via Supabase, attaches `req.user`
5. `requireRole(...roles)` middleware restricts by role
6. Authenticated routes create a user-scoped Supabase client (respects RLS)

## Key Patterns & Conventions

### Response Envelope
All endpoints return:
```json
{ "success": true,  "data": <T>,   "error": null }
{ "success": false, "data": null,  "error": { "code": "ERROR_CODE", "message": "..." } }
```
Use `successResponse(data)` and `errorResponse(code, message)` from `src/utils/response.ts`.

### Error Codes
- `VALIDATION_ERROR` (400) — Zod validation failure
- `UNAUTHORIZED` (401) — Missing/invalid token
- `FORBIDDEN` (403) — Wrong role or not owner
- `NOT_FOUND` (404) — Resource not found
- `CONFLICT` (409) — Duplicate username/email, already published
- `RATING_REQUIRED` (400) — Comment attempted without a rating on the recipe
- `COMMENT_ALREADY_EXISTS` (409) — User attempted to post a second comment on the same recipe (must edit instead)
- `INCOMPLETE_RECIPE` (400) — Missing fields for publish
- `PARSE_FAILED` (500) — AI parsing of recipe text failed
- `STANDARDIZATION_FAILED` (500) — AI unit standardization failed

### Validation
- Zod schemas defined inline in route files
- `validate(schema)` middleware for request body validation
- Manual ownership checks (creator_id === user.profileId)

### Database Queries
- Supabase PostgREST chainable query builder (no raw SQL)
- Nested relationship selection with dot notation (e.g., `recipe_ingredients(*, ingredients(*))`)
- User-scoped client for write operations (RLS enforcement)
- `.single()` for expected-one results, `.maybeSingle()` for optional

### Testing
- Supabase is fully mocked with `jest.mock()`
- Chainable mock pattern simulates PostgREST query builder
- Supertest for HTTP-level assertions
- Tests run sequentially (`--runInBand`)

### Location Normalization (issue #398)

Recipe origin labels (`country`, `city`, `district`) are free-text fields that
are easy to mis-type. The origin filter must tolerate three kinds of mismatch
between filter input and stored value:

1. **Casing / whitespace** — `"Turkey"` vs `" turkey "`.
2. **Diacritics / Turkish dotted-i** — `"Türkiye"` vs `"Turkiye"`,
   `"İstanbul"` vs `"Istanbul"`.
3. **Aliases** — `"Turkey"` vs `"tr"` vs `"TUR"` vs `"Türkiye"`.

The helpers live in `src/utils/locations.ts`:

- `normalizeLocation()` — trims, collapses internal whitespace, returns
  `null` for empty input. Preserves casing and diacritics.
- `canonicalizeLocationForWrite()` — `normalizeLocation` + alias resolution
  to the canonical display name (e.g. `"tr"` / `"Türkiye"` → `"Turkey"`).
  Inputs that don't match any alias pass through unchanged.
- `getLocationVariants()` — returns every known surface form equivalent to
  the input (e.g. `"tr"` → `["Turkey", "tr", "tur", "turkiye",
  "republic of turkey", ...]`). Inputs without aliases return as a
  single-element list.
- `escapeLikePattern()` — escapes `%`, `_`, `\` for safe ILIKE patterns.
- `dedupeLocationLabels()` — collapses values by canonical key (alias-aware,
  diacritic-insensitive); when an alias group is hit the canonical display
  name wins, otherwise first-seen casing wins. Sorted alphabetically.

How they're wired:

- **On write** (`POST /recipes`, `PATCH /recipes/:id`): country, city, and
  district run through `canonicalizeLocationForWrite()`, so a user who types
  `"tr"` ends up with `"Turkey"` stored. Future rows are clean by
  construction.
- **On read** (`GET /discovery/recipes`, `GET /discovery/locations`): each
  location filter expands to `getLocationVariants()` and the query becomes
  `column.ilike.<v1> OR column.ilike.<v2> OR …` (via Supabase `.or()`).
  Single-variant inputs (e.g. cities not in the alias table) fall back to a
  plain `.ilike()` so the SQL stays simple. This handles legacy rows that
  predate the canonicalize-on-write change.
- **Locations dedup**: `GET /discovery/locations` runs results through
  `dedupeLocationLabels()`, so a DB holding `"Turkey"`, `"Türkiye"`, and
  `"TR"` collapses into a single `"Turkey"` entry in the response.

The alias table currently covers Turkey, United States, United Kingdom,
Germany, Italy, France, Spain, Japan, Greece, and Azerbaijan. Add countries
to `LOCATION_ALIASES` in `src/utils/locations.ts` as new mismatches surface.

### Turkish Character Handling (issue #402)

Turkish locale has case rules that diverge from default Unicode (`I` ↔ `ı`,
`İ` ↔ `i`). Combined with optional diacritics (`ğ ü ş ö ç`) and the fact
that some clients emit decomposed Unicode (`c` + combining cedilla) where
others emit precomposed (`ç`), Postgres `ILIKE` alone cannot reliably match
user search input against stored values.

The helpers live in `src/utils/text.ts`:

- `normalizeText()` — NFC + collapse whitespace + trim, returns `null` for
  empty input. Preserves Turkish characters intact. Used on the write path
  to ensure stored text has stable encoding.
- `turkishFold()` — case- and diacritic-insensitive comparison key. NFC
  → pair Turkish dotted-i (`İ`→`I`, `ı`→`i`) → strip combining marks via
  NFD → lowercase. Use for JS-side dedupe / equality.
- `buildSearchVariants()` — expands a search input into a deduped list of
  variants (raw, Turkish-locale lowercase, default lowercase, fully folded)
  for an OR-of-ilikes query. Empty input returns `[]`.

Wired into:

- **Search (read)**: `GET /discovery/recipes` (title), `GET /dish-varieties`
  (name/name_en/name_tr), `GET /ingredients` (name/name_en/name_tr),
  `GET /tools` (name), `GET /units` (unit). Each route ORs `ilike` over
  the variants so a search for `kofte` still hits rows stored as `Köfte`,
  and `ISTANBUL` hits both `İstanbul` and `Istanbul`.
- **Storage (write)**: `POST /recipes` and `PATCH /recipes/:id`
  (title, story), `POST /recipes/:id/comments` and `PATCH /comments/:id`
  (body), `POST /ingredients` (name_en, name_tr) — all NFC-normalize free
  text before insert/update.
- **Dedup**: `GET /tools` and `GET /units` collapse rows by `turkishFold`
  so `Kaşık` and `kaşık` show up as one entry.

The `POST /ingredients` duplicate check uses Turkish-locale lowercase
(`toLocaleLowerCase("tr-TR")`) on the primary name before the `ilike`
existence query so `BİBER` and `biber` collide as expected.

### Naming Conventions
- **Files:** kebab-case (`dish-varieties.ts`)
- **Variables/functions:** camelCase
- **Types/interfaces:** PascalCase (`AuthenticatedRequest`, `UserRole`)
- **Error codes:** UPPER_SNAKE_CASE (`VALIDATION_ERROR`)
- **Section comments:** Unicode box-drawing characters (`─`, `└`, `├`)

### Git Commit Convention
```
feat/fix(domain): description (#issueNumber)
```
Example: `feat(ratings): add recipe star rating endpoints (#175, #241)`

## Environment Variables

Required in `.env`:
```
PORT=3000
SUPABASE_URL=<supabase-project-url>
SUPABASE_ANON_KEY=<supabase-anon-key>
DATABASE_URL=<postgres-connection-string>
DIRECT_URL=<postgres-direct-connection-string>
GEMINI_API_KEY=<google-gemini-api-key>
```

## Docker

```bash
docker build -t roots-recipes-backend .
docker run -p 3000:3000 --env-file .env roots-recipes-backend
```

Multi-stage build: TypeScript compile in builder stage, production deps only in runtime stage.

## Adding New Features — Checklist

1. Create/update route file in `src/routes/`
2. Define Zod validation schemas for request bodies
3. Use `successResponse`/`errorResponse` for all responses
4. Add `requireAuth`/`requireRole` middleware where needed
5. Mount the router in `src/index.ts` if new
6. Add tests in `src/__tests__/`
7. Run `npm test` to verify
8. **Update this CLAUDE.md file** to reflect the changes
