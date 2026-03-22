# 11. Step-by-Step Cooking Mode

**Priority:** MVP (basic) / FINAL (full)
**Requirements:** 1.2.1

## Purpose
Distraction-free cooking walkthrough with step-by-step navigation.

## Current Mockup Layout (step-only view)
- **Video player** at top with `play_circle` play button and seek bar
- **Step list** toggle (`format_list_bulleted` icon)
- **Active step card:** Large step description, step number, photo if attached
- **Previous / Next navigation** buttons
- **Progress indicator** (e.g., "Step 2 of 6")
- Ingredients reference section (collapsible)

## What is NOT in the current mockup
- No "Current Technique" annotation overlay card — removed
- No annotation markers on seek bar
- No bidirectional video-step sync UI

## Planned Full Feature (FINAL)
- **Annotation markers** on video seek bar at technique timestamps
- When annotation reached → overlay card appears (technique name + description), auto-dismisses
- **Bidirectional sync:** Scrubbing video highlights matching step; tapping Next/Previous jumps video to that step's timestamp
- **Timer** widget per step
- **Completion screen:** After last step → prompt to rate the recipe

## Navigation
- ← Back to Recipe Detail (page 09) on exit
- → Comments & Ratings (page 10) on completion rating prompt
