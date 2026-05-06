# Cultural Tagging

## Purpose
Each recipe carries a *Story* describing its cultural or personal context. Cultural tagging lets contributors label that story with one or more **cultural-event tags** (e.g. *wedding*, *funeral*, *new-year*, *sıra gecesi*, *social gathering*) so that other users can discover recipes through the lens of the occasions they're tied to. The intent is to surface food heritage by *event*, not just by ingredient or geography.

## Tag Taxonomy
Tags are drawn from a **curated, translatable taxonomy** — not free-form text. This keeps filtering consistent and makes EN/TR (and future locales) trivial.

Initial tag pool (illustrative, not exhaustive):

| Tag key            | EN label              | TR label             | Typical regions      |
|--------------------|-----------------------|----------------------|----------------------|
| `wedding`          | Wedding               | Düğün                | global               |
| `funeral`          | Funeral / Mourning    | Cenaze / Yas         | global               |
| `birth`            | Birth / Newborn       | Doğum                | global               |
| `new-year`         | New Year              | Yılbaşı              | global               |
| `harvest`          | Harvest               | Hasat                | global               |
| `religious-feast`  | Religious Feast       | Dini Bayram          | global               |
| `social-gathering` | Social Gathering      | Sosyal Toplantı      | global               |
| `sira-gecesi`      | Sıra Gecesi           | Sıra Gecesi          | Turkey (Şanlıurfa)   |
| `mochitsuki`       | Mochitsuki            | Mochitsuki           | Japan                |
| `iftar`            | Iftar                 | İftar                | MENA, Turkey         |

Each tag has an optional **region scope**. A tag with no region is considered global and shown for any region.

## Data Model (sketch — not implemented in this ticket)
- `cultural_tags` — `id`, `key`, `default_label`, `region_id` (nullable FK)
- `cultural_tag_translations` — `tag_id`, `locale`, `label`
- `recipe_cultural_tags` — `recipe_id`, `tag_id` (composite PK)

## Cascade Filter Rule
When the user filters by tag *X* in the navigator, the system returns:

1. every **Recipe** with tag *X*
2. every **DishVariety** that has at least one recipe with tag *X*
3. every **DishGenre** that has at least one such variety

The same cascade is reused if the user combines a tag filter with region, dietary, or genre filters — tag filtering is just another predicate ANDed onto existing search.

## Region Scoping in the Navigator
The cultural-tag filter in the search filter sheet is **region-scoped**. When the user picks a region, the cultural-tag chip list re-renders to show only tags whose `region_id` matches the chosen region (plus global tags). With no region selected, all tags are shown.

This guides discovery — picking *Turkey* surfaces *sıra gecesi* and *düğün*; picking *Japan* surfaces *mochitsuki*.

## Affected Mobile Screens
- **Recipe Detail (09)** — chips rendered under the Story section; tapping a chip opens the navigator pre-filtered by that tag and the recipe's region.
- **Create: Basic Info (12)** — chip selector below the Story textarea; required for *Cultural* recipe type.
- **Create: Review & Publish (15)** — chips shown in the preview's Story block.
- **Search & Browse (05)** — cultural-tag filter inside the filter sheet; active-filter chips shown above results.

## Out of Scope (this ticket)
- Backend implementation (schema migrations, endpoints, indexing)
- Web frontend changes
- Free-form tag entry / user-suggested tags
- Tag moderation tooling
