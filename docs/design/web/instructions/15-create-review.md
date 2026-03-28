# 15. Create: Review & Publish (Web)

**Priority:** MVP  
**Requirements:** 1.3.3, 1.3.4

**Mobile spec:** [`../mobile/instructions/15-create-review.md`](../mobile/instructions/15-create-review.md)

## Purpose

Final step: preview full recipe; publish or save draft.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md).

## Web layout

- **Narrow:** Single column scroll; title + metadata + preview; Publish / Save at bottom.
- **Wide:** **Stepper** shows step 4 complete. **Preview** uses **readable max-width** (~720px) centered; **Publish** / **Save as Draft** as **primary/secondary** in toolbar or sticky footer.

## Features

- "Step 4 of 4" badge; title (Newsreader); metadata (genre, variety, region)
- Full preview: ingredients, tools, steps with photos, story, tags
- **Publish** (req 1.3.4); **Save as Draft** (req 1.3.3)

## What is NOT shown

- No difficulty; no calories

## States

- **Default:** Preview rendered
- **Publishing:** Loading
- **Success:** Toast + redirect to Recipe Detail or draft library
- **Error:** Banner + retry

## Navigation

- → [`09-recipe-detail.md`](09-recipe-detail.md) (screen 09) on publish success
- → [`07-my-library.md`](07-my-library.md) (screen 07) on save draft
- ← [`14-create-steps.md`](14-create-steps.md) (screen 14) on Back
