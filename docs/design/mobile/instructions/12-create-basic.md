# 12. Create: Basic Info

**Priority:** MVP
**Requirements:** 1.3.1, 1.3.3, 2.4

## Purpose
First step of recipe creation. Offers two entry modes: import (text/voice) or manual form.

## Features

### Import Section (top of screen — req 2.4)
Two side-by-side cards presented before the manual form:
- **Paste Text** (`article` icon) — type or paste a free-form recipe; system parses it into structured fields
- **Voice Recording** (`mic` icon) — describe the recipe verbally; system transcribes and parses it
- "or fill in manually" divider below the import cards

### Manual Form
- **Recipe title** input (Newsreader italic, large)
- **Recipe type** selector: Community (Cook/Expert) or Cultural (Expert only)
- **Origin:** Country selector + Region text input
- **Description** text area
- **Story** text area — personal or cultural narrative
- **Dietary tags:** Vegan, Vegetarian, Halal, Kosher, Gluten-Free (chip selector — req 1.4.6)
- **Allergen tags:** chip selector
- "Next" button → Create: Ingredients & Tools (page 13)
- "Save Draft" button (req 1.3.3)

## Validation
- Title required
- Cultural recipe type only available for Expert role
- Cultural recipe type requires a cultural story

## States
- **Default:** Import cards + empty form
- **Pre-filled from draft:** Fields populated
- **Voice input mode:** Microphone UI with transcription preview (FINAL)
- **Parsing result:** Parsed fields shown for review/editing (FINAL)
- **Validation errors:** Inline messages

## Navigation
- → Create: Ingredients & Tools (page 13) on "Next"
- → My Library / Drafts (page 07) on "Save Draft"
- ← Cancel → confirm discard dialog
