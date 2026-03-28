# 10. Comments & Ratings (Web)

**Priority:** MVP  
**Requirements:** 1.5.1, 1.5.2

**Mobile spec:** [`../mobile/instructions/10-comments.md`](../mobile/instructions/10-comments.md)

## Purpose

Full ratings and comments for a recipe.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md).

## Web layout

- **Narrow:** Single column; summary on top; scrollable comments; sticky comment input at bottom.
- **Wide:** **Optional split:** **Left** (or top): rating summary + distribution chart + your stars. **Right:** comment thread with **wider** composer (not only bottom bar); composer can sit **below** summary or **fixed** at bottom of viewport.

## Features

- Rating summary: average, distribution (5★–1★), total count
- **Your rating:** Star input (req 1.5.1)
- Comments: author avatar, name, date, text; author tap → Other User Profile (page 16)
- **Add comment:** text + submit (req 1.5.2)
- **Web:** Keyboard submit (Enter + modifier) for accessibility

## Components

- Rating summary card; star input; comment list; composer

## States

- **Default:** Summary + list
- **No comments:** "Be the first to comment!"
- **No rating yet:** Prompt to rate
- **Loading:** Skeleton comments
- **Guest:** Login prompt for actions

## Navigation

- → [`16-other-profile.md`](16-other-profile.md) (screen 16) on author tap
- ← Back to [`09-recipe-detail.md`](09-recipe-detail.md) (screen 09)
