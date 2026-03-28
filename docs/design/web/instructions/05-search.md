# 5. Search & Browse (Web)

**Priority:** MVP  
**Requirements:** 1.4.1, 1.4.2, 1.4.3, 1.4.4, 1.4.5, 1.4.6, 2.5

**Mobile spec:** [`../mobile/instructions/05-search.md`](../mobile/instructions/05-search.md)

## Purpose

Unified search and browse; browse by genre default; typing activates DishVariety search.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). Filter icon: [`../mobile/icons/tune.svg`](../mobile/icons/tune.svg).

## Web layout

- **Narrow:** Same as mobile — search bar + `tune` opens **modal/sheet** for filters; genre bento grid; results list + sort row.
- **Wide:** Search bar **full width** in content area; **filters:** optional **left sidebar** or **right drawer** (instead of bottom sheet) with allergen, ingredients, region, dietary; **Apply / Clear**; results grid **2 columns**; sort row stays above results.

## Features

- Search bar + `tune` → filter sheet (allergen, ingredients I have, region, dietary)
- Default: **Browse by Genre** bento grid (Soups, Desserts, etc.)
- Active search: query + filter chips; **Sort:** Best Rating | Most Recent | By Region (req 1.2.4)
- Results: DishVariety cards (not single recipes); count heading; dynamic updates (req 1.4.4)

## States

- **Default:** Search + genre grid
- **Search active:** Results + sort + chips
- **No results:** "No dishes found" + adjust filters
- **Loading:** Skeleton cards

## Navigation

- DishVariety card → [`06-dish-variety.md`](06-dish-variety.md) (screen 06)
- Genre card → stays on search with **pre-filtered** results (same as mobile)
