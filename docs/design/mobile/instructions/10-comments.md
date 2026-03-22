# 10. Comments & Ratings

**Priority:** MVP
**Requirements:** 1.5.1, 1.5.2

## Purpose
Full view of all ratings and comments for a recipe.

## Features
- **Rating summary:** Average stars, rating distribution bar chart (5★ to 1★), total count
- **Your rating:** Star input if user hasn't rated yet, editable if already rated (req 1.5.1)
- **Comment list:** All comments sorted by recency
  - Each comment: author avatar, full name, date, text (req 1.5.2)
  - Tapping author → Other User Profile (page 16)
  - No promotional/legacy text on comments — comments show only user-submitted content
- **Add comment:** Text input + submit button (req 1.5.2)

## Components
- Rating summary card (average, distribution)
- Star input component
- Comment card (avatar, name, date, text)
- Text input with submit button (sticky at bottom)

## States
- **Default:** Rating summary + comment list
- **No comments:** "Be the first to comment!"
- **No rating yet:** Prompt to rate
- **Loading:** Skeleton comments
- **Guest user:** Actions prompt login

## Navigation
- → Other User Profile (page 16) on comment author tap
- ← Back to Recipe Detail (page 09)
