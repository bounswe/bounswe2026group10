# 17. Edit Profile (Web)

**Priority:** MVP  
**Requirements:** 1.1.2

**Mobile spec:** [`../mobile/instructions/17-edit-profile.md`](../mobile/instructions/17-edit-profile.md)

## Purpose

Edit personal information.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md). [`add_a_photo`](../mobile/icons/add_a_photo.svg) for avatar overlay.

## Web layout

- **Narrow:** Single-column form; Save/Cancel sticky or at end.
- **Wide:** **Two-column layout:** avatar + name fields left; bio + location + language + role upgrade right; or **single column** max-width ~640px centered.

## Features

- Avatar + photo picker; First/Last name; bio; location; language; role upgrade (Learner→Cook, Cook→Expert) with justification
- **Save Changes**; **Cancel** → Profile without saving

## Validation

- First/Last required; avatar size limit

## States

- **Default:** Pre-filled (bio empty)
- **Saving**; **Saved** toast → Profile
- **Role upgrade submitted:** Confirmation

## Navigation

- ← [`08-profile.md`](08-profile.md) (screen 08) on cancel or save success
