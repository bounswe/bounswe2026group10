# 18. Messages Inbox (Web)

**Priority:** FINAL

**Mobile spec:** [`../mobile/instructions/18-messages.md`](../mobile/instructions/18-messages.md)

## Purpose

List of all conversations.

## Visual identity

[`../../DESIGN.md`](../../DESIGN.md).

## Web layout

- **Narrow:** Full-width list; search top; FAB or header button for new message (same as mobile).
- **Wide:** **Master–detail split:** **Left pane (~360–400px):** conversation list + search + **New message**. **Right pane:** empty state ("Select a conversation") or **embedded** [`20-chat.md`](20-chat.md) when a thread is selected — **no navigation** away from inbox for reading messages.

## Features

- Rows: avatar, name, role, last message preview, time, unread badge
- Search conversations
- **New message** → user search → Chat (page 20)
- **Web:** Pull-to-refresh on touch; **Refresh** button on desktop

## Components

- Conversation list; search; new message entry point

## States

- **Default:** Sorted by recent
- **Empty:** "No messages yet — connect with cooks and experts!"
- **Loading:** Skeleton rows

## Navigation

- Row tap → [`20-chat.md`](20-chat.md) (screen 20) — **narrow:** full screen chat; **wide:** right pane
- New message flow → [`20-chat.md`](20-chat.md) (screen 20)
