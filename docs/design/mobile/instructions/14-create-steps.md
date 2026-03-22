# 14. Create: Steps

**Priority:** MVP
**Requirements:** 1.3.1, 1.3.2

## Purpose
Third step of recipe creation. Add ordered preparation steps with titles, descriptions, and photos.

## Features

### Progress
- "Step 3 of 4" pill badge

### Step List
Each step has:
- **Step number:** Small filled terracotta circle (2rem × 2rem), white number — not a large watermark
- **Step title input:** Italic headline input (e.g., "Prepare the dough") — above the description
- **Description textarea:** Main step instructions
- **Link Ingredients button:** `eco` (leaf) icon — tag which ingredients are used in this step
- **Link Tools button:** `skillet` (pan) icon — tag which tools are used in this step
- **Add photo button** — camera or gallery (req 1.3.2)
- Photo thumbnail preview with remove option

### Controls
- **"Add Step" button** to append new step
- Reorder via drag handle; delete via X
- Auto-numbering updates on reorder/delete

### Navigation Controls
- "Next" → Create: Review & Publish (page 17)
- "Back" → Create: Ingredients & Tools (page 14)
- "Save Draft"

## Validation
- At least one step required
- Step description required per step

## States
- **Default:** One empty step
- **Pre-filled from draft:** Steps, photos restored
- **Pre-filled from parser:** Parsed steps shown for editing (FINAL)
- **Validation errors:** Inline per step

## Navigation
- → Create: Review & Publish (page 17) on "Next"
- ← Create: Ingredients & Tools (page 14) on "Back"
