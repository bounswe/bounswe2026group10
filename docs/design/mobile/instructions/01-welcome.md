# 1. Welcome / Splash

**Priority:** MVP
**Requirements:** 1.1.1

## Purpose
First screen users see. Branding entry point that routes to Register or Login.

## Features
- App name "Roots & Recipes" in Newsreader serif (no logo image — text only)
- Tagline ("Preserve. Cook. Share.")
- "Sign In" button → Login (page 3)
- "Create Account" button → Register (page 2)
- "Continue as Guest" option → Home (page 4) with view-only access
- **Social auth buttons** (full-width, stacked):
  - "Continue with Google" (Google logo + label)
  - "Continue with Apple" (Apple logo + label, dark background)
- "or continue with" divider between primary buttons and social buttons

## States
- **Default:** Brand text + primary action buttons + social auth
- **Returning user with valid session:** Auto-redirect to Home (req 1.1.2)

## Navigation
- → Login (page 3)
- → Register (page 2)
- → Home (page 4) as guest
