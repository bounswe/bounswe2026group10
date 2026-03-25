# 3. Login

**Priority:** MVP
**Requirements:** 1.1.1, 1.1.2

## Purpose
Authentication for existing users.

## Features
- Input fields: email, password
- "Remember me" toggle (persistent session — req 1.1.2)
- "Forgot Password?" link → forgot password flow
- Submit button → on success, navigate to Home (page 04)
- "Don't have an account? Register" link → Register (page 02)
- **Social auth buttons** (full-width, stacked — identical to Welcome page):
  - "Continue with Google" (Google logo + label)
  - "Continue with Apple" (Apple logo + label, dark background)
- "or continue with" divider between primary action and social buttons

## Forgot Password (modal)
- Email input field
- "Send Reset Link" button
- Success confirmation message

## Validation
- Email format check
- Wrong credentials error message

## States
- **Default:** Empty form
- **Validation errors:** Inline error messages
- **Loading:** Submit button disabled with spinner
- **Auth error:** "Invalid email or password" banner
- **Success:** Redirect to Home

## Navigation
- → Register (page 02)
- → Home (page 04) on success
