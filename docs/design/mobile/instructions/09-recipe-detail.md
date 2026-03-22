# 9. Recipe Detail

**Priority:** MVP
**Requirements:** 1.2.1, 1.2.2, 1.2.3, 1.5.1, 1.5.2, 2.2, 2.3

## Purpose
Full recipe view — the most feature-rich page in the app.

## Features

### Header
- Recipe title (Newsreader serif, large)
- Author name (tappable → Other User Profile page 19)
- Recipe type badge: COMMUNITY or CULTURAL
- Average rating (stars) + rating count
- Region tag
- Favourite/bookmark toggle button
- Share button

### Media
- Hero image
- "Start Cooking Mode" button → Cooking Mode (page 11)

### Ingredients (req 1.2.1, 1.2.3, 2.3)
- **Serving size adjuster:** Inline +/− control with "4 Servings" display (req 1.2.3, 2.2)
  - Dynamically recalculates ingredient quantities on change
- **Ingredient list:** Each row shows quantity + unit + name
- **Substitute button** per ingredient — `swap_horiz` icon + "Substitute" label (req 2.3)
  - Tapping opens substitution suggestions for that ingredient

### Tools (req 1.2.1)
- List of required kitchen tools (generic `skillet` icon)

### Steps (req 1.2.1)
- Numbered step list with descriptions
- Optional photo per step

### Story (req 1.2.1)
- Cultural or personal story section
- Displayed in a bordered card with serif italic text

### Interaction
- "View all comments" → Comments & Ratings (page 10)
- Rating stars visible on page (req 1.5.1)

### Alternative Versions (req 1.2.2)
- Other recipe cards for the same DishVariety

## What is NOT shown
- No calorie badge
- No difficulty indicator
- No video annotations (handled in Cooking Mode, page 11)

## Navigation
- → Cooking Mode (page 11) on "Start Cooking Mode"
- → Comments & Ratings (page 10) on "View all"
- → Other User Profile (page 19) on author tap
