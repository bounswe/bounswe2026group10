# Roots & Recipes

**A cross-generational recipe and food heritage platform**, built to preserve culinary traditions by connecting experienced home cooks, cultural experts, and food learners across generations and borders.

> CMPE354 Software Engineering · Bogazici University · bounswe2026group10

---

## Live Deployment

The application is fully deployed and ready to use without any local setup.

| Component | URL |
|-----------|-----|
| Web App | https://rootsrecipes.social |
| Backend API | See `group10_credentials.pdf` |
| API Docs (Swagger) | `<backend-url>/api-docs` |
| Mobile APK | [GitHub Releases](https://github.com/bounswe/bounswe2026group10/releases/latest) |

### Test Accounts

Use the pre-created accounts to test all role-based features. Login credentials are provided in the separate `group10_credentials.pdf` document submitted alongside this project.

| Role | Capability |
|------|-----------|
| Admin | Approve expert requests, moderate users/recipes/comments |
| Expert | Publish cultural recipes, manage video annotations |
| Cook | Create community recipes, upload media |
| Learner | Browse, discover, rate, and comment |

---

## 1. Web Application

### Option A — Deployed Version (Recommended)

Visit **https://rootsrecipes.social** and log in with any of the test accounts above. No setup required.

### Option B — Run Locally with Docker Compose

This is the simplest way to run the full stack locally. A `docker-compose.yml` is provided at the repository root.

**Prerequisites:** Docker Desktop installed and running.

```bash
# 1. Clone the repository
git clone https://github.com/bounswe/bounswe2026group10.git
cd bounswe2026group10

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Open backend/.env and fill in your Supabase project credentials and API keys
# (see "Environment Variables" section below)

# 3. Build and start all services
docker-compose up --build
```

Once running:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api-docs

To stop: `docker-compose down`

> **Note:** The `docker-compose.yml` builds the frontend against `VITE_API_BASE_URL=http://localhost:3000`. If you change the backend port, update this `args` value in `docker-compose.yml` accordingly.

### Option C — Local Development (Hot Reload)

Run backend and frontend as separate dev servers with hot reload.

**Backend:**
```bash
cd backend
cp .env.example .env    # fill in credentials
npm install
npm run build
npm start             # starts on http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev             # starts on http://localhost:5173
                        # Vite automatically proxies /api → localhost:3000
```

Other useful commands:
```bash
npm run build   # production build
npm run lint    # ESLint
npm test        # Jest test suite
```

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values:

```
PORT=3000
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>   # required for /admin/* endpoints
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-supabase-publishable-key>
DATABASE_URL=postgresql://postgres.<ref>:<password>@<host>:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres
GEMINI_API_KEY=<google-gemini-api-key>
ELEVENLABS_API_KEY=<elevenlabs-api-key>
DEEPL_API_KEY=<deepl-api-key>
```


For the frontend, environment is already configured:
- **Development** (`npm run dev`): `frontend/.env.development` sets `VITE_API_BASE_URL=/api`; the Vite dev server proxies this to `localhost:3000`.
- **Production** (`npm run prod`): `frontend/.env.production` sets `VITE_API_BASE_URL` to the deployed DigitalOcean backend URL.

### Data Seeding

Since the project uses a hosted Supabase instance, the database is already populated with the required reference data and test accounts. Therefore, no separate data seeding step is needed for the deployed version.

---

## 2. Mobile Application

### Option A — Download the APK (Quickest)

1. Go to **[GitHub Releases](https://github.com/bounswe/bounswe2026group10/releases/latest)**
2. Download `app-release.apk`
3. Transfer to an Android device and install (enable "Install from unknown sources" if prompted)
4. Open the app — it connects to the deployed backend automatically
5. Log in with any test account from the table above

### Option B — Run in Development (Expo)

**Prerequisites:** Node.js 20+, Expo Go app on your phone or an Android/iOS emulator.

```bash
cd mobile
npm install
npx expo start
```

From the Expo CLI:
- Press **a** — Android emulator
- Press **i** — iOS simulator (macOS only)
- Scan QR code — Expo Go on a physical device

### Network Configuration

| Mode | API Base URL | How it's set |
|------|-------------|--------------|
| Production APK | Deployed backend (see credentials doc) | Hardcoded in `src/api/client.ts` |
| Local dev (emulator) | `http://10.0.2.2:3000` | Change `BASE_URL` in `src/api/client.ts` |
| Local dev (physical device) | `http://<your-machine-ip>:3000` | Change `BASE_URL` in `src/api/client.ts` |

To point the dev build at your local backend, edit `mobile/src/api/client.ts`:
```ts
// Change this line in mobile/src/api/client.ts:
export const BASE_URL = '<deployed-backend-url>';
// To your local machine's IP (find it with `ipconfig` on Windows or `ifconfig` on macOS/Linux):
export const BASE_URL = 'http://192.168.1.x:3000';
// Or for Android Emulator specifically:
export const BASE_URL = 'http://10.0.2.2:3000';
```

> Make sure your backend is running (`cd backend && npm run dev`) and your device/emulator is on the same network as your machine.

### Build APK Locally

See [`mobile/BUILD.md`](mobile/BUILD.md) for full instructions. Summary:

```bash
cd mobile
npx expo prebuild --platform android --no-install
cd android
./gradlew assembleRelease
# APK output: android/app/build/outputs/apk/release/app-release.apk
```

Install on device:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Mobile Tests

```bash
cd mobile
npm test                                        # run all tests
npx jest src/__tests__/LoginScreen.test.tsx    # single test file
npx jest --coverage                            # with coverage
```

---

## What is Roots & Recipes?

Roots & Recipes is a community-driven platform where users discover, create, and share heritage recipes with their full cultural context. Beyond ingredients and steps, a recipe can carry a cultural story, a regional origin, dietary and allergen tags, and a video guide — complete with annotated timestamps that highlight key techniques.

The platform supports three user tiers: **learners** who explore and rate, **cooks** who share community recipes, and **experts** (verified by admin) who publish authoritative cultural recipes. An AI-assisted creation flow lets anyone dictate or paste a recipe in free text or record an audio/video — the platform structures it automatically.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Recipe Discovery** | Filter by dish genre/variety, dietary tags, allergens, cultural event, and geographic origin |
| **Recipe Creation** | 4-step wizard (basic info → ingredients & tools → steps → review & publish) |
| **AI Recipe Parsing** | Paste free text or upload an audio/video — Gemini + ElevenLabs structure it into a recipe |
| **Unit Standardization** | Region-aware conversion of colloquial units (e.g. *çay bardağı* → 100 ml) |
| **EN ↔ TR Translation** | DeepL-powered automatic translation of recipe content |
| **Video Guide** | Upload a cooking video; annotate timestamp ranges by technique; per-step start markers |
| **Ingredient Substitutions** | Proportional substitution suggestions (e.g. 4 gr salt → 8 ml lemon juice) |
| **Serving Size Scaling** | Scale ingredient quantities to any serving count |
| **Ratings & Comments** | Star ratings with one comment per user; rating required to comment |
| **Cultural Tagging** | Attach cultural event tags (wedding, iftar, harvest …) and a geographic origin |
| **Allergen Filtering** | Exclude recipes by allergen — derived from ingredients as well as manual tags |
| **Expert Approval Flow** | Expert role is gated; admin reviews applications before granting access |
| **Admin Panel** | Moderate users, recipes, and comments; review expert requests |
| **Bilingual UI** | Full EN/TR i18n on both web and mobile |

---

## Repository Layout

```
bounswe2026group10/
├── backend/           # Node.js/Express REST API
│   ├── src/           # TypeScript source
│   ├── migrations/    # Supabase SQL migrations
│   ├── .env.example   # Required environment variables
│   └── Dockerfile
├── frontend/          # React web app
│   ├── src/
│   └── .env.example   # VITE_API_BASE_URL
├── mobile/            # React Native app (Expo)
│   ├── src/
│   ├── BUILD.md       # Full APK build guide
│   └── .env.example   # API_BASE_URL reference
├── docs/              # Design specs, scenarios, feature docs
├── e2e/               # End-to-end tests
└── docker-compose.yml # One-command local stack
```

---

## Tech Stack

### Backend (`backend/`)
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 5 + TypeScript (strict) |
| Database | PostgreSQL via Supabase (PostgREST, no ORM) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |
| Validation | Zod |
| AI | Google Gemini 2.5 Flash (parsing, unit standardization) |
| Speech-to-Text | ElevenLabs Scribe v1 (audio/video transcription) |
| Translation | DeepL API (EN ↔ TR) |
| Testing | Jest + Supertest + ts-jest |
| Container | Docker (multi-stage, node:20-alpine) |

### Frontend (`frontend/`)
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| State | Redux Toolkit |
| HTTP | Axios (`VITE_API_BASE_URL` env var) |
| Styling | Tailwind CSS + CSS design tokens |
| i18n | i18next / react-i18next (EN/TR) |
| Deployment | DigitalOcean |

### Mobile (`mobile/`)
| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript |
| Styling | NativeWind (Tailwind for RN) |
| Navigation | React Navigation v7 |
| Auth state | `AuthContext` |
| Recipe creation | `RecipeFormContext` (4-step wizard) |

---

## Architecture

### Data Flow (Frontend)
```
Pages/Components → Redux Slices/Thunks → Services → HTTP Client (Axios) → API
```
No direct API calls from components. All state lives in Redux; services are plain async functions with no React dependencies.

### Data Flow (Mobile)
```
Screens/Contexts → fetchApi helper → Backend API
```
No Redux on mobile. Auth state lives in `AuthContext`; recipe form state lives in `RecipeFormContext`.

### API Response Envelope
```json
{ "success": true,  "data": { ... }, "error": null }
{ "success": false, "data": null,    "error": { "code": "ERROR_CODE", "message": "..." } }
```

### Domain Model
```
DishGenre → DishVariety → Recipe
                           ├── Steps (with per-step video timestamp)
                           ├── Ingredients (with substitutions)
                           ├── Tools
                           ├── Media (images / video)
                           ├── Video Annotations (time-range technique markers)
                           ├── Dietary Tags & Cultural Tags
                           ├── Ratings & Comments
                           └── Story (cultural context)
```

---

## User Roles

| Role | What they can do |
|------|-----------------|
| `learner` | Browse, discover, rate, and comment on recipes |
| `cook` | + Create and publish **community** recipes, upload media |
| `expert` | + Create and publish **cultural** recipes (requires cultural story) |
| `admin` | Single account. Reviews expert requests; moderates users, recipes, comments |

**Role inheritance:** learner ⊂ cook ⊂ expert. `admin` is a separate surface.

**Becoming an expert:** Choose `expert` at registration (profile starts as `cook` while the application is pending) or apply later via the app. The single admin account reviews and approves.

---

## API Overview

Full endpoint signatures, DB schema, error codes, and testing patterns live in [`backend/CLAUDE.md`](backend/CLAUDE.md). Swagger UI is available at `/api-docs` on any running backend instance.

- **`/auth`** — register, login, logout, refresh, profile update, expert request submission
- **`/recipes`** — CRUD, publish, rate, comment, media, video annotations, serving-scale
- **`/discovery`** — filtered recipe search, ingredient-based search, location drill-down
- **`/dish-genres`** / **`/dish-varieties`** — cuisine hierarchy
- **`/ingredients`** / **`/tools`** / **`/units`** — autocomplete reference data
- **`/dietary-tags`** / **`/cultural-tags`** — tag catalogues
- **`/media`** — file upload (images ≤ 10 MB, videos ≤ 100 MB)
- **`/parse`** — AI recipe parsing from text, audio, or video; unit standardization
- **`/admin`** — expert-request review, user/recipe/comment moderation
- **`/health`** — health check

---

## Git Conventions

**Branches:** `<area>/<type>_<short-description>` — e.g. `frontend/feature_user-auth`, `backend/fix_rating-crash`. Always branch from `main`;

**Commits:** `<type>(<scope>): <message> (#issue)` — e.g. `feat(backend/discovery): add cultural-tag filter (#312)`. Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`.

**PRs:** `[Area/Type] Description` — e.g. `[Frontend/Feature] Add recipe creation wizard`. Squash on merge, 1+ reviewer required.

---

## Documentation

- **Wiki** (requirements, milestones, team info): https://github.com/bounswe/bounswe2026group10/wiki
- **Design specs:** `docs/design/{web,mobile}/`
- **Backend deep-dive:** `backend/CLAUDE.md`
- **Mobile screen inventory & scenarios:** `mobile/CLAUDE.md`
- **Mobile APK build guide:** `mobile/BUILD.md`
