# 8. Profile (Web)

**Priority:** MVP  
**Requirements:** 1.1.2, 2.1

**Mobile spec:** [`../mobile/instructions/08-profile.md`](../mobile/instructions/08-profile.md)

## Purpose

Own profile: identity, role, published recipes, settings, logout.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). Gradient avatar ring (terracotta → olive). Settings: [`../mobile/icons/settings.svg`](../mobile/icons/settings.svg).

## Web layout

- **Narrow:** Same structure as mobile — header card, stats, recipe grid, Edit/Settings.
- **Wide:** **Primary nav** (active: Profile). **Header** + stats can sit in **two columns** (avatar + identity left, stats right); **published recipes** as **grid** (3–4 columns).

## Features

- Avatar (gradient ring), full name, role badge, region, member since
- Stats: published count, total ratings, average rating
- Published recipes grid/list — no difficulty/time badges
- **Edit Profile** → Edit Profile (page 17)
- **Settings** gear → Settings (page 19)
- **Logout**

## Components

- Profile header card; stats bar; recipe grid; Edit / Settings actions

## States

- **Default:** Info + published recipes
- **No published recipes:** CTA to create
- **Learner:** No create-recipe CTA

## Navigation

- → [`17-edit-profile.md`](17-edit-profile.md) (screen 17)
- → [`19-settings.md`](19-settings.md) (screen 19)
- Recipe tap → [`09-recipe-detail.md`](09-recipe-detail.md) (screen 09)
- Logout → [`01-welcome.md`](01-welcome.md) (screen 01)
