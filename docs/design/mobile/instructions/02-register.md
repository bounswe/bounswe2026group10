# 2. Register

**Priority:** MVP
**Requirements:** 1.1.1, 2.1

## Purpose
Account creation with role selection.

## Features
- Input fields: **First Name**, **Last Name**, email, password, confirm password
  - No username field — the app uses full name everywhere
- Role selection: Learner / Cook (with brief role descriptions)
- Region selector
- Preferred language selector
- "Already have an account? Sign In" link → Login (page 3)
- Submit button → on success, navigate to Home (page 4)
- **Social auth buttons** (full-width, stacked — same style as Welcome page):
  - "Continue with Google"
  - "Continue with Apple"

## Validation
- Email format validation
- Password strength indicator
- All required fields must be filled

## States
- **Default:** Empty form
- **Validation errors:** Inline error messages per field
- **Loading:** Submit button disabled with spinner
- **Success:** Redirect to Home

## Navigation
- → Login (page 3)
- → Home (page 4) on success
