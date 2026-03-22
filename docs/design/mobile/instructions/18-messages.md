# 18. Messages Inbox

**Priority:** FINAL

## Purpose
List of all conversations.

## Features
- **Conversation list:** Each row shows:
  - Other user's avatar and full name
  - Role badge
  - Last message preview (truncated)
  - Timestamp of last message
  - Unread message count badge
- **Search conversations** bar at top
- **New message button** → user search to start new conversation
- Pull-to-refresh

## Components
- Conversation row (avatar, name, preview, time, unread badge)
- Search bar
- Floating action button (new message)

## States
- **Default:** List of conversations sorted by most recent
- **Empty:** "No messages yet — connect with cooks and experts!"
- **Loading:** Skeleton rows

## Navigation
- Conversation tap → Chat (page 20)
- New message → user search → Chat (page 20)
