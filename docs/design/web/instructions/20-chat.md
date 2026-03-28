# 20. Chat / Conversation (Web)

**Priority:** FINAL

**Mobile spec:** [`../mobile/instructions/20-chat.md`](../mobile/instructions/20-chat.md)

## Purpose

One-on-one messaging.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md).

## Web layout

- **Narrow:** Full-screen thread; header; input sticky bottom (same as mobile).
- **Wide:** If opened from **split inbox:** thread fills **right pane**; **back** collapses to list only. If **standalone route:** centered **max-width** column (~720px) for bubbles or full-width with **max-width** message column.

## Features

- Message bubbles (sent right, received left); text input + send
- Header: avatar, name, role — **tap header** → Other User Profile (page 16)
- Timestamps; date groups; auto-scroll to latest
- **Web:** Enter to send (with Shift+Enter for newline) optional

## Components

- Chat header; bubble list; composer (sticky bottom)

## States

- **Default:** Thread loaded
- **Empty:** "Say hello!"
- **Loading:** Skeleton
- **Sending:** Pending indicator on message

## Navigation

- → [`16-other-profile.md`](16-other-profile.md) (screen 16) on header tap
- ← [`18-messages.md`](18-messages.md) (screen 18) on back (**narrow**); **wide** split view: back to list only
