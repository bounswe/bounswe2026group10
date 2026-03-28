# 2. Register (Web)

**Priority:** MVP  
**Requirements:** 1.1.1, 2.1

**Mobile spec:** [`../mobile/instructions/02-register.md`](../mobile/instructions/02-register.md)

## Purpose

Account creation with role selection.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). Form labels: Be Vietnam Pro; social icons as on Welcome.

## Web layout

- **Narrow:** Single-column form; stacked fields; social buttons full-width.
- **Wide:** Optional **two-column form** for name fields (First | Last) or wider max-width form (~560px) centered; role and region in logical groups.

## Features

- Fields: First Name, Last Name, email, password, confirm password (no username)
- Role: Learner / Cook with descriptions
- Region selector; preferred language selector
- **Web:** Long forms may use sticky footer with primary **Submit** on wide viewports
- Link "Already have an account? Sign In" → Login (page 03)
- Submit success → Home (page 04)
- Social: Continue with Google / Apple (same style as Welcome)

## Validation

- Email format; password strength; required fields

## States

- **Default:** Empty form
- **Validation errors:** Inline per field
- **Loading:** Submit disabled + spinner
- **Success:** Redirect to Home

## Navigation

- → [`03-login.md`](03-login.md) (screen 03)
- → [`04-home.md`](04-home.md) (screen 04) on success
