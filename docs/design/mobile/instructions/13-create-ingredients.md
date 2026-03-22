# 13. Create: Ingredients & Tools

**Priority:** MVP
**Requirements:** 1.3.1, 1.4.6

## Purpose
Second step of recipe creation. Add ingredients with quantities and tools needed.

## Features

### Progress
- "Step 2 of 4" pill badge (secondary-container, uppercase, small)

### Ingredients
- **Add ingredient row:** Name, quantity, unit (dropdown: g, kg, ml, L, cup, tbsp, tsp, piece, etc.)
- Each row uses `eco` (leaf) icon — no food-specific icons
- **Allergen tagging:** Auto-detect or manual tag per ingredient (req 1.4.6)
- **"Add Ingredient" button** to add new row
- Reorder via drag handle; delete via X

### Tools
- **Add tool:** Name input, `skillet` icon — no tool-specific icons
- **Common tools quick-add:** Suggested chips (oven, pan, pot, blender, knife, etc.)
- Delete via swipe or X

### Navigation Controls
- "Next" → Create: Steps (page 15)
- "Back" → Create: Basic Info (page 13)
- "Save Draft"

## Validation
- At least one ingredient required
- Ingredient name required per row
- Quantity must be a positive number

## States
- **Default:** One empty ingredient row + empty tools section
- **Pre-filled from draft:** Rows populated
- **Pre-filled from parser:** Parsed ingredients shown for editing (FINAL)
- **Validation errors:** Inline per row

## Navigation
- → Create: Steps (page 15) on "Next"
- ← Create: Basic Info (page 13) on "Back"
