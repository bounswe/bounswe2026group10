# 5. Search & Browse

**Priority:** MVP
**Requirements:** 1.4.1, 1.4.2, 1.4.3, 1.4.4, 1.4.5, 1.4.6, 2.5

## Purpose
Unified search and browse experience. Default state shows genre browsing; typing activates search showing DishVariety results.

## Default State (05-search-generic)
- **Search bar** with a `tune` filter icon button on the right
  - Tapping `tune` → opens filter sheet (allergen, ingredients, region, dietary)
- **Browse by Genre:** Bento grid of DishGenre cards (Soups, Desserts, Pastries, Salads, Stews)
  - Tapping a genre → filters results to that genre

## Filter Sheet (via tune button) (req 1.4.1, 1.4.2, 1.4.3, 1.4.5, 1.4.6)
- **Allergen filter:** Multi-select; excludes varieties containing selected allergens
- **Ingredients I have:** Multi-select; shows varieties makeable with those ingredients
- **Region filter:** Country/region selector
- **Dietary tags:** Vegan, vegetarian, halal, kosher, gluten-free, etc.
- "Apply" and "Clear All" buttons

## Active Search / Results State (05-search-refined)
- Search bar with active query and active filter chips below (dismissable per chip)
- **Sort row:** Best Rating | Most Recent | By Region (req 1.2.4)
  - Active sort highlighted in primary color
- **Results count heading** (e.g., "6 Results for 'kebap'")
- **DishVariety cards** (not individual recipes):
  - Each card: variety name, region tag, short description, bookmark icon
- Dynamic updates as query/filters change (req 1.4.4)

## States
- **Default:** Search bar + genre bento grid
- **Search active:** DishVariety result cards + sort row + active filter chips
- **No results:** "No dishes found" with suggestion to adjust filters
- **Loading:** Skeleton cards

## Navigation
- DishVariety card tap → Dish Variety Detail (page 06)
- Genre card tap → pre-filtered results (stays on search)
- Filter sheet → inline modal
