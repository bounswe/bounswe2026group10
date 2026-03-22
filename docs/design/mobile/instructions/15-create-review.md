# 15. Create: Review & Publish

**Priority:** MVP
**Requirements:** 1.3.3, 1.3.4

## Purpose
Final step of recipe creation. Preview the full recipe before publishing or saving as draft.

## Features
- **Progress:** "Step 4 of 4" pill badge, centered
- **Recipe title** centered in large Newsreader serif
- **Metadata row:** Genre, variety, region — centered, italic
- **Full recipe preview:**
  - Ingredients with quantities and units
  - Tools list
  - Steps (numbered with titles, descriptions, and photos per step)
  - Story
  - Allergen and dietary tags
- **"Publish" button** → publishes recipe (req 1.3.4)
- **"Save as Draft" button** → saves to drafts (req 1.3.3)

## What is NOT shown
- No difficulty indicator
- No calorie count

## States
- **Default:** Full preview rendered
- **Publishing:** Loading indicator
- **Publish success:** Toast + redirect to Recipe Detail
- **Publish error:** Error banner with retry

## Navigation
- → Recipe Detail (page 9) on publish success
- → My Library / Drafts (page 7) on save draft
- ← Create: Steps (page 15) on "Back"
