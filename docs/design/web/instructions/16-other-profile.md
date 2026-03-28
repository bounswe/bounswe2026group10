# 16. Other User Profile (Web)

**Priority:** FINAL  
**Requirements:** 2.1

**Mobile spec:** [`../mobile/instructions/16-other-profile.md`](../mobile/instructions/16-other-profile.md)

## Purpose

View another user's public profile and published recipes.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). Same header pattern as own profile (gradient avatar).

## Web layout

- **Narrow:** Same as mobile — header, stats, follow/message, vertical recipe list.
- **Wide:** **Primary nav** optional (context: arrived from deep link). **Header** + stats in **wide row**; **recipe grid** 3–4 columns.

## Features

- Avatar, full name, role, region, member since
- Stats: published count, average rating
- Published recipes — cards without difficulty/time
- **Follow**; **Send Message** → Chat (page 20)

## What is NOT shown

- No difficulty labels on cards; no list/grid toggle (per mobile)

## States

- **Default:** Loaded with recipes
- **No recipes:** Empty copy per mobile
- **Following:** Button state "Following"

## Navigation

- Recipe → [`09-recipe-detail.md`](09-recipe-detail.md) (screen 09)
- **Send Message** → [`20-chat.md`](20-chat.md) (screen 20)
- ← Browser back or breadcrumb to previous screen
