# 8. Profile

**Priority:** MVP
**Requirements:** 1.1.2, 2.1

## Purpose
User's own profile — identity, role, published recipes, and quick access to settings.

## Features
- **Header:**
  - Avatar with **gradient ring** (terracotta → olive gradient, inner white border)
  - Full name (First + Last — no username)
  - Role badge (Learner / Cook / Expert) — text only, no icon inside the badge
  - Region, member since date
- **Stats row:** Recipes published, total ratings received, average rating
- **Published recipes:** Grid or list of user's published recipes (no difficulty/time badges)
- **Edit Profile button** → Edit Profile (page 17)
- **Settings gear icon** → Settings (page 19)
- **Logout** option

## Components
- Profile header card (avatar with gradient ring, name, role badge, region)
- Stats bar
- Recipe grid/list
- Action buttons (Edit, Settings)

## States
- **Default:** Profile info + published recipes
- **No published recipes:** CTA to create
- **Learner:** No "create recipe" CTA

## Navigation
- → Edit Profile (page 17)
- → Settings (page 19)
- Recipe tap → Recipe Detail (page 09)
- → Welcome (page 01) on logout
