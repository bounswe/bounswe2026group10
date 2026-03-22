# 6. Dish Variety Detail

**Priority:** MVP
**Requirements:** 1.2.2, 1.2.4, 2.5

## Purpose
Landing page for a specific DishVariety. Shows cultural/historical context and all user-submitted recipes for that dish.

## Features

### Header
- Dish variety name (e.g., "Adana Kebap")
- Region tag (e.g., "Adana Region")
- Hero image

### About This Dish
- Cultural/historical description of the variety
- Origin story or regional significance

### Recipes Section
- **Recipe cards:** All user-submitted recipes for this variety
  - Each card: title, author, region tag, recipe type badge (COMMUNITY / CULTURAL), thumbnail
  - No difficulty indicators on cards
  - No time estimates on cards
- **"Add a recipe" CTA** → Create: Basic Info (page 12)
- Note: Recipe type filter tabs (All | Community | Cultural) are not shown in current mockup
- Note: Sort bar not shown in current mockup — sort is handled in Search Results (page 05)

## Components
- Hero image with overlay header
- About text section
- Recipe card list

## States
- **Default:** Description + recipe list
- **No recipes yet:** "No recipes yet for this dish — be the first to add one!"
- **Loading:** Skeleton cards

## Navigation
- Recipe card tap → Recipe Detail (page 09)
- Author tap → Other User Profile (page 16)
- "Add a recipe" CTA → Create: Basic Info (page 12)
- ← Back to Search (page 05) or Home (page 04)
