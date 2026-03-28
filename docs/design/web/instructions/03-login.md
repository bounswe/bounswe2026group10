# 3. Login (Web)

**Priority:** MVP  
**Requirements:** 1.1.1, 1.1.2

**Mobile spec:** [`../mobile/instructions/03-login.md`](../mobile/instructions/03-login.md)

## Purpose

Authentication for existing users.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). Social icons: [`../mobile/icons/`](../mobile/icons/) (Google, Apple).

## Web layout

- **Narrow:** Same as mobile — stacked fields, full-width social buttons.
- **Wide:** Centered card; optional **focus mode** (narrow column) for accessibility; forgot-password modal centered with backdrop.

## Features

- Email, password; **Remember me** (req 1.1.2)
- "Forgot Password?" → forgot-password modal (email + send reset link)
- "Don't have an account? Register" → Register (page 02)
- Submit success → Home (page 04)
- Social auth + "or continue with" divider (same as Welcome)

## Validation

- Email format; wrong-credentials banner

## States

- **Default:** Empty form
- **Validation errors:** Inline
- **Loading:** Submit disabled + spinner
- **Auth error:** "Invalid email or password" banner
- **Success:** Redirect to Home

## Navigation

- → [`02-register.md`](02-register.md) (screen 02)
- → [`04-home.md`](04-home.md) (screen 04) on success
