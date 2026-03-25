# 20. Chat / Conversation

**Priority:** FINAL

## Purpose
One-on-one messaging between users.

## Features
- **Message thread:** Chronological messages with bubbles (sent right, received left)
- **Message input:** Text field + send button at bottom
- **Header:** Other user's avatar, full name, role badge
  - Tapping header → Other User Profile (page 16)
- **Timestamps:** Grouped by date, individual message time on tap
- Auto-scroll to latest message

## Components
- Message bubble (sent/received styling)
- Text input bar (sticky bottom)
- Chat header (avatar, name, role)
- Date separator labels

## States
- **Default:** Message thread loaded
- **Empty conversation:** "Say hello!" prompt
- **Loading:** Skeleton bubbles
- **Sending:** Message bubble with pending indicator

## Navigation
- → Other User Profile (page 16) on header tap
- ← Messages Inbox (page 18) on back
