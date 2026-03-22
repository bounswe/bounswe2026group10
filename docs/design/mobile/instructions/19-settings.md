# 19. Settings

**Priority:** MVP (basic) / FINAL (full)
**Requirements:** 1.4.2, 1.4.5, 2.2

## Purpose
App preferences and account settings. "Tailor your kitchen experience and dietary traditions."

## Features

### Account
- **Email address** display + edit
- **Password** change field (masked)

### Language (req 2.2)
- Dropdown selector for app UI language (e.g., English (US), Italiano, Español, Français)

### Region
- Dropdown selector for user's region (e.g., North America, Mediterranean, Southeast Asia, Western Europe)
- Affects unit conversion defaults and content regionalization

### Measurement Units (req 2.2)
- Two-option toggle: **Metric** (g, ml, °C) vs **Imperial** (oz, cups, °F)
- Metric is the default
- Affects how ingredient quantities are displayed across the entire app

### Allergen Profile (req 1.4.2, 1.4.5)
- Multi-select chips: Peanuts, Dairy, Shellfish, Gluten, Tree Nuts, + Add custom
- Active allergens highlighted (e.g., Dairy, Shellfish selected)
- System highlights recipes containing these ingredients in search results

### Dietary Preferences
- Toggle switches per dietary mode: Halal, Kosher (and others)
- Affects personalized feed and search filtering

### Actions
- **Save Changes** button (primary, pill-shaped)
- **Logout** button (secondary)

## States
- **Default:** Current user settings pre-loaded
- **Saving:** Loading indicator on Save Changes button
- **Saved:** Success confirmation
- **Logged out:** Redirect to Welcome (page 01)

## Navigation
- ← Back to Profile (page 08)
- → Welcome (page 01) on logout
