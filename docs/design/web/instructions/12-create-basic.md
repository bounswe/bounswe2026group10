# 12. Create: Basic Info (Web)

**Priority:** MVP  
**Requirements:** 1.3.1, 1.3.3, 2.4

**Mobile spec:** [`../mobile/instructions/12-create-basic.md`](../mobile/instructions/12-create-basic.md)

## Purpose

First step of recipe creation: import (text/voice) or manual form.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). Icons: [`article`](../mobile/icons/article.svg), [`mic`](../mobile/icons/mic.svg).

## Web layout

- **Narrow:** Vertical stack: import cards → divider → manual form; sticky footer with Next / Save Draft.
- **Wide:** **Stepper** in header or left rail: **1 Basic | 2 Ingredients | 3 Steps | 4 Review**. **Main area:** import cards **side-by-side** (Paste Text | Voice); form fields in **max-width** column; **Next** / **Save Draft** in top-right or sticky bottom bar.

## Features

- **Import:** Paste Text (article) + Voice Recording (mic); "or fill in manually" divider
- **Manual:** Title (Newsreader), recipe type (Community/Cultural), origin, description, story, dietary chips, allergen chips (req 1.4.6)
- **Next** → Ingredients (page 13); **Save Draft**; cancel → discard confirm

## Validation

- Title required; Cultural rules per mobile; inline errors

## States

- **Default:** Import + empty form
- **Pre-filled from draft**; voice/transcription/parsing **FINAL** per mobile

## Navigation

- → [`13-create-ingredients.md`](13-create-ingredients.md) (screen 13) on Next
- → [`07-my-library.md`](07-my-library.md) (screen 07) drafts on Save Draft
