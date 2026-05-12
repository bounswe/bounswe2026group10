# Final MVP Demo — Roots & Recipes

**Audience:** CMPE354 course presentation
**Duration:** ~7–10 minutes
**Format:** Live walkthrough on the deployed frontend, narrated in EN
**Goal:** Show how Roots & Recipes turns spoken family knowledge into shareable cultural recipes — and how the platform links food traditions across cultures.

**Quick links during demo:**
- `/create-recipe` — wizard with voice upload
- `/discovery` — genre + cultural-tag filtering
- `/recipes/:id` — recipe detail (story, locale-aware units, substitutions)
- Backend: `POST /parse/recipe-audio`, `POST /allergens/detect`, `GET /ingredients/:id/substitutions`

> **Scope note:** automatic video annotation is **out of scope** for this demo. Video annotations exist as a manual CRUD feature (`POST /recipes/:id/annotations`) but auto-generation from transcript timing is not being shown.

---

## 1. Demo-day prep TODO list

### Environment
- [ ] Backend running against staging Supabase with ElevenLabs + Gemini + DeepL keys live
- [ ] Frontend pointed at the same backend (check `VITE_API_BASE_URL`)
- [ ] Demo user accounts pre-created: one `cook` (Japan persona — "Sora"), one read-only viewer for backup
- [ ] Browser zoomed and font sized for projector; cache cleared; ad-blockers off
- [ ] Language toggle defaulted to EN at start of demo
- [ ] Network is stable; mobile hotspot ready as backup

### Seed content (the demo depends on these existing in the DB)
- [ ] Cultural tags exist: `social-gathering`, `sıra-gecesi`, `mochitsuki` (seeded via `004_cultural_tags.sql`)
- [ ] Genre **Desserts** exists with variety **Mochi**
- [ ] Genre **Soups** exists with a Japanese variety usable for the live creation (e.g. **Miso Soup** or **Tonjiru**)
- [ ] Seed **Mochi** recipe
  - `story` field describing the mochitsuki / social-gathering ritual
  - Tagged `social-gathering` + `mochitsuki`
  - **Ingredients authored in local Japanese units** (e.g. `2 gō` of mochigome rice, `1 shaku` of water)
  - Turkish-side translations in `recipe_ingredient_translations` resolve the same rows to **grams / ml** — assumed implemented; verify on `main` before demo
- [ ] Seed **Çiğ köfte** recipe
  - `story` field describing **sıra gecesi**
  - Tagged `social-gathering` + `sıra-gecesi`
  - **Sumak** present in the ingredients
- [ ] Seed ingredient substitution: **sumak → lemon zest + salt** in `ingredient_substitutions`
  - Realistic `source_amount`/`source_unit` and `sub_amount`/`sub_unit` so scaling looks natural
  - Non-trivial `confidence` and `description`

### Demo asset
- [ ] Pre-recorded ~30-sec voice file describing the **miso soup** recipe (script in §5.1 below), in clear English
- [ ] Backup recording on a second device in case mic / laptop audio fails

### Features to verify on `main` before demo
- [x] `POST /parse/recipe-audio` returns parsed `recipe { title, ingredients, steps, tools }` — confirmed implemented
- [x] `POST /allergens/detect` auto-suggests allergens from ingredient IDs — confirmed (wizard fires it on Step 2 → Step 3 transition)
- [ ] Recipe-detail tags are **clickable** and route to `/discovery?culturalTagIds=…` — assumed; if not, presenter manually navigates back to Discovery and re-applies the filter
- [x] Substitution modal in recipe detail loads from `GET /ingredients/:id/substitutions` — confirmed UI exists
- [x] Discovery filter accepts `culturalTagIds` and renders matching recipes — confirmed
- [ ] Recipe-detail ingredients display **locale-aware units** when language toggles (Japanese `gō` → grams under TR) — assumed; verify before demo, else narrate as "the Turkish translation row carries metric units"

### Rehearsal
- [ ] Full dry-run on the actual demo machine, end-to-end, ≤10 min
- [ ] Backup screenshots of every step in case a live API call hiccups
- [ ] Presenter has a fallback narration if any step is slow ("while this transcribes, here's what the backend is doing…")

---

## 2. Script — Part 1: "Sora cooks Japanese miso soup from a voice memo"

**Persona:** Sora, a `cook` user who loves Japanese cuisine and wants to share a family soup recipe she's been making since childhood.

**Scene:** From the home page, Sora clicks **Create Recipe**. On Step 1 of the wizard, she picks **Japanese** cuisine, selects **Soups → Miso Soup** as the variety, and uploads a voice memo describing the recipe.

**What the audience sees:**
1. The voice file uploads. The frontend calls `POST /parse/recipe-audio`; the backend transcribes via ElevenLabs Scribe and parses the transcript with Gemini, returning structured `{ title, ingredients, steps, tools }`.
2. The wizard auto-populates Step 2 (Ingredients) with catalog-matched items — `miso paste`, `dashi`, `tofu`, `wakame`, `green onion`. Any unmatched ingredient is flagged for review with a chip the user can edit or accept.
3. Sora advances to Step 3. The wizard fires `POST /allergens/detect` with the ingredient IDs; the page surfaces **soy** as an auto-detected allergen and pre-checks it. Sora can add or remove allergens manually if she disagrees.
4. Sora reviews the parsed steps and tools, fills in the `story` field with a sentence about her grandmother's miso soup, and saves as a draft.

**Features shown off:**
- Voice-to-recipe parsing (ElevenLabs Scribe + Gemini)
- Automatic allergen detection from ingredient catalog
- Auto-populated wizard from a single audio upload (no manual typing)

**Presenter notes:**
- Keep the voice file short — 20–30 seconds max.
- If the transcribe call is slow, narrate while it runs: *"ElevenLabs Scribe is transcribing the audio — usually about three seconds — and then Gemini is structuring the text into ingredients and steps."*
- Don't actually publish the recipe during the demo (save as draft); we don't want test data polluting the public discovery feed.

---

## 3. Script — Part 2: "Dessert after dinner — discovering mochi"

**Persona:** Same user — Sora finished cooking her miso soup and wants something sweet to round off the meal.

**Scene:** Sora clicks **Discovery** in the top nav. She filters **Genre → Desserts**, scrolls through the cards, and opens **Mochi**.

**What the audience sees:**
1. Discovery renders dessert cards (mochi visible with hero image and average rating).
2. Recipe-detail page for mochi: ingredients, steps, video — and prominently, a **cultural story** lede explaining **mochitsuki**: how pounding mochi together with mallets has been a communal New-Year and celebration ritual in Japan for centuries.
3. Tags surface under the story: `social-gathering`, `mochitsuki`.
4. **Locale-aware units moment:** the ingredients render in their authored Japanese units (e.g. `2 gō` of mochigome rice). Sora flips the language toggle in the header **EN → TR**. The page re-renders, and the same ingredient row now reads `~300 g`, with the rest of the recipe localized. Emphasize: *one source recipe, displayed in the unit system that fits the viewer's locale — not a separate manually-converted recipe.*

**Features shown off:**
- Genre browsing via Discovery
- Recipe-detail story field as a first-class cultural anchor
- Cultural tags surfaced as chips, not buried metadata
- Locale-aware ingredient unit translation via `recipe_ingredient_translations`

**Presenter notes:**
- Linger on the story for a few seconds — it's the emotional anchor that justifies the jump in Part 3.
- Toggle EN↔TR once, smoothly. Don't toggle back and forth (looks janky on projector).
- If the conversion is mid-load, narrate: *"the backend looked up the Turkish translation row, which carries metric units for the same quantity — same recipe, viewer-local units."*

---

## 4. Script — Part 3: "From mochi to çiğ köfte — culture jumps countries, and sumak is missing"

**Scene:** Sora taps the `social-gathering` tag chip on the mochi page.

**What the audience sees:**
1. Discovery re-renders, filtered by `culturalTagIds=<social-gathering>`. The mochi recipe is there — but so is a Turkish **çiğ köfte** recipe she's never seen.
2. Sora opens çiğ köfte. The recipe-detail story explains **sıra gecesi** — a southeastern-Anatolian musical gathering where friends sit in a circle, music plays, and çiğ köfte is the centerpiece dish everyone helps prepare.
3. Sora scrolls to ingredients. She doesn't have **sumak**. She taps the substitution icon next to the sumak row ("I don't have this").
4. A modal opens, calling `GET /ingredients/:id/substitutions?amount=…&unit=…`. It shows the suggested substitute — **lemon zest + salt** — with the amount already scaled to the recipe's sumak quantity (e.g. *1 tsp sumak → 1 tsp lemon zest + ½ tsp salt*) and a confidence indicator with a short rationale.

**Features shown off:**
- Tag-driven **cross-cultural discovery**: Japan → Turkey via a shared "social-gathering" theme
- Per-ingredient substitution UI with `amount` / `unit` scaling
- Cultural story field doing double duty as an education layer

**Closing line:**
> "One person's mochi night is another person's sıra gecesi — and the platform helps you cook either, even when your pantry doesn't fully match."

---

## 5. Recipe content for seeding

Paste-ready content for the three recipes referenced in the script. Recipe 1 (miso soup) is created **live during the demo** via voice — the script below is what the presenter should record into the voice memo. Recipes 2 (mochi) and 3 (çiğ köfte) are **pre-seeded** before the demo so they appear in Discovery.

---

### 5.1 Recipe 1 — Miso Soup (live voice creation)

> **Read this aloud into the voice memo.** ~25 seconds at a calm pace. Pause briefly between ingredients and between steps so the transcript stays clean.

> "This is a simple Japanese miso soup. The ingredients are: one tablespoon of miso paste, four cups of dashi, one block of soft tofu cut into cubes, one tablespoon of dried wakame seaweed, and two green onions, thinly sliced.
>
> Step one: bring the dashi to a gentle simmer in a small pot. Do not let it boil.
> Step two: add the wakame and the tofu, and simmer for two minutes.
> Step three: turn off the heat, whisk the miso paste into a small ladle of the broth until it dissolves, then stir it back into the pot. Top with the green onions and serve immediately."

**Expected parsed output** (what the wizard should auto-populate):
- **Title:** Miso Soup
- **Ingredients:** miso paste (1 tbsp), dashi (4 cups), soft tofu (1 block), dried wakame (1 tbsp), green onions (2)
- **Tools:** small pot, ladle, whisk
- **Steps:** 3 steps as narrated
- **Auto-detected allergen:** soy (from miso paste + tofu)

**Manually filled by Sora during the demo** (after parsing):
- **Genre / Variety:** Soups → Miso Soup
- **Type:** community
- **Country / City:** Japan / Tokyo
- **Serving size:** 2
- **Story (one line):** "My grandmother's weekday miso soup — the version she taught me before I left home."
- **Save as draft** (do not publish during demo)

---

### 5.2 Recipe 2 — Mochi (pre-seed before demo)

**Core fields:**
- **Title:** Mochi
- **Type:** `cultural` (requires an `expert` account or admin-seeded)
- **Genre / Variety:** Desserts → Mochi
- **Country / City:** Japan / Kyoto
- **Serving size:** 8
- **Cultural tags:** `social-gathering`, `mochitsuki`
- **Dietary tags:** vegan, vegetarian, gluten-free
- **Allergens:** none
- **Cover image:** any CC-licensed mochi photo (steamed white rice cake on a tray)

**Story field** (paste verbatim):

> Mochi is more than a chewy rice cake — in Japan it is the heartbeat of **mochitsuki**, the New Year pounding ceremony. Steamed glutinous rice is dropped into a heavy wooden mortar called an *usu*, and two people work together: one pounds with a wooden mallet (*kine*), the other reaches in between strikes to fold and turn the rice, the timing built on trust. A village, a temple yard, or a single family kitchen — every year, mochitsuki turns rice into something soft and shared. The mochi you eat the next morning carries the memory of the people who made it with you.

**Ingredients (authored in Japanese units; TR translation row gives metric):**

| # | Ingredient | EN quantity / unit | TR translation (quantity / unit) |
|---|---|---|---|
| 1 | mochigome (glutinous rice) | `2 gō` | `300 g` |
| 2 | water (for steaming) | `1 shaku` | `180 ml` |
| 3 | katakuriko (potato starch, for dusting) | `2 tbsp` | `15 g` |
| 4 | salt | `1 pinch` | `1 tutam` |

> Seed the EN row in `recipe_ingredients`. Add the TR row in `recipe_ingredient_translations` carrying the **localized quantity + unit** for the same ingredient.

**Steps:**

1. Soak the mochigome in cold water overnight (at least 8 hours). Drain thoroughly.
2. Steam the soaked rice in a bamboo or metal steamer over high heat for 40 minutes, until the grains are translucent and tender enough to crush between your fingers.
3. Transfer the hot rice immediately into a wooden mortar (*usu*) — or a large heavy bowl if you don't have one. Sprinkle with the pinch of salt.
4. Begin pounding with a wooden mallet. One person folds the rice toward the center between every strike. Pound until the grains disappear and the mass becomes smooth, glossy, and elastic — about 15 minutes.
5. Dust a clean surface generously with katakuriko. Tear the warm mochi into golf-ball-sized pieces, dust each one, and shape into smooth rounds. Serve fresh while soft, or let cool for grilling later.

**Tools:** bamboo steamer, wooden mortar (usu), wooden mallet (kine), large mixing bowl, clean cloth

**Video:** any short CC-licensed mochitsuki clip (~30 sec) or leave `video_url` null and rely on the cover image.

---

### 5.3 Recipe 3 — Çiğ Köfte (pre-seed before demo)

**Core fields:**
- **Title:** Çiğ Köfte
- **Type:** `cultural`
- **Genre / Variety:** Mezes (or Starters) → Çiğ Köfte — create the variety if it doesn't exist
- **Country / City:** Turkey / Şanlıurfa
- **Serving size:** 6
- **Cultural tags:** `social-gathering`, `sıra-gecesi`
- **Dietary tags:** vegan, vegetarian (modern meatless version)
- **Allergens:** gluten (from bulgur)
- **Cover image:** any CC-licensed çiğ köfte plate photo (red bulgur patties on lettuce with lemon)

**Story field** (paste verbatim):

> In southeastern Anatolia, especially in Şanlıurfa and Adıyaman, **sıra gecesi** — literally "turn night" — is a rotating evening where a circle of friends meets at one host's home each week, takes their turn the next week, and so on through the season. The night is built on three things: *bağlama* music with mournful long-melody *uzun hava* singing, conversation that drifts from politics to poetry, and **çiğ köfte** kneaded by hand at the center of the table. Traditionally the kneading itself was the show — one person working the bulgur, pepper paste, onion, and spices into a single dense mass for nearly an hour while everyone watched. The meatless version that traveled to the rest of Türkiye keeps the ritual: you don't really make çiğ köfte alone, you make it together.

**Ingredients:**

| # | Ingredient | Quantity | Unit |
|---|---|---|---|
| 1 | fine bulgur (köftelik bulgur) | 2 | cups |
| 2 | tomato paste | 2 | tbsp |
| 3 | red pepper paste (biber salçası) | 3 | tbsp |
| 4 | onion, grated | 1 | medium |
| 5 | garlic, minced | 3 | cloves |
| 6 | ground cumin | 1 | tsp |
| 7 | isot pepper (Urfa biber) | 2 | tbsp |
| 8 | **sumak (sumac)** | 1 | tbsp |
| 9 | fresh parsley, finely chopped | ½ | cup |
| 10 | lemon juice | 2 | tbsp |
| 11 | olive oil | 3 | tbsp |
| 12 | salt | 1 | tsp |

> The substitution demo targets **row 8 (sumak)**. Make sure the ingredient catalog has `sumak` / `sumac` as a known ingredient before seeding.

**Steps:**

1. Rinse the fine bulgur briefly under cold water, drain, and let it sit covered in a bowl for 15 minutes so it softens slightly.
2. Add the tomato paste, red pepper paste, grated onion, minced garlic, cumin, isot pepper, sumak, and salt to the bulgur. Begin kneading firmly with one hand.
3. Knead for at least 20 minutes — ideally 40 — pressing and folding until the mixture turns deep red, glossy, and holds together when pressed in your fist.
4. Add the chopped parsley, lemon juice, and olive oil. Knead another 2 minutes to incorporate.
5. Shape into small oval patties by squeezing a heaped tablespoon of the mixture inside your closed fist. Serve on a bed of lettuce leaves with lemon wedges and pickled vegetables. Eat by wrapping each köfte in a lettuce leaf.

**Tools:** large mixing bowl, fine grater, lemon juicer, serving platter

**Video:** optional — a short çiğ köfte kneading clip works well.

---

### 5.4 Substitution row — sumak → lemon zest + salt

Pre-seed this row in `ingredient_substitutions` so the modal in Part 3 has data:

| Field | Value |
|---|---|
| `ingredient_id` | id of `sumak` / `sumac` |
| `substitute_id` | id of `lemon zest` (create as a dedicated ingredient if it doesn't exist; **do not** point at plain `lemon`) |
| `source_amount` | `1` |
| `source_unit` | `tsp` |
| `sub_amount` | `1` |
| `sub_unit` | `tsp` |
| `confidence` | `0.85` |
| `description` | "Lemon zest mimics sumak's bright, sour-citrus tang. Add a small pinch of salt alongside to bring out the same savory depth — sumak is naturally a little salty from its dried-berry character." |

Optional second substitution for richer demo (only if time allows):

| Field | Value |
|---|---|
| `ingredient_id` | id of `sumak` |
| `substitute_id` | id of `pomegranate molasses` |
| `source_amount` | `1` |
| `source_unit` | `tsp` |
| `sub_amount` | `½` |
| `sub_unit` | `tsp` |
| `confidence` | `0.70` |
| `description` | "Pomegranate molasses brings a deeper, sweeter sourness — closer in flavor profile to how sumak works in southeastern Anatolian dishes, though sweeter." |

Expected scaled output when the modal opens against the çiğ köfte recipe (which uses `1 tbsp ≈ 3 tsp` of sumak): substitute amount renders as `3 tsp lemon zest` (3× scaled from the 1-tsp base row).

---

## 6. Appendix

### Fallback paths if something misbehaves
- **Voice transcribe times out:** fall back to a pre-seeded miso soup recipe; open it in a new tab and narrate "this is what the wizard would produce after parsing."
- **Tag chip isn't clickable yet:** click the browser back button to Discovery, manually apply the `social-gathering` cultural tag filter, then open çiğ köfte.
- **Substitution modal returns empty:** ensure the seed substitution row exists; otherwise open Postman / a second tab with the pre-recorded API response.
- **Language toggle doesn't convert units:** narrate as "in the merged version this row converts to grams — let me show the merged backend response in a separate tab" and fall back to a screenshot.

### Presenter hotkeys
- `Cmd+Shift+R` — hard reload (clear stale auth state)
- `Cmd+Plus` / `Cmd+Minus` — projector zoom
- `Cmd+T` — new tab for fallback screenshots / API responses

### Q&A talking points
- **i18n:** all user-visible strings live in `frontend/src/locales/{en,tr}/common.json`; recipe content translation goes through DeepL EN↔TR on create/update/publish.
- **Roles:** `learner → cook → expert` with admin as a separate moderation surface. Cultural recipes need `expert`; community recipes (like Sora's soup) need `cook`.
- **Moderation:** admin reviews expert requests and can delete any recipe / comment via `/admin/*` routes.
- **Data privacy:** voice files are sent to ElevenLabs for transcription and discarded; we store the parsed recipe, not the audio.
