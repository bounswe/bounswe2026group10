# 17. Edit Profile

**Priority:** MVP
**Requirements:** 1.1.2

## Purpose
Edit user's personal information.

## Features
- **Avatar:** Current avatar with `add_a_photo` overlay → camera or gallery picker
- **First Name** input
- **Last Name** input
- No username field — removed (app uses full name everywhere)
- **Bio / About me** text area — empty by default, no pre-filled sample text
- **Location** inputs (city / country)
- **Preferred language** selector
- **Role upgrade request:** Learner → Cook, Cook → Expert (with justification field)
- **Save Changes** button
- **Cancel** button → discard changes, back to Profile

## Validation
- First/Last name required
- Avatar file size limit

## States
- **Default:** Pre-filled with current profile data (bio starts empty)
- **Saving:** Loading indicator on save button
- **Saved:** Success toast + redirect to Profile
- **Validation errors:** Inline per field
- **Role upgrade submitted:** Confirmation message

## Navigation
- ← Profile (page 8) on cancel or save success
