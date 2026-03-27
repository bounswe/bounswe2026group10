# Roots & Recipes — Mobile App

## Domain Glossary

See [`docs/glossary.md`](docs/glossary.md) for definitions of **Dish**, **Dish Genre**, **Dish Variety**, and **Recipe** — and why they are grouped under the Dish umbrella.

## Goal

Implement the mobile client for Roots & Recipes, a cross-generational recipe sharing platform. The app lets users discover, create, and share heritage recipes with features like ingredient substitution, unit conversion, allergen filtering, and step-by-step cooking mode.

## Tech Stack

- **Framework**: React Native (Expo SDK 54)
- **Language**: TypeScript
- **Template**: blank-typescript


## Screen Inventory

Design specs: `docs/design/mobile/instructions/XX-name.md`
Screenshots: `docs/design/mobile/screenshots/XX-Name.png`
HTML mockups: `mobile/screens/XX-name-fixed.html`

### Auth (no bottom nav)
| # | Screen | Priority |
|---|--------|----------|
| 01 | Welcome / Splash | MVP |
| 02 | Register | MVP |
| 03 | Login | MVP |

### Main Tabs (Home | Search | + Create | My Library | Profile)
| # | Screen | Priority |
|---|--------|----------|
| 04 | Home / Discover Feed | MVP |
| 05 | Search & Browse | MVP |
| 07 | My Library | MVP |
| 08 | Profile | MVP |

### Dish & Recipe
| # | Screen | Priority |
|---|--------|----------|
| 06 | Dish Variety Detail | MVP |
| 09 | Recipe Detail | MVP |
| 10 | Comments & Ratings | MVP |
| 11 | Cooking Mode | MVP (basic) / FINAL (full) |

### Recipe Creation (4-step wizard)
| # | Screen | Priority |
|---|--------|----------|
| 12 | Create: Basic Info | MVP |
| 13 | Create: Ingredients & Tools | MVP |
| 14 | Create: Steps | MVP |
| 15 | Create: Review & Publish | MVP |

### Profile & Settings
| # | Screen | Priority |
|---|--------|----------|
| 17 | Edit Profile | MVP |
| 19 | Settings | MVP (basic) / FINAL (full) |
| 16 | Other User Profile | FINAL |

### Social
| # | Screen | Priority |
|---|--------|----------|
| 18 | Messages Inbox | FINAL |
| 20 | Chat / Conversation | FINAL |

## Scenario Mapping

### Scenario 1 — Heritage Recipe Digitization (Elif, 68, retired teacher)
Elif digitizes her family's Kayseri Yaglamas recipe for her grandson abroad.

**Screens**: 01, 02, 03, 09, 12, 13, 14, 15, 19
**Key features**: Free-text recipe parsing, media upload, dietary/allergen tagging, unit conversion, ingredient substitution, multilingual support
**Requirements**: 1.3.1-1.3.4, 1.4.6, 2.2.2, 2.2.5-2.2.6, 2.3.2, 2.4.1.1

### Scenario 2 — Home Cook Discovery (Ayse, 30, office worker)
Ayse searches for green bean recipe variations, filters by available ingredients, cooks, and leaves a review.

**Screens**: 01, 03, 05, 06, 09, 10, 11
**Key features**: Name search, ingredient filtering, alternative recipe versions, step-by-step cooking, rating & commenting
**Requirements**: 1.1.2, 1.2.1-1.2.2, 1.4.1.1, 1.4.3, 1.5.1-1.5.2, 2.1.1.1, 2.5.2

### Scenario 3 — Erasmus Learner (Hans, 22, exchange student)
Hans explores Turkish cuisine while filtering for his mushroom allergy, adjusts serving sizes, and substitutes ingredients.

**Screens**: 01, 02, 03, 04, 05, 06, 09, 11, 19
**Key features**: Allergen filtering, region-based discovery, serving size adjustment, ingredient substitution, video cooking guide, allergen profile settings
**Requirements**: 1.1.1-1.1.3, 1.2.1-1.2.4, 1.4.1-1.4.5, 1.5.1-1.5.2, 2.1, 2.2, 2.3, 2.5

## Requirements Coverage

See full mapping in `docs/design/mobile/instructions/00-overview.md`.
