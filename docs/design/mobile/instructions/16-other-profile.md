# 16. Other User Profile

**Priority:** FINAL
**Requirements:** 2.1

## Purpose
View another user's public profile and their published recipes.

## Features
- **Header:**
  - Avatar with gradient ring (same as own profile)
  - Full name (no username)
  - Role badge (Learner / Cook / Expert) — text only, no icon
  - Region, member since
- **Stats row:** Recipes published, average rating
- **Published recipes:** List of their published recipes
  - Cards show thumbnail, title, region — no difficulty or time indicators
- **Follow button** → receive notifications when they publish
- **Send Message button** → Chat (page 24)

## What is NOT shown
- No difficulty/rating labels on recipe cards (Easy / Medium / Expert removed)
- No view toggle button (list/grid switch removed)

## Components
- Profile header (gradient avatar, name, role badge)
- Stats bar
- Recipe list
- Action buttons (Follow, Message)

## States
- **Default:** Profile loaded with recipes
- **No recipes:** "This user hasn't published any recipes yet"
- **Following:** Follow button shows "Following"

## Navigation
- Recipe tap → Recipe Detail (page 9)
- → Chat (page 24) on "Send Message"
- ← Back to previous screen
