# 7. My Library

**Priority:** MVP
**Requirements:** 1.3.3

## Purpose
Personal collection: favourited recipes, published recipes, and drafts.

## Features
- **Tab bar** with three tabs:
  - **Favourites:** Recipes the user has bookmarked
  - **Published:** User's own published recipes
  - **Drafts:** Unpublished recipe drafts (Cook/Expert only)
- Each tab shows a list of recipe cards
  - Cards show: thumbnail, title, region tag, rating
  - No difficulty indicators, no time estimates, no "Heirloom" or other content tags
- Tap draft → opens recipe creation flow (page 12) pre-filled with draft data
- Empty state per tab with relevant CTA

## Components
- Tab bar (Favourites | Published | Drafts)
- Recipe card list
- Draft card: title, last edited date, "Continue editing" action
- Empty state per tab

## States
- **Populated:** List of recipes per active tab
- **Empty Favourites:** "No favourites yet — explore recipes and save the ones you love"
- **Empty Drafts:** "No drafts — start creating a recipe!" (Cook/Expert only)
- **Learner view:** Drafts tab hidden

## Navigation
- Recipe card tap → Recipe Detail (page 09)
- Draft tap → Create: Basic Info (page 12) with pre-filled data
