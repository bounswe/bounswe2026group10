# 4. Home / Discover Feed

**Priority:** MVP
**Requirements:** 1.2.2, 2.5

## Purpose
Main landing screen after login. Curated recipe discovery.

## Features
- **Featured recipe card:** Large dark editorial card with hero image, recipe title, author, region
  - No tags/chips on cards (no "Anatolian Highlands", "Family Secret" etc.)
- **Community picks section:** Recipe cards sorted by rating (req 2.5)
- **Browse by Genre:** Horizontal scrollable genre cards (DishGenre)
  - Tapping a genre → Search & Browse (page 05) filtered by that genre
  - Note: Kebaps genre card removed — only generic genre categories shown
- Pull-to-refresh for latest content
- Tapping any recipe card → Recipe Detail (page 09)

## Components
- Recipe card: thumbnail, title, dish variety, average rating, author name, region tag
- Genre card: genre name, image
- Section headers with "See All" links

## States
- **Default:** Populated feed
- **Loading:** Skeleton placeholders
- **Empty:** "No recipes yet" with prompt to explore or create
- **Error:** Retry banner

## Navigation
- → Recipe Detail (page 09) on recipe tap
- → Search & Browse (page 05) on genre tap (pre-filtered)
- → Other User Profile (page 16) on author name tap
