# 14. Create: Steps (Web)

**Priority:** MVP  
**Requirements:** 1.3.1, 1.3.2

**Mobile spec:** [`../mobile/instructions/14-create-steps.md`](../mobile/instructions/14-create-steps.md)

## Purpose

Third step: ordered steps with titles, descriptions, photos.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). Icons: [`eco`](../mobile/icons/eco.svg), [`skillet`](../mobile/icons/skillet.svg).

## Web layout

- **Narrow:** Vertical steps; drag reorder; sticky Next/Back.
- **Wide:** **Stepper** (step 3 of 4). **Optional split:** **Outline** of step numbers (left) + **editor** for selected step (right); or **single column** with **wider** text areas and **inline** photo grid per step.

## Features

- "Step 3 of 4" badge
- Per step: number circle, title (italic), description, link ingredients/tools, **Add photo** (req 1.3.2), thumbnail preview
- Add step; reorder; delete; auto-numbering
- **Next** → Review (page 15); **Back** → Ingredients (page 13); **Save Draft**

## Validation

- At least one step; description required per step

## States

- **Default:** One empty step
- **Pre-filled from draft**; parser **FINAL**

## Navigation

- → [`15-create-review.md`](15-create-review.md) (screen 15) on Next
- ← [`13-create-ingredients.md`](13-create-ingredients.md) (screen 13) on Back
