# 6. Dish Variety Detail (Web)

**Priority:** MVP  
**Requirements:** 1.2.2, 1.2.4, 2.5

**Mobile spec:** [`../mobile/instructions/06-dish-variety.md`](../mobile/instructions/06-dish-variety.md)

## Purpose

Landing for one DishVariety: context + all recipes for that variety.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md).

## Web layout

- **Narrow:** Single column; hero on top; about text; vertical recipe list.
- **Wide:** **Primary nav** visible. **Hero** may be wide aspect ratio; **About** + **Recipes** can use **two columns** (about left, recipe grid right) or single column with **recipe grid 2–3 columns**.

## Features

- Header: variety name, region tag, hero image
- **About This Dish:** cultural/historical text
- **Recipes:** cards with title, author, region, COMMUNITY/CULTURAL badge, thumbnail; no difficulty/time on cards
- **"Add a recipe" CTA** → Create Basic Info (page 12)
- Sort: handled in Search (page 05), not on this screen (per mobile spec)

## Components

- Hero with overlay header; about section; recipe card grid/list

## States

- **Default:** Description + recipe list
- **No recipes:** "No recipes yet for this dish — be the first to add one!"
- **Loading:** Skeleton cards

## Navigation

- Recipe card → [`09-recipe-detail.md`](09-recipe-detail.md) (screen 09)
- Author → [`16-other-profile.md`](16-other-profile.md) (screen 16)
- "Add a recipe" → [`12-create-basic.md`](12-create-basic.md) (screen 12)
- ← Back to [`05-search.md`](05-search.md) (05) or [`04-home.md`](04-home.md) (04)
