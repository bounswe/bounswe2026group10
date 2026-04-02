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
│   │   ├── parse.ts             # Free-text recipe parser endpoint
│   │   └── ingredients.ts       # Ingredient search/autocomplete
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces (roles, auth, response)
│   ├── utils/
│   │   └── response.ts          # successResponse / errorResponse helpers
│   └── __tests__/               # Jest test suite
│       ├── auth.test.ts
│       ├── middleware.test.ts
│       ├── recipes.test.ts
│       ├── discovery.test.ts
│       ├── dietary-tags.test.ts
│       ├── media.test.ts
│       ├── parse.test.ts
│       ├── ingredients.test.ts
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
- **recipe_steps** — `id`, `recipe_id` (FK), `step_order`, `description`
- **recipe_tools** — `id`, `recipe_id` (FK), `name`
- **recipe_media** — `id`, `recipe_id` (FK), `url`, `type` (image|video), `created_at`
- **ratings** — `id`, `recipe_id` (FK), `user_id` (FK profiles), `score` (1-5), `created_at`, `updated_at` — unique constraint on (recipe_id, user_id)
- **recipe_dietary_tags** — `recipe_id` (FK recipes), `tag_id` (FK dietary_tags) — composite PK

### Reference Tables

- **ingredients** — `id`, `name`
- **allergens** — `id`, `name`
- **ingredient_allergens** — `ingredient_id` (FK), `allergen_id` (FK)
- **dietary_tags** — `id`, `name` (unique), `category` (dietary|allergen)
- **dish_genres** — `id`, `name`, `description`
- **dish_varieties** — `id`, `name`, `description`, `genre_id` (FK dish_genres), `region`

### Database Triggers

- `update_recipe_rating()` — auto-recalculates `average_rating` and `rating_count` on the recipes table when ratings change

## API Endpoints

### Health & Meta
- `GET /health` — Health check
- `GET /meta/regions` — Supported regions list (Turkey, Greece, Italy, Mexico, India, Japan)

### Auth (`/auth`)
- `POST /auth/register` — Register (email, password, username, role)
- `POST /auth/login` — Login (returns access_token, refresh_token)
- `POST /auth/logout` — Logout (auth required)
- `POST /auth/refresh` — Refresh access token
- `GET /auth/me` — Current user info (auth required)

### Recipes (`/recipes`)
- `GET /recipes/:id` — Recipe detail (public if published, creator-only if draft)
- `POST /recipes` — Create recipe (cook/expert only, accepts `tagIds`)
- `PATCH /recipes/:id` — Update draft (creator only, cook/expert, accepts `tagIds`)
- `POST /recipes/:id/publish` — Publish draft (validates completeness)
- `POST /recipes/:id/ratings` — Rate recipe 1-5 (cannot self-rate, upsert)
- `GET /recipes/:id/ratings/me` — Get own rating
- `DELETE /recipes/:id/ratings/me` — Delete own rating
- `POST /recipes/:id/media` — Attach media to recipe (creator only)
- `GET /recipes/:id/media` — List recipe media
- `DELETE /recipes/:id/media/:mediaId` — Remove media (creator only)

### Dish Genres (`/dish-genres`)
- `GET /dish-genres` — All genres with nested varieties

### Dish Varieties (`/dish-varieties`)
- `GET /dish-varieties` — List varieties (optional: genreId, search filters)
- `GET /dish-varieties/:id` — Single variety with published recipes
- `GET /dish-varieties/:id/recipes` — Variety recipes split into expertRecipe + communityRecipes

### Dietary Tags (`/dietary-tags`)
- `GET /dietary-tags` — List all supported dietary and allergen tags

### Discovery (`/discovery`)
- `GET /discovery/recipes` — Filtered recipe discovery
  - Query params: `region`, `genreId`, `varietyId`, `excludeAllergens` (comma-separated IDs), `tagIds` (comma-separated dietary tag IDs — only recipes with ALL specified tags), `page`, `limit`
- `GET /discovery/recipes/by-ingredients` — Recipes fully makeable with provided ingredients
  - Query params: `ingredientIds` (comma-separated IDs, required), `page`, `limit`
  - Only returns recipes whose every ingredient is in the provided list; partial matches excluded

### Media (`/media`)
- `POST /media/upload` — Upload file (cook/expert only, multipart/form-data)
  - Images: JPEG/PNG/WebP, max 10 MB
  - Videos: MP4, max 100 MB

### Ingredients (`/ingredients`)
- `GET /ingredients` — List/search ingredients by partial name (case-insensitive)
  - Query params: `search` (optional — filters by partial name match when provided)
  - Without `search`, returns all ingredients; supports autocomplete use case

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
