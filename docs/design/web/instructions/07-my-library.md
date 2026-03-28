# 7. My Library (Web)

**Priority:** MVP  
**Requirements:** 1.3.3

**Mobile spec:** [`../mobile/instructions/07-my-library.md`](../mobile/instructions/07-my-library.md)

## Purpose

Favourites, published recipes, and drafts.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md).

## Web layout

- **Narrow:** Tab bar (Favourites | Published | Drafts); vertical recipe list.
- **Wide:** **Tabs** as **horizontal tabs** or **segmented control** under page title; recipe cards in **responsive grid** (2–3 columns).

## Features

- Tabs: **Favourites**, **Published**, **Drafts** (Drafts hidden for Learners)
- Recipe cards: thumbnail, title, region, rating — no difficulty/time/heirloom tags
- Draft tap → Create flow (page 12) pre-filled
- Empty state per tab with CTA

## Components

- **Web:** `MainNav` (active: My Library), tab group, recipe cards

## States

- **Populated:** List/grid per tab
- **Empty Favourites / Published / Drafts:** Per-tab copy (see mobile)
- **Learner:** No Drafts tab

## Navigation

- Recipe card → [`09-recipe-detail.md`](09-recipe-detail.md) (screen 09)
- Draft → [`12-create-basic.md`](12-create-basic.md) (screen 12) pre-filled
