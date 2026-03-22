# Mobile App — Screen Inventory

21 screens implemented. Bottom tab navigation: **Home | Search | + Create | My Library | Profile**

## Priority Legend
- **MVP** — Must have by April 7, 2026
- **FINAL** — Should have by May 14, 2026

## Screens

### Auth (no top bar, no bottom nav)
| # | Screen | Priority |
|---|--------|----------|
| 01 | [Welcome / Splash](01-welcome.md) | MVP |
| 02 | [Register](02-register.md) | MVP |
| 03 | [Login](03-login.md) | MVP |

### Main Tabs
| # | Screen | Priority |
|---|--------|----------|
| 04 | [Home / Discover Feed](04-home.md) | MVP |
| 05 | [Search & Browse](05-search.md) | MVP |
| 07 | [My Library](07-my-library.md) | MVP |
| 08 | [Profile](08-profile.md) | MVP |

### Dish
| # | Screen | Priority |
|---|--------|----------|
| 06 | [Dish Variety Detail](06-dish-variety.md) | MVP |

### Recipe
| # | Screen | Priority |
|---|--------|----------|
| 09 | [Recipe Detail](09-recipe-detail.md) | MVP |
| 10 | [Comments & Ratings](10-comments.md) | MVP |
| 11 | [Cooking Mode](11-cooking-mode.md) | FINAL (basic: MVP) |

### Recipe Creation (4-step flow)
| # | Screen | Priority |
|---|--------|----------|
| 12 | [Create: Basic Info](12-create-basic.md) | MVP |
| 13 | [Create: Ingredients & Tools](13-create-ingredients.md) | MVP |
| 14 | [Create: Steps](14-create-steps.md) | MVP |
| 15 | [Create: Review & Publish](15-create-review.md) | MVP |

### Profile & Settings
| # | Screen | Priority |
|---|--------|----------|
| 19 | [Settings](19-settings.md) | MVP (basic) / FINAL (full) |
| 16 | [Other User Profile](16-other-profile.md) | FINAL |
| 17 | [Edit Profile](17-edit-profile.md) | MVP |

### Social
| # | Screen | Priority |
|---|--------|----------|
| 18 | [Messages Inbox](18-messages.md) | FINAL |
| 20 | [Chat / Conversation](20-chat.md) | FINAL |

## Requirements Coverage

| Requirement | Screen(s) |
|---|---|
| 1.1.1 Register / Login | 01, 02, 03 |
| 1.1.2 Persistent session | 03 (Remember me), 08 |
| 1.2.1 View ingredients, tools, steps, story | 09 |
| 1.2.1 Video demonstration | 11 |
| 1.2.2 Alternative recipe versions | 06, 09 |
| 1.2.3 Serving size adjustment | 09 (+/− control) |
| 1.2.4 Sort alternatives | 05 (Sort row in results) |
| 1.3.1 Create recipe | 12, 13, 14, 15 |
| 1.3.2 Attach media (photos) | 14 (Add photo per step) |
| 1.3.3 Save as draft | 12, 13, 14, 15 |
| 1.3.4 Publish | 15 |
| 1.4.1 Search by name | 05 (search bar) |
| 1.4.1 Search by region | 05 (Country filter chip) |
| 1.4.1 Search by ingredients | 05 (tune → filter sheet) |
| 1.4.2 Filter by allergen | 05 (filter chip), 19 (allergen profile) |
| 1.4.4 Dynamic filter updates | 05 (implied) |
| 1.4.5 Exclude allergen dishes | 05 (filter), 19 (allergen profile) |
| 1.4.6 Tag dietary/allergen | 12 (dietary chips), 13 (allergen tagging) |
| 1.5.1 Rate recipes | 10 |
| 1.5.2 Submit comments | 10 |
| 2.1 User roles (Learner/Cook/Expert) | 02 (registration), 08, 16 |
| 2.2 Unit conversion | 19 (Metric/Imperial toggle) |
| 2.2 Serving normalization | 09 (+/− serving control) |
| 2.3 Ingredient substitution | 09 (Substitute button per ingredient) |
| 2.4 Recipe parsing (text/voice) | 12 (Paste Text + Voice Recording) |
| 2.5 Genre → Variety → Recipe hierarchy | 04 → 05 → 06 → 09 |

## Not yet covered
| Requirement | Notes |
|---|---|
| 1.2.1 Video technique annotations | Planned for Cooking Mode (FINAL) |
| 2.2 Multilingual / translation | FINAL — language preference in Settings but translation UI not mocked |
