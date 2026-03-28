# 19. Settings (Web)

**Priority:** MVP (basic) / FINAL (full)  
**Requirements:** 1.4.2, 1.4.5, 2.2

**Mobile spec:** [`../mobile/instructions/19-settings.md`](../mobile/instructions/19-settings.md)

## Purpose

App preferences: account, language, region, units, allergens, dietary, logout.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md).

## Web layout

- **Narrow:** Single column sections; scroll; Save at bottom.
- **Wide:** **Settings** as **page** with **max-width** (~720px) or **two-column** form (Account + Language/Region left; Units + Allergens + Dietary right). **Save Changes** / **Logout** in header or sticky bar.

## Features

- Account: email, password change
- Language (req 2.2); region; **Metric / Imperial** toggle (req 2.2)
- **Allergen profile** chips (req 1.4.2, 1.4.5)
- Dietary toggles
- **Save Changes**; **Logout** → Welcome (page 01)

## States

- **Default:** Pre-loaded
- **Saving**; **Saved** confirmation
- **Logged out:** Redirect to Welcome (page 01)

## Navigation

- ← [`08-profile.md`](08-profile.md) (screen 08)
- Logout → [`01-welcome.md`](01-welcome.md) (screen 01)
