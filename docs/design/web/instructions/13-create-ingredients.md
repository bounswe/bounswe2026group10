# 13. Create: Ingredients & Tools (Web)

**Priority:** MVP  
**Requirements:** 1.3.1, 1.4.6

**Mobile spec:** [`../mobile/instructions/13-create-ingredients.md`](../mobile/instructions/13-create-ingredients.md)

## Purpose

Second step: ingredients with quantities and tools.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). Icons: [`eco`](../mobile/icons/eco.svg), [`skillet`](../mobile/icons/skillet.svg).

## Web layout

- **Narrow:** Single column; "Step 2 of 4" badge; scrollable ingredient rows.
- **Wide:** **Stepper** (1–4) visible. **Two columns:** **Ingredients** (left) table-like rows with add/remove; **Tools** (right) quick-add chips + list. Or **single column** wide form with **wider** ingredient table.

## Features

- Progress: "Step 2 of 4"
- Ingredient rows: name, quantity, unit; allergen tagging (req 1.4.6); `eco` icon; drag reorder; add/delete
- Tools: name + `skillet` icon; quick-add chips; delete
- **Next** → Steps (page 14); **Back** → Basic (page 12); **Save Draft**

## Validation

- At least one ingredient; positive quantity; name per row

## States

- **Default:** One empty row + tools
- **Pre-filled from draft**; parser **FINAL**

## Navigation

- → [`14-create-steps.md`](14-create-steps.md) (screen 14) on Next
- ← [`12-create-basic.md`](12-create-basic.md) (screen 12) on Back
