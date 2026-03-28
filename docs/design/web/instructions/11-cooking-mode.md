# 11. Step-by-Step Cooking Mode (Web)

**Priority:** MVP (basic) / FINAL (full)  
**Requirements:** 1.2.1

**Mobile spec:** [`../mobile/instructions/11-cooking-mode.md`](../mobile/instructions/11-cooking-mode.md)

## Purpose

Distraction-free cooking walkthrough with step-by-step navigation.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). Icons: [`play_circle`](../mobile/icons/play_circle.svg), [`format_list_bulleted`](../mobile/icons/format_list_bulleted.svg).

## Web layout

- **Narrow:** Same as mobile — video on top, step card, prev/next, progress, collapsible ingredients.
- **Wide:** **Large video** (16:9 or wider) left or top; **active step** + **step list** in **two columns** (e.g. list left, current step right); optional **picture-in-picture** or sticky mini-video while scrolling. **Fullscreen** button for video common on web.
- **FINAL:** Annotation markers, sync, timers — same behavior as mobile; overlay cards centered on viewport.

## Features

- Video player, step list toggle, active step card, Previous/Next, progress ("Step 2 of 6"), collapsible ingredients reference
- **FINAL (planned):** Seek annotations, bidirectional video–step sync, per-step timer, completion → rate recipe

## What is NOT in current mockup

- No technique overlay card in current mockup; no seek markers on bar (see mobile)

## Navigation

- ← [`09-recipe-detail.md`](09-recipe-detail.md) (screen 09) on exit
- → [`10-comments.md`](10-comments.md) (screen 10) on completion rating prompt
