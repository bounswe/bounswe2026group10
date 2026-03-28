# 4. Home / Discover Feed (Web)

**Priority:** MVP  
**Requirements:** 1.2.2, 2.5

**Mobile spec:** [`../mobile/instructions/04-home.md`](../mobile/instructions/04-home.md)

## Purpose

Main landing after login. Curated recipe discovery.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). Recipe cards: terracotta/olive accents per design system.

## Web layout

- **Narrow:** Single column; featured card full width; community picks vertical list; genre row **horizontal scroll** (same as mobile).
- **Wide:** **Primary nav** in header (active: Home). Content in max-width container. **Featured** card can span full content width; **Community picks** as **2–3 column grid**; **Browse by Genre** as horizontal scroll or multi-column grid of genre cards.

## Features

- **Featured recipe card:** Large editorial hero (title, author, region) — no decorative chips on cards
- **Community picks:** Sorted by rating (req 2.5)
- **Browse by Genre:** DishGenre cards; tap genre → Search (page 05) **pre-filtered**
- **Web:** Pull-to-refresh on touch; on desktop use **Refresh** control or auto-refresh on focus (optional)
- Recipe card tap → Recipe Detail (page 09)
- Section headers with "See All" where applicable

## Components

- **Web:** `MainNav` (active Home), `RecipeCard`, `GenreCard`, section headers

## States

- **Default:** Populated feed
- **Loading:** Skeleton placeholders
- **Empty:** "No recipes yet" + explore/create prompt
- **Error:** Retry banner

## Navigation

- → [`09-recipe-detail.md`](09-recipe-detail.md) (screen 09) on recipe tap
- → [`05-search.md`](05-search.md) (screen 05) on genre tap (pre-filtered)
- → [`16-other-profile.md`](16-other-profile.md) (screen 16) on author tap
