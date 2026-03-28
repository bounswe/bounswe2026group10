# 9. Recipe Detail (Web)

**Priority:** MVP  
**Requirements:** 1.2.1, 1.2.2, 1.2.3, 1.5.1, 1.5.2, 2.2, 2.3

**Mobile spec:** [`../mobile/instructions/09-recipe-detail.md`](../mobile/instructions/09-recipe-detail.md)

## Purpose

Full recipe view — primary feature-rich page.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). Icons: [`swap_horiz`](../mobile/icons/swap_horiz.svg), [`skillet`](../mobile/icons/skillet.svg).

## Web layout

- **Narrow:** Single column; hero on top; stacked sections (ingredients, tools, steps, story, alternatives).
- **Wide:** **Two-column layout:** **Left:** hero image + title + meta + actions (bookmark, share, cooking mode). **Right:** sticky **ingredients + tools** OR **story + steps** — designer choice; common pattern is **main column** for steps/story + **sidebar** for ingredients/serving adjuster. Alternative versions as **horizontal scroll** or **grid** below.

## Features

- Header: title (Newsreader), author (→ page 16), COMMUNITY/CULTURAL badge, rating, region, favourite, share
- Hero image; **Start Cooking Mode** → page 11
- **Serving adjuster** + ingredient list + **Substitute** per ingredient (req 2.3)
- Tools list; numbered steps + optional step photos
- Story card (serif italic)
- **View all comments** → page 10
- **Alternative versions** (same DishVariety)

## What is NOT shown

- No calorie badge; no difficulty; no video annotations in detail (video in Cooking Mode, page 11)

## Navigation

- → [`11-cooking-mode.md`](11-cooking-mode.md) (screen 11)
- → [`10-comments.md`](10-comments.md) (screen 10)
- → [`16-other-profile.md`](16-other-profile.md) (screen 16) on author tap
