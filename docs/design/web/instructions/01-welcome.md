# 1. Welcome / Splash (Web)

**Priority:** MVP  
**Requirements:** 1.1.1

**Mobile spec:** [`../mobile/instructions/01-welcome.md`](../mobile/instructions/01-welcome.md)

## Purpose

First screen users see. Branding entry point that routes to Register or Login.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). Social icons: [`../mobile/icons/logo-google.svg`](../mobile/icons/logo-google.svg), [`../mobile/icons/logo-apple.svg`](../mobile/icons/logo-apple.svg).

## Web layout

- **Narrow:** Same vertical stack as mobile; full-width buttons; centered content with horizontal padding.
- **Wide:** Optional **split layout** — hero / brand column (left) + actions column (right); or single centered **max-width** card (~480px) with more whitespace. Primary actions remain visually dominant.

## Features

- App name "Roots & Recipes" in Newsreader serif (text only)
- Tagline ("Preserve. Cook. Share.")
- "Sign In" → Login (page 03)
- "Create Account" → Register (page 02)
- "Continue as Guest" → Home (page 04), view-only
- Social auth: "Continue with Google" / "Continue with Apple" (full-width on narrow; side-by-side on wide if space allows)
- **Web:** Divider "or continue with" between primary and social buttons (same as mobile)

## States

- **Default:** Brand text + primary action buttons + social auth
- **Returning user with valid session:** Auto-redirect to Home (req 1.1.2)

## Navigation

- → [`03-login.md`](03-login.md) (screen 03)
- → [`02-register.md`](02-register.md) (screen 02)
- → [`04-home.md`](04-home.md) (screen 04) as guest
