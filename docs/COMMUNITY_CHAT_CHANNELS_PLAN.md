# Community Chat Channels — Full Implementation Plan

> **Feature:** Real-time group chat spaces inside every community (like Slack/Discord channels)
> **Priority:** 🔴 Critical — Biggest missing feature vs. Circle, Skool, Nas.io
> **Author:** Architecture Team
> **Status:** Ready for implementation

---

## Table of Contents

1. [Competitive Analysis & What We're Building](#1-competitive-analysis--what-were-building)
2. [Architecture Overview](#2-architecture-overview)
3. [Backend — Phase 1: Data Layer (Schemas)](#3-backend--phase-1-data-layer-schemas)
4. [Backend — Phase 2: Permission System Extensions](#4-backend--phase-2-permission-system-extensions)
5. [Backend — Phase 3: WebSocket Gateway](#5-backend--phase-3-websocket-gateway)
6. [Backend — Phase 4: Service Layer](#6-backend--phase-4-service-layer)
7. [Backend — Phase 5: REST Controller & Endpoints](#7-backend--phase-5-rest-controller--endpoints)
8. [Backend — Phase 6: Notification System Extensions](#8-backend--phase-6-notification-system-extensions)
9. [Backend — Phase 7: Module Wiring](#9-backend--phase-7-module-wiring)
10. [Frontend — Phase 1: Types & API Client](#10-frontend--phase-1-types--api-client)
11. [Frontend — Phase 2: Socket Hook](#11-frontend--phase-2-socket-hook)
12. [Frontend — Phase 3: Page & Route Structure](#12-frontend--phase-3-page--route-structure)
13. [Frontend — Phase 4: Component Breakdown](#13-frontend--phase-4-component-breakdown)
14. [Frontend — Phase 5: Creator Studio (Channel Management)](#14-frontend--phase-5-creator-studio-channel-management)
15. [Database Indexes & Performance](#15-database-indexes--performance)
16. [UX Design Decisions & Patterns](#16-ux-design-decisions--patterns)
17. [Rollout Phases](#17-rollout-phases)
18. [File Creation Checklist](#18-file-creation-checklist)

---

## 1. Competitive Analysis & What We're Building

### What the best platforms do

#### Circle.so (Most Advanced)
- **Chat Spaces** live in the sidebar alongside Post Spaces, Course Spaces, and Event Spaces
- Three chat modalities: Public/Private Channel Spaces, 1-on-1 DMs, and ad-hoc Group DMs
- Full message richness: text, images, video, GIFs, file attachments, link unfurls, emoji reactions, threaded replies, `@mentions`, `@channel`, `@here`
- WebSocket-based, real-time with typing indicators and online presence dots
- Per-channel permissions: public (all members), private (invite-only), announcement (read-only)
- Membership-tier gating: lock a channel behind a paid plan — the channel becomes a monetization asset
- Per-space moderator role (delegate moderation without giving platform-wide admin power)
- Unlimited message history, searchable across all channels
- Dedicated channel per Course (auto-added when course created) and per Event
- Automated channel membership via Workflows (e.g., "member buys Pro plan → auto-join #pro-members")
- AI Agents can answer questions inside a channel (Circle Plus)
- Welcome DM auto-sent on member join (template or AI-generated)
- **Key design insight:** Chat is ONE space type alongside posts/courses/events. Members choose the right format for their content. This prevents chat from burying async knowledge.

#### Skool.com (Gamification-Driven)
- No real-time chat at all — **deliberately async** (categories = topic filters on the feed, not chat rooms)
- Level-gated category access: must earn XP to unlock high-signal channels
- AutoDM on member join (from admin account, supports `{first_name}` tokens)
- Skool Call and Go Live for real-time — video-first, not chat-first
- **Key insight:** Absence of chat is a product decision to keep S/N ratio high. We should offer chat but with the same deliberate structure (named channels, not an open flood)

#### Nas.io (Hub Model)
- No native real-time chat — links out to WhatsApp Groups, Discord, Telegram, Slack
- Event-specific chat URL gated by registration
- Magic Reach: write-once broadcast → email + push + feed
- **Key insight:** Their users already live in WhatsApp. We should support WhatsApp-linked channels as a future optional integration but build native first.

### What Chabaqa will build

A **hybrid model** inspired primarily by Circle, adapted for Chabaqa's stack:

| Dimension | Our Decision | Why |
|---|---|---|
| **Chat vs. Posts** | Both co-exist; channels live in the community nav alongside posts, courses, events | Mirrors Circle's proven model; prevents chat from killing async |
| **Channel types** | `TEXT` (default), `ANNOUNCEMENTS` (admin-post only), `COURSE_CHAT` (auto-created), `EVENT_CHAT` (auto-created) | Covers 90% of use cases immediately |
| **Visibility** | `PUBLIC` (all members) and `PRIVATE` (invited members only) | Keep it simple for v1; no read-only tier initially |
| **Gating** | Access-group / membership-tier gating via existing `CommunityAccessService` | Reuse existing permission infrastructure |
| **Real-time** | New `/channel` Socket.IO namespace, separate from `/dm` | Clean separation; `/dm` stays untouched |
| **Message richness** | Text, images, files, emoji reactions, threaded replies, `@mentions`, `@channel` | Full Circle parity for v1 |
| **Typing indicators** | Yes — client-side only (no DB persistence) | Standard UX expectation |
| **Online presence** | Reuse `user:status` events already in `/dm` namespace | Already built, zero extra work |
| **History** | Fully persistent, no expiry, cursor-paginated | Same as DM messages |
| **Search** | Full-text search via MongoDB text index on `ChannelMessage.text` | Sufficient for v1 |
| **Moderation** | Edit, delete, pin messages; per-channel moderator role | Essential day-1 feature |
| **Notifications** | In-app + push for `@mention`; digest for high-traffic channels | Prevent notification fatigue |
| **AutoDM on join** | Extend existing email welcome flow with a DM + a welcome channel message | Close Skool parity gap too |
| **Creator studio** | Full channel management UI: create, edit, reorder, archive, manage members | Creators need control |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CHABAQA BACKEND                                  │
│                                                                             │
│  ┌─────────────────────┐    ┌──────────────────────────────────────────┐   │
│  │   channel.module.ts  │    │         Existing Modules (untouched)     │   │
│  │                      │    │  dm.module  notification.module           │   │
│  │  ┌────────────────┐  │    │  community-access.module                  │   │
│  │  │channel.gateway │◄─┼────┤  (reuse CommunityAccessService,           │   │
│  │  │ /channel ns    │  │    │   NotificationService, PolicyService)     │   │
│  │  └────────────────┘  │    └──────────────────────────────────────────┘   │
│  │  ┌────────────────┐  │                                                   │
│  │  │channel.service │  │    ┌──────────────────────────────────────────┐   │
│  │  └────────────────┘  │    │               MongoDB                     │   │
│  │  ┌────────────────┐  │    │  channels          channel_messages       │   │
│  │  │channel.ctrl    │  │    │  channel_members   channel_read_cursors   │   │
│  │  └────────────────┘  │    └──────────────────────────────────────────┘   │
│  └─────────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           CHABAQA FRONTEND                                  │
│                                                                             │
│  SocketProvider (lib/socket-context.tsx)                                    │
│    └── existing /dm socket (untouched)                                      │
│                                                                             │
│  ChannelSocketProvider (lib/channel-socket-context.tsx)  ← NEW              │
│    └── /channel Socket.IO namespace                                         │
│                                                                             │
│  app/(community)/[creator]/[feature]/(loggedUser)/                          │
│    ├── messages/          ← existing DM page (untouched)                    │
│    └── channels/          ← NEW pages                                       │
│         ├── page.tsx      ← channel list / last active channel              │
│         └── [channelId]/  ← individual channel chat view                   │
│              └── page.tsx                                                   │
│                                                                             │
│  app/(creator)/[feature]/community/channels/  ← NEW creator management      │
│    └── page.tsx                                                             │
│                                                                             │
│  lib/api/channel.api.ts   ← NEW API client module                           │
│  lib/api/types.ts         ← extend with Channel* types                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Socket namespaces summary

| Namespace | Purpose | Auth method | Existing? |
|---|---|---|---|
| `/dm` | 1-on-1 and help DMs | JWT in handshake | ✅ Yes — untouched |
| `/channel` | Community group chat channels | JWT in handshake | 🆕 New |
| `(default)` | In-app notifications, presence | register event | ✅ Yes — untouched |

---

## 3. Backend — Phase 1: Data Layer (Schemas)

Create four new schema files in `src/schema/`.

---

### 3.1 `src/schema/channel.schema.ts`

```typescript
// src/schema/channel.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ChannelType = 'TEXT' | 'ANNOUNCEMENTS' | 'COURSE_CHAT' | 'EVENT_CHAT'
export type ChannelVisibility = 'PUBLIC' | 'PRIVATE'

@Schema({ timestamps: true, collection: 'channels' })
export class Channel {
  @Prop({ type: Types.ObjectId, ref: 'Community', required: true, index: true })
  communityId: Types.ObjectId

  @Prop({ required: true, maxlength: 80 })
  name: string

  // URL-safe slug, e.g. "general", "vip-members", "course-101-chat"
  @Prop({ required: true, maxlength: 80, lowercase: true })
  slug: string

  @Prop({ maxlength: 280, default: '' })
  description: string

  @Prop({ type: String, enum: ['TEXT', 'ANNOUNCEMENTS', 'COURSE_CHAT', 'EVENT_CHAT'], default: 'TEXT' })
  type: ChannelType

  @Prop({ type: String, enum: ['PUBLIC', 'PRIVATE'], default: 'PUBLIC' })
  visibility: ChannelVisibility

  // Who created the channel (owner or admin)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId

  // Display order in sidebar (lower = higher)
  @Prop({ type: Number, default: 0, index: true })
  position: number

  // Archived channels are read-only and hidden from the sidebar by default
  @Prop({ type: Boolean, default: false, index: true })
  isArchived: boolean

  // Optional: pin this channel to the top of the sidebar
  @Prop({ type: Boolean, default: false })
  isPinned: boolean

  // For COURSE_CHAT — auto-created, linked to a course
  @Prop({ type: Types.ObjectId, ref: 'Course', default: null })
  linkedCourseId: Types.ObjectId | null

  // For EVENT_CHAT — auto-created, linked to an event
  @Prop({ type: Types.ObjectId, ref: 'Event', default: null })
  linkedEventId: Types.ObjectId | null

  // Counts (denormalized for performance)
  @Prop({ type: Number, default: 0 })
  memberCount: number

  @Prop({ type: Number, default: 0 })
  messageCount: number

  // Last message snapshot for sidebar preview
  @Prop({ type: Date, default: null })
  lastMessageAt: Date | null

  @Prop({ type: String, default: '' })
  lastMessagePreview: string

  // Optional: only members with these roles can send messages
  // Empty array = all members can post (except ANNOUNCEMENTS which is admin-only)
  @Prop({ type: [String], default: [] })
  allowedRoles: string[]

  // Optional emoji icon shown in sidebar (e.g. "🎓", "💬", "🔥")
  @Prop({ type: String, default: '' })
  emoji: string
}

export type ChannelDocument = Channel & Document
export const ChannelSchema = SchemaFactory.createForClass(Channel)

// Unique channel slug per community
ChannelSchema.index({ communityId: 1, slug: 1 }, { unique: true })
// Sort channels in sidebar
ChannelSchema.index({ communityId: 1, position: 1, isArchived: 1 })
// Fast lookup: all non-archived channels for a community
ChannelSchema.index({ communityId: 1, isArchived: 1, type: 1 })
```

---

### 3.2 `src/schema/channel-message.schema.ts`

```typescript
// src/schema/channel-message.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export class ChannelMessageAttachment {
  @Prop({ required: true }) url: string
  @Prop({ type: String, enum: ['image', 'video', 'file', 'audio'] }) type: string
  @Prop() size: number
  @Prop() name: string     // original filename for download
  @Prop() mimeType: string
}

export class ChannelMessageReaction {
  @Prop({ required: true }) emoji: string
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] }) userIds: Types.ObjectId[]
}

@Schema({ timestamps: true, collection: 'channel_messages' })
export class ChannelMessage {
  @Prop({ type: Types.ObjectId, ref: 'Channel', required: true, index: true })
  channelId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Community', required: true, index: true })
  communityId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId: Types.ObjectId

  @Prop({ type: String, default: '' })
  text: string

  @Prop({ type: [ChannelMessageAttachment], default: [] })
  attachments: ChannelMessageAttachment[]

  @Prop({ type: [ChannelMessageReaction], default: [] })
  reactions: ChannelMessageReaction[]

  // For threaded replies — references the parent message
  @Prop({ type: Types.ObjectId, ref: 'ChannelMessage', default: null, index: true })
  parentMessageId: Types.ObjectId | null

  // Denormalized reply count on parent (only set on parent messages)
  @Prop({ type: Number, default: 0 })
  replyCount: number

  // Mentions: array of user IDs mentioned in this message
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  mentions: Types.ObjectId[]

  // Pinned messages
  @Prop({ type: Boolean, default: false, index: true })
  isPinned: boolean

  // Soft-delete: users who deleted this message for themselves (or empty if hard-deleted by mod)
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  deletedFor: Types.ObjectId[]

  // True if a moderator hard-deleted the message (content is wiped, record kept for audit)
  @Prop({ type: Boolean, default: false })
  isModeratorDeleted: boolean

  // Edited tracking
  @Prop({ type: Date, default: null })
  editedAt: Date | null

  // Link preview cache (unfurled from text)
  @Prop({ type: Object, default: null })
  linkPreview: {
    url: string
    title: string
    description: string
    image: string
  } | null

  // System messages (e.g. "Alice joined the channel")
  @Prop({ type: Boolean, default: false })
  isSystem: boolean

  @Prop({ type: String, default: null })
  systemEvent: string | null // e.g. 'member_joined' | 'channel_created' | 'member_left'
}

export type ChannelMessageDocument = ChannelMessage & Document
export const ChannelMessageSchema = SchemaFactory.createForClass(ChannelMessage)

// Add text index for full-text search
ChannelMessageSchema.index({ text: 'text' })
// Primary query: messages in a channel, newest first
ChannelMessageSchema.index({ channelId: 1, createdAt: -1 })
// Replies to a specific parent
ChannelMessageSchema.index({ parentMessageId: 1, createdAt: 1 })
// Mentions query: "find all messages that mention user X in channel Y"
ChannelMessageSchema.index({ channelId: 1, mentions: 1 })
// Pinned messages lookup
ChannelMessageSchema.index({ channelId: 1, isPinned: 1 })
```

---

### 3.3 `src/schema/channel-member.schema.ts`

```typescript
// src/schema/channel-member.schema.ts

// Tracks per-member channel membership for PRIVATE channels,
// and per-member settings (muted, notif prefs) for all channels.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ChannelMemberRole = 'member' | 'moderator'

@Schema({ timestamps: true, collection: 'channel_members' })
export class ChannelMember {
  @Prop({ type: Types.ObjectId, ref: 'Channel', required: true, index: true })
  channelId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Community', required: true, index: true })
  communityId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId

  @Prop({ type: String, enum: ['member', 'moderator'], default: 'member' })
  role: ChannelMemberRole

  // Is the user muted in this channel?
  @Prop({ type: Boolean, default: false })
  isMuted: boolean

  // Notification preference for this channel
  // 'all' = every message | 'mentions' = only @mentions | 'none' = silent
  @Prop({ type: String, enum: ['all', 'mentions', 'none'], default: 'mentions' })
  notificationLevel: 'all' | 'mentions' | 'none'

  // When the user was added to a private channel
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  addedBy: Types.ObjectId | null
}

export type ChannelMemberDocument = ChannelMember & Document
export const ChannelMemberSchema = SchemaFactory.createForClass(ChannelMember)

// Each user can only be a member of a channel once
ChannelMemberSchema.index({ channelId: 1, userId: 1 }, { unique: true })
// All members of a channel (for fan-out)
ChannelMemberSchema.index({ channelId: 1, role: 1 })
// All channels a user is in (for their sidebar)
ChannelMemberSchema.index({ userId: 1, communityId: 1 })
```

---

### 3.4 `src/schema/channel-read-cursor.schema.ts`

```typescript
// src/schema/channel-read-cursor.schema.ts

// Tracks the last message a user has read in each channel.
// Unread count = count(messages where createdAt > lastReadAt AND channelId = X)
// This is the most efficient approach for a high-traffic channel.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ collection: 'channel_read_cursors' })
export class ChannelReadCursor {
  @Prop({ type: Types.ObjectId, ref: 'Channel', required: true })
  channelId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId

  // The ID of the last message the user has read
  @Prop({ type: Types.ObjectId, ref: 'ChannelMessage', default: null })
  lastReadMessageId: Types.ObjectId | null

  // The timestamp of the last message the user has read
  // (used for unread count query: count where createdAt > lastReadAt)
  @Prop({ type: Date, default: null })
  lastReadAt: Date | null

  // Denormalized count of unread messages (updated on new message + on read)
  // Stored for fast sidebar badge rendering (avoid a count query per channel on page load)
  @Prop({ type: Number, default: 0 })
  unreadCount: number
}

export type ChannelReadCursorDocument = ChannelReadCursor & Document
export const ChannelReadCursorSchema = SchemaFactory.createForClass(ChannelReadCursor)

// Primary access pattern: look up cursor for a user+channel
ChannelReadCursorSchema.index({ channelId: 1, userId: 1 }, { unique: true })
// Load all cursors for a user (sidebar badge counts)
ChannelReadCursorSchema.index({ userId: 1, communityId: 1 })
```

> **Why a cursor model instead of per-message read receipts?**
> In a group channel with 500 members, per-message read receipts would create 500 DB writes for every message sent. A cursor model creates one `upsert` per user when they open the channel, scaling linearly with active users rather than messages × members.

---

## 4. Backend — Phase 2: Permission System Extensions

### 4.1 Add new permission keys

Edit `src/common/permissions/community-roles.constants.ts`.

Add to the `CommunityPermission` enum:

```typescript
// Channel permissions
CHANNELS_VIEW   = 'channels.view',    // Can see the channels tab
CHANNELS_SEND   = 'channels.send',    // Can send messages in TEXT channels
CHANNELS_MANAGE = 'channels.manage',  // Can create/edit/delete/archive channels
CHANNELS_MODERATE = 'channels.moderate', // Can delete/pin others' messages
```

### 4.2 Add permissions to the role map

Edit the `ROLE_PERMISSIONS` map (where permissions are assigned to roles):

```typescript
// OWNER and ADMIN: all channel permissions
CHANNELS_VIEW, CHANNELS_SEND, CHANNELS_MANAGE, CHANNELS_MODERATE

// MODERATOR: view, send, moderate (not manage — can't create/delete channels)
CHANNELS_VIEW, CHANNELS_SEND, CHANNELS_MODERATE

// SUPPORT: view and send only
CHANNELS_VIEW, CHANNELS_SEND

// MEMBER: view and send only (default)
CHANNELS_VIEW, CHANNELS_SEND

// NONE: no channel access
// (used when a user tries to access a community they're not a member of)
```

### 4.3 Channel-level role override

For PRIVATE channels and per-channel moderation, add a channel-specific role system.
This is handled by the `ChannelMember.role` field (either `'member'` or `'moderator'`).

The resolution order for channel permissions:
1. Check `CommunityRole` via `CommunityAccessService.getCommunityRole()`
2. If role is `OWNER`, `ADMIN`, or `MODERATOR` → full access regardless
3. For `MEMBER` role: check `ChannelMember.role` for the specific channel
4. For PRIVATE channels: verify `ChannelMember` record exists (throws `ForbiddenException` if not)
5. For ANNOUNCEMENTS channels: only `OWNER`, `ADMIN` can send

---

## 5. Backend — Phase 3: WebSocket Gateway

### 5.1 Create `src/channel/channel.gateway.ts`

This mirrors `DmGateway` but uses the `/channel` namespace and room name convention `ch:<channelId>`.

```typescript
// src/channel/channel.gateway.ts

import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  ConnectedSocket, MessageBody, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

@WebSocketGateway({ namespace: '/channel', cors: { origin: '*', credentials: true } })
export class ChannelGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  // userId → Set<socketId>  (multi-tab support)
  private onlineUsers = new Map<string, Set<string>>()

  constructor(
    private readonly jwtService: JwtService,
    // Inject User model for auth validation
  ) {}

  // ─── Connection lifecycle ────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    // 1. Extract token from client.handshake.auth.token or Authorization header
    // 2. Verify JWT, extract userId
    // 3. If invalid → client.disconnect(); return
    // 4. Store client.data.userId = userId
    // 5. client.join(`user:${userId}`)  — for targeted notifications
    // 6. Add to onlineUsers map
    // 7. Broadcast user:status online to all in /channel namespace
  }

  async handleDisconnect(client: Socket) {
    // 1. Remove socket from onlineUsers map
    // 2. If user has no other sockets left → broadcast user:status offline
    // 3. Clean up any rooms the client joined (Socket.IO does this automatically)
  }

  // ─── Client → Server events ──────────────────────────────────────────────────

  @SubscribeMessage('channel:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    // 1. Validate client.data.userId is set
    // 2. Verify user has access to this channel (call ChannelService.assertChannelAccess)
    // 3. client.join(`ch:${data.channelId}`)
    // 4. Return acknowledgement { success: true }
  }

  @SubscribeMessage('channel:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    client.leave(`ch:${data.channelId}`)
  }

  @SubscribeMessage('channel:typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    // Broadcast to channel room (exclude sender)
    // Shape: { userId, channelId, username, avatar }
    client.to(`ch:${data.channelId}`).emit('channel:typing:start', {
      userId: client.data.userId,
      channelId: data.channelId,
      // username and avatar resolved by ChannelService
    })
  }

  @SubscribeMessage('channel:typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    client.to(`ch:${data.channelId}`).emit('channel:typing:stop', {
      userId: client.data.userId,
      channelId: data.channelId,
    })
  }

  @SubscribeMessage('channel:get-online-users')
  async handleGetOnlineUsers(
    @ConnectedSocket() client: Socket,
  ): Promise<string[]> {
    return Array.from(this.onlineUsers.keys())
  }

  // ─── Server → Client emit methods (called by ChannelService) ────────────────

  emitNewMessage(channelId: string, message: any) {
    // Emit to all sockets in the channel room
    this.server.to(`ch:${channelId}`).emit('channel:message:new', message)
  }

  emitMessageEdited(channelId: string, message: any) {
    this.server.to(`ch:${channelId}`).emit('channel:message:edited', message)
  }

  emitMessageDeleted(channelId: string, messageId: string, deletedBy: string) {
    this.server.to(`ch:${channelId}`).emit('channel:message:deleted', {
      channelId,
      messageId,
      deletedBy,
    })
  }

  emitReactionUpdate(channelId: string, messageId: string, reactions: any[]) {
    this.server.to(`ch:${channelId}`).emit('channel:message:reaction', {
      channelId,
      messageId,
      reactions,
    })
  }

  emitPinnedMessage(channelId: string, message: any) {
    this.server.to(`ch:${channelId}`).emit('channel:message:pinned', message)
  }

  emitUnreadCountUpdate(userId: string, channelId: string, unreadCount: number) {
    // Targeted to a specific user across all their tabs
    this.server.to(`user:${userId}`).emit('channel:unread:update', {
      channelId,
      unreadCount,
    })
  }

  emitChannelUpdated(communityId: string, channel: any) {
    // Emit to all users in any channel of this community
    // Use community room for this: `community:${communityId}`
    this.server.to(`community:${communityId}`).emit('channel:updated', channel)
  }

  emitChannelCreated(communityId: string, channel: any) {
    this.server.to(`community:${communityId}`).emit('channel:created', channel)
  }

  emitChannelDeleted(communityId: string, channelId: string) {
    this.server.to(`community:${communityId}`).emit('channel:deleted', { channelId })
  }
}
```

### 5.2 Community room management

When a user opens the community, they join a community-level room for receiving sidebar updates (channel creation, channel reordering, etc.):

```
client:  socket.emit('channel:join-community', { communityId })
server:  client.join(`community:${communityId}`)
```

---

## 6. Backend — Phase 4: Service Layer

### 6.1 Create `src/channel/channel.service.ts`

This is the core business logic layer. It handles all channel and message operations.

#### Constructor dependencies:
```typescript
constructor(
  @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
  @InjectModel(ChannelMessage.name) private messageModel: Model<ChannelMessageDocument>,
  @InjectModel(ChannelMember.name) private memberModel: Model<ChannelMemberDocument>,
  @InjectModel(ChannelReadCursor.name) private cursorModel: Model<ChannelReadCursorDocument>,
  @InjectModel(Community.name) private communityModel: Model<CommunityDocument>,
  @InjectModel(User.name) private userModel: Model<UserDocument>,
  private readonly channelGateway: ChannelGateway,
  private readonly communityAccessService: CommunityAccessService,
  private readonly notificationService: NotificationService,
  private readonly uploadService: UploadService,
)
```

#### Channel CRUD methods:

```
createChannel(creatorId, dto: CreateChannelDto) → Channel
  1. Verify creatorId has CHANNELS_MANAGE permission in communityId
  2. Generate slug from name (slugify, ensure unique within community)
  3. Determine position (last in list)
  4. Create Channel document
  5. If PUBLIC: all current community members automatically "see" it (no ChannelMember record needed)
  6. If PRIVATE: create ChannelMember records for createdBy only
  7. Create system message: 'channel_created'
  8. Emit channelGateway.emitChannelCreated(communityId, channel)
  9. Return populated channel

listChannels(userId, communityId) → ChannelWithUnread[]
  1. Verify userId is member of communityId
  2. Fetch all non-archived channels for community (sorted by position)
  3. For PRIVATE channels: filter to those where ChannelMember record exists OR user is OWNER/ADMIN
  4. Batch-fetch ChannelReadCursor records for userId + these channelIds
  5. Merge unreadCount onto each channel
  6. Return sorted list

getChannel(userId, channelId) → Channel
  1. Fetch channel by ID
  2. Assert user has access (see assertChannelAccess)
  3. Return channel

updateChannel(editorId, channelId, dto: UpdateChannelDto) → Channel
  1. Assert CHANNELS_MANAGE permission
  2. If name changed, regenerate slug (check uniqueness)
  3. Update fields
  4. Emit channelGateway.emitChannelUpdated(communityId, updated)

deleteChannel(deleterId, channelId) → void
  1. Assert CHANNELS_MANAGE permission
  2. Soft-delete: set isArchived = true (keep history)
  3. OR hard-delete: delete all messages (only OWNER can do this)
  4. Emit channelGateway.emitChannelDeleted(communityId, channelId)

reorderChannels(ownerId, communityId, orderedIds: string[]) → void
  1. Assert CHANNELS_MANAGE
  2. Bulk update position fields in MongoDB using BulkWrite
  3. Emit channelGateway.emitChannelUpdated for each changed channel (or one batch event)

archiveChannel(adminId, channelId) → Channel
  1. Assert CHANNELS_MANAGE
  2. Set isArchived = true
  3. Emit update

createAutoChannel(communityId, linkedId, type, createdById) → Channel
  Called automatically when a course or event is published.
  Creates a COURSE_CHAT or EVENT_CHAT channel with linkedCourseId/linkedEventId.
```

#### Channel membership methods:

```
addMembersToPrivateChannel(adminId, channelId, userIds[]) → void
  1. Assert CHANNELS_MANAGE or channel moderator role
  2. Verify all userIds are community members
  3. Upsert ChannelMember records
  4. Update channel.memberCount
  5. Send system message: 'member_joined' for each
  6. Emit emitNewMessage for system messages

removeMemberFromChannel(adminId, channelId, targetUserId) → void
  1. Assert CHANNELS_MANAGE or channel moderator
  2. Delete ChannelMember record
  3. Update memberCount
  4. System message: 'member_left'

setChannelMemberRole(adminId, channelId, targetUserId, role) → void
  Updates ChannelMember.role field. Used to promote/demote channel moderators.

updateMemberNotificationPreference(userId, channelId, level) → void
  Upserts ChannelMember.notificationLevel for the user.
  This is called from the user's notification settings UI.

muteChannel(adminId, channelId, targetUserId) → void
  Sets ChannelMember.isMuted = true. User can still read, cannot send.
```

#### Message methods:

```
sendMessage(senderId, channelId, dto: SendChannelMessageDto) → ChannelMessage
  1. assertChannelAccess(senderId, channelId) — throws if no access
  2. assertCanSend(senderId, channelId) — checks ANNOUNCEMENTS + mute + CHANNELS_SEND
  3. Parse @mentions from text (extract @username, resolve to userIds)
  4. Create ChannelMessage document
  5. Update channel.lastMessageAt + lastMessagePreview + messageCount
  6. Increment unreadCount in ChannelReadCursor for all PUBLIC channel members
     (use BulkWrite: updateMany where userId != senderId)
  7. channelGateway.emitNewMessage(channelId, populatedMessage)
  8. Fire notifications for @mentions (see Phase 6)
  9. Return populated message (with sender info)

listMessages(userId, channelId, cursor?: string, limit = 50) → ChannelMessagesPage
  Cursor-paginated (cursor = last message's createdAt timestamp, not page-based).
  1. assertChannelAccess
  2. Query: { channelId, parentMessageId: null, createdAt: { $lt: cursor ?? now } }
     sorted by createdAt DESC, limit
  3. Populate senderId with { firstName, lastName, username, avatar }
  4. Return { messages, nextCursor, hasMore }

listThreadReplies(userId, channelId, parentMessageId, cursor?) → ChannelMessagesPage
  Same pattern but filters: { parentMessageId }

getMessageContext(userId, channelId, messageId) → surrounding messages for deep-link

editMessage(editorId, messageId, newText) → ChannelMessage
  1. Verify sender = editorId (members can only edit own messages)
  2. OR verify CHANNELS_MODERATE permission (mods can edit any)
  3. Update text, set editedAt = now
  4. channelGateway.emitMessageEdited(channelId, updated)

deleteMessage(deleterId, messageId) → void
  1. If deleterId === senderId: soft-delete (deletedFor = [deleterId])
  2. If CHANNELS_MODERATE: set isModeratorDeleted = true, clear text, clear attachments
  3. channelGateway.emitMessageDeleted(channelId, messageId, deleterId)

pinMessage(adminId, messageId) → ChannelMessage
  1. Assert CHANNELS_MODERATE
  2. Limit: max 5 pinned messages per channel (enforce before pinning)
  3. Set isPinned = true
  4. channelGateway.emitPinnedMessage(channelId, message)

unpinMessage(adminId, messageId) → void

listPinnedMessages(userId, channelId) → ChannelMessage[]

addReaction(userId, messageId, emoji) → ChannelMessage['reactions']
  1. assertChannelAccess
  2. Find or create reaction entry for this emoji
  3. Toggle: if userId already in userIds → remove; else add
  4. Atomic $addToSet / $pull on reactions sub-document
  5. channelGateway.emitReactionUpdate(channelId, messageId, updatedReactions)

searchMessages(userId, communityId, query, channelId?) → ChannelMessage[]
  Uses MongoDB text index on ChannelMessage.text
  Scoped to communityId (+ optional channelId)
  Returns messages with highlighted snippet

markChannelAsRead(userId, channelId) → void
  1. Find latest message in channel
  2. Upsert ChannelReadCursor: { lastReadMessageId, lastReadAt, unreadCount: 0 }
  3. channelGateway.emitUnreadCountUpdate(userId, channelId, 0)

getUnreadCounts(userId, communityId) → { channelId: string, unreadCount: number }[]
  Batch fetch all ChannelReadCursor records for user + community.
  Called on page load to populate sidebar badges.
```

#### Access assertion methods (private helpers):

```
assertChannelAccess(userId, channelId) → void
  Fetch channel → fetch community role for user:
  - If role is NONE: throw ForbiddenException
  - If channel is PRIVATE: check ChannelMember record exists; throw if not
  - If channel is archived: allow read (throw if trying to write)

assertCanSend(userId, channelId) → void
  - If channel type is ANNOUNCEMENTS:
    check role >= ADMIN; throw if MEMBER
  - If ChannelMember.isMuted = true: throw ForbiddenException('You are muted')
  - If channel.allowedRoles.length > 0:
    check user's communityRole is in allowedRoles
```

---

## 7. Backend — Phase 5: REST Controller & Endpoints

### 7.1 Create `src/channel/channel.controller.ts`

All routes are prefixed `/channel`.

#### Channel management (creator/admin)

| Method | Route | Guard | Description |
|---|---|---|---|
| `POST` | `/channel` | JWT + `CHANNELS_MANAGE` | Create a new channel |
| `GET` | `/channel/community/:communityId` | JWT | List all accessible channels + unread counts |
| `GET` | `/channel/:channelId` | JWT | Get single channel details |
| `PATCH` | `/channel/:channelId` | JWT + `CHANNELS_MANAGE` | Update channel (name, desc, emoji, visibility) |
| `DELETE` | `/channel/:channelId` | JWT + `CHANNELS_MANAGE` | Archive or delete channel |
| `PATCH` | `/channel/community/:communityId/reorder` | JWT + `CHANNELS_MANAGE` | Bulk reorder channels |

#### Channel membership

| Method | Route | Guard | Description |
|---|---|---|---|
| `POST` | `/channel/:channelId/members` | JWT + `CHANNELS_MANAGE` | Add members to private channel |
| `DELETE` | `/channel/:channelId/members/:userId` | JWT + `CHANNELS_MANAGE` | Remove member from channel |
| `PATCH` | `/channel/:channelId/members/:userId/role` | JWT + `CHANNELS_MANAGE` | Set channel moderator role |
| `PATCH` | `/channel/:channelId/members/:userId/mute` | JWT + `CHANNELS_MODERATE` | Mute a member in a channel |
| `GET` | `/channel/:channelId/members` | JWT | List members of a private channel |
| `PATCH` | `/channel/:channelId/me/notifications` | JWT | Update my notification preference for this channel |

#### Messages

| Method | Route | Guard | Description |
|---|---|---|---|
| `GET` | `/channel/:channelId/messages` | JWT | List messages (cursor-paginated) |
| `POST` | `/channel/:channelId/messages` | JWT | Send a message (throttled: 30/min) |
| `POST` | `/channel/:channelId/attachments` | JWT | Upload attachment (multipart, max 100MB) |
| `PATCH` | `/channel/:channelId/messages/:messageId` | JWT | Edit own message |
| `DELETE` | `/channel/:channelId/messages/:messageId` | JWT | Delete message (own or mod) |
| `PATCH` | `/channel/:channelId/messages/:messageId/pin` | JWT + `CHANNELS_MODERATE` | Pin a message |
| `DELETE` | `/channel/:channelId/messages/:messageId/pin` | JWT + `CHANNELS_MODERATE` | Unpin a message |
| `GET` | `/channel/:channelId/messages/pinned` | JWT | List pinned messages |
| `POST` | `/channel/:channelId/messages/:messageId/reactions` | JWT | Add/toggle a reaction |
| `GET` | `/channel/:channelId/messages/:messageId/thread` | JWT | List threaded replies |
| `POST` | `/channel/:channelId/messages/:messageId/thread` | JWT | Reply in a thread |
| `PATCH` | `/channel/:channelId/read` | JWT | Mark channel as read (update cursor) |
| `GET` | `/channel/community/:communityId/unread` | JWT | Get all unread counts for my channels |
| `GET` | `/channel/community/:communityId/search` | JWT | Search messages across channels |

### 7.2 DTOs

```
// src/dto-channel/create-channel.dto.ts
CreateChannelDto {
  communityId: string (required)
  name: string (required, 1-80 chars)
  description?: string (max 280 chars)
  type?: ChannelType (default 'TEXT')
  visibility?: ChannelVisibility (default 'PUBLIC')
  emoji?: string
  allowedRoles?: string[]
}

// src/dto-channel/update-channel.dto.ts
UpdateChannelDto (Partial<CreateChannelDto> minus communityId)

// src/dto-channel/send-channel-message.dto.ts
SendChannelMessageDto {
  text?: string
  parentMessageId?: string  (for threaded replies)
  // attachments come via multipart or are pre-uploaded URLs
}

// src/dto-channel/add-reaction.dto.ts
AddReactionDto {
  emoji: string  (validated: must be a single emoji character)
}

// src/dto-channel/reorder-channels.dto.ts
ReorderChannelsDto {
  orderedIds: string[]
}
```

---

## 8. Backend — Phase 6: Notification System Extensions

### 8.1 Add new notification types

Edit `src/notification/notification-types.ts`:

```typescript
// Add to NotificationType enum:
CHANNEL_MENTION         = 'channel_mention',         // @mention in a channel
CHANNEL_REPLY           = 'channel_reply',            // someone replied in a thread you're in
CHANNEL_CREATED         = 'channel_created',          // new channel created in community
CHANNEL_ALL_MESSAGE     = 'channel_all_message',      // for users with 'all' notify level
```

### 8.2 Notification trigger logic in `ChannelService.sendMessage()`

```typescript
// After creating the message and emitting the socket event:

const mentions = message.mentions  // resolved user IDs

// 1. Notify @mentioned users
for (const mentionedUserId of mentions) {
  if (mentionedUserId === senderId) continue
  await notificationService.createNotification({
    type: NotificationType.CHANNEL_MENTION,
    recipientId: mentionedUserId,
    senderId: senderId,
    communityId: channel.communityId,
    title: `${senderName} mentioned you in #${channel.name}`,
    body: truncate(message.text, 100),
    data: {
      channelId: message.channelId,
      messageId: message._id,
      communityId: channel.communityId,
      dedupeKey: `channel_mention_${message._id}_${mentionedUserId}`,
    },
  })
}

// 2. Notify users with 'all' notification level (not the sender, not already notified)
const allNotifyMembers = await memberModel.find({
  channelId: channel._id,
  userId: { $nin: [senderId, ...mentions] },
  notificationLevel: 'all',
  isMuted: false,
})
if (allNotifyMembers.length > 0) {
  await notificationService.createNotificationBulk({
    type: NotificationType.CHANNEL_ALL_MESSAGE,
    recipientIds: allNotifyMembers.map(m => m.userId.toString()),
    senderId,
    title: `#${channel.name}: ${senderName}`,
    body: truncate(message.text, 100),
    data: { channelId: message.channelId.toString(), messageId: message._id.toString() },
  })
}
```

> **Anti-spam protection:** The `NotificationService` already handles quiet hours and deduplication. For high-traffic channels, `notificationLevel: 'all'` should default to a digest email rather than a push notification per message. Configure this in the notification preference service.

---

## 9. Backend — Phase 7: Module Wiring

### 9.1 Create `src/channel/channel.module.ts`

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Channel.name, schema: ChannelSchema },
      { name: ChannelMessage.name, schema: ChannelMessageSchema },
      { name: ChannelMember.name, schema: ChannelMemberSchema },
      { name: ChannelReadCursor.name, schema: ChannelReadCursorSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule,
    NotificationModule,
    CommunityAccessModule,
    UploadModule,
  ],
  controllers: [ChannelController],
  providers: [ChannelService, ChannelGateway],
  exports: [ChannelService],  // exported for CourseModule and EventModule to call createAutoChannel
})
export class ChannelModule {}
```

### 9.2 Register in `LearningDomainModule` and `CommunityDomainModule`

Import `ChannelModule` into `src/domains/community-domain.module.ts` and `src/domains/learning-domain.module.ts`.

### 9.3 Auto-channel hooks (Course and Event modules)

In `CoursService`, after a course is published, call:
```typescript
await channelService.createAutoChannel(
  course.communityId,
  course._id,
  'COURSE_CHAT',
  course.createdBy,
)
```

In `EventService`, after an event is created, call:
```typescript
await channelService.createAutoChannel(
  event.communityId,
  event._id,
  'EVENT_CHAT',
  event.createdBy,
)
```

### 9.4 Auto-add members to channels on community join

In `communities-aff-crea-join` module, after a user joins a community, automatically create a `ChannelReadCursor` for each PUBLIC channel in that community (cursor starts at null, unreadCount = 0).

---

## 10. Frontend — Phase 1: Types & API Client

### 10.1 Add types to `lib/api/types.ts`

```typescript
// ─── Channel Types ───────────────────────────────────────────────────────────

export type ChannelType = 'TEXT' | 'ANNOUNCEMENTS' | 'COURSE_CHAT' | 'EVENT_CHAT'
export type ChannelVisibility = 'PUBLIC' | 'PRIVATE'
export type ChannelNotificationLevel = 'all' | 'mentions' | 'none'

export interface Channel {
  id: string
  communityId: string
  name: string
  slug: string
  description: string
  type: ChannelType
  visibility: ChannelVisibility
  createdBy: string
  position: number
  isArchived: boolean
  isPinned: boolean
  linkedCourseId?: string
  linkedEventId?: string
  memberCount: number
  messageCount: number
  lastMessageAt?: string
  lastMessagePreview: string
  allowedRoles: string[]
  emoji: string
  createdAt: string
  updatedAt: string
  // merged from ChannelReadCursor
  unreadCount?: number
  // merged from ChannelMember (if PRIVATE)
  myRole?: 'member' | 'moderator'
  myNotificationLevel?: ChannelNotificationLevel
  isMuted?: boolean
}

export interface ChannelMessageAttachment {
  url: string
  type: 'image' | 'video' | 'file' | 'audio'
  size: number
  name: string
  mimeType: string
}

export interface ChannelMessageReaction {
  emoji: string
  userIds: string[]
  // client-side computed:
  count: number
  reactedByMe: boolean
}

export interface ChannelMessage {
  id: string
  channelId: string
  communityId: string
  senderId: string
  text: string
  attachments: ChannelMessageAttachment[]
  reactions: ChannelMessageReaction[]
  parentMessageId?: string
  replyCount: number
  mentions: string[]
  isPinned: boolean
  isModeratorDeleted: boolean
  editedAt?: string
  isSystem: boolean
  systemEvent?: string
  linkPreview?: {
    url: string
    title: string
    description: string
    image: string
  }
  createdAt: string
  updatedAt: string
  // populated sender info
  sender?: {
    id: string
    name: string
    username: string
    avatar?: string
    role?: string  // community role for display badge
  }
  // client-side only
  _tempId?: string          // optimistic ID before server confirms
  _isOptimistic?: boolean   // render with sending state
  _isFailed?: boolean       // render with retry option
}

export interface ChannelMessagesPage {
  messages: ChannelMessage[]
  nextCursor: string | null
  hasMore: boolean
}

export interface ChannelListResponse {
  channels: Channel[]
  totalUnread: number
}

export interface ChannelMember {
  id: string
  channelId: string
  userId: string
  role: 'member' | 'moderator'
  isMuted: boolean
  notificationLevel: ChannelNotificationLevel
  user: {
    id: string
    name: string
    username: string
    avatar?: string
  }
}

// ─── Typing indicators (client-side only, never persisted) ──────────────────

export interface TypingUser {
  userId: string
  username: string
  avatar?: string
  channelId: string
}

// ─── Socket event payloads ───────────────────────────────────────────────────

export interface ChannelSocketEvents {
  // Server → Client
  'channel:message:new':      { channelId: string; message: ChannelMessage }
  'channel:message:edited':   { channelId: string; message: ChannelMessage }
  'channel:message:deleted':  { channelId: string; messageId: string; deletedBy: string }
  'channel:message:reaction': { channelId: string; messageId: string; reactions: ChannelMessageReaction[] }
  'channel:message:pinned':   { channelId: string; message: ChannelMessage }
  'channel:typing:start':     TypingUser
  'channel:typing:stop':      { userId: string; channelId: string }
  'channel:unread:update':    { channelId: string; unreadCount: number }
  'channel:created':          Channel
  'channel:updated':          Channel
  'channel:deleted':          { channelId: string }
  'user:status':              { userId: string; status: 'online' | 'offline' }
  // Client → Server
  'channel:join':             { channelId: string }
  'channel:leave':            { channelId: string }
  'channel:join-community':   { communityId: string }
  'channel:typing:start':     { channelId: string }
  'channel:typing:stop':      { channelId: string }
  'channel:get-online-users': never
}
```

---

### 10.2 Create `lib/api/channel.api.ts`

```typescript
// lib/api/channel.api.ts

import { apiClient } from './client'
import type {
  Channel, ChannelListResponse, ChannelMessage, ChannelMessagesPage,
  ChannelMember, ChannelNotificationLevel,
} from './types'

export const channelApi = {
  // ─── Channel CRUD ─────────────────────────────────────────────────────────
  create: (dto: {
    communityId: string
    name: string
    description?: string
    type?: string
    visibility?: string
    emoji?: string
  }) => apiClient.post<Channel>('/channel', dto),

  listByCommunity: (communityId: string) =>
    apiClient.get<ChannelListResponse>(`/channel/community/${communityId}`),

  getById: (channelId: string) =>
    apiClient.get<Channel>(`/channel/${channelId}`),

  update: (channelId: string, dto: Partial<{
    name: string
    description: string
    emoji: string
    visibility: string
    allowedRoles: string[]
  }>) => apiClient.patch<Channel>(`/channel/${channelId}`, dto),

  archive: (channelId: string) =>
    apiClient.delete<void>(`/channel/${channelId}`),

  reorder: (communityId: string, orderedIds: string[]) =>
    apiClient.patch<void>(`/channel/community/${communityId}/reorder`, { orderedIds }),

  // ─── Membership ───────────────────────────────────────────────────────────
  addMembers: (channelId: string, userIds: string[]) =>
    apiClient.post<void>(`/channel/${channelId}/members`, { userIds }),

  removeMember: (channelId: string, userId: string) =>
    apiClient.delete<void>(`/channel/${channelId}/members/${userId}`),

  setMemberRole: (channelId: string, userId: string, role: 'member' | 'moderator') =>
    apiClient.patch<void>(`/channel/${channelId}/members/${userId}/role`, { role }),

  muteMember: (channelId: string, userId: string, muted: boolean) =>
    apiClient.patch<void>(`/channel/${channelId}/members/${userId}/mute`, { muted }),

  listMembers: (channelId: string) =>
    apiClient.get<ChannelMember[]>(`/channel/${channelId}/members`),

  updateMyNotifications: (channelId: string, level: ChannelNotificationLevel) =>
    apiClient.patch<void>(`/channel/${channelId}/me/notifications`, { level }),

  // ─── Messages ─────────────────────────────────────────────────────────────
  listMessages: (channelId: string, params?: { cursor?: string; limit?: number }) =>
    apiClient.get<ChannelMessagesPage>(`/channel/${channelId}/messages`, params),

  sendMessage: (channelId: string, dto: { text?: string; parentMessageId?: string }) =>
    apiClient.post<ChannelMessage>(`/channel/${channelId}/messages`, dto),

  uploadAttachment: (channelId: string, file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.postFormData<ChannelMessage>(
      `/channel/${channelId}/attachments`,
      formData,
      onProgress,
    )
  },

  editMessage: (channelId: string, messageId: string, text: string) =>
    apiClient.patch<ChannelMessage>(`/channel/${channelId}/messages/${messageId}`, { text }),

  deleteMessage: (channelId: string, messageId: string) =>
    apiClient.delete<void>(`/channel/${channelId}/messages/${messageId}`),

  pinMessage: (channelId: string, messageId: string) =>
    apiClient.patch<void>(`/channel/${channelId}/messages/${messageId}/pin`, {}),

  unpinMessage: (channelId: string, messageId: string) =>
    apiClient.delete<void>(`/channel/${channelId}/messages/${messageId}/pin`),

  listPinnedMessages: (channelId: string) =>
    apiClient.get<ChannelMessage[]>(`/channel/${channelId}/messages/pinned`),

  addReaction: (channelId: string, messageId: string, emoji: string) =>
    apiClient.post<ChannelMessage['reactions']>(
      `/channel/${channelId}/messages/${messageId}/reactions`,
      { emoji },
    ),

  listThreadReplies: (channelId: string, messageId: string, params?: { cursor?: string }) =>
    apiClient.get<ChannelMessagesPage>(
      `/channel/${channelId}/messages/${messageId}/thread`,
      params,
    ),

  sendThreadReply: (channelId: string, parentMessageId: string, dto: { text: string }) =>
    apiClient.post<ChannelMessage>(
      `/channel/${channelId}/messages/${parentMessageId}/thread`,
      dto,
    ),

  // ─── Read state ───────────────────────────────────────────────────────────
  markAsRead: (channelId: string) =>
    apiClient.patch<void>(`/channel/${channelId}/read`, {}),

  getUnreadCounts: (communityId: string) =>
    apiClient.get<{ channelId: string; unreadCount: number }[]>(
      `/channel/community/${communityId}/unread`,
    ),

  // ─── Search ───────────────────────────────────────────────────────────────
  searchMessages: (communityId: string, query: string, channelId?: string) =>
    apiClient.get<ChannelMessage[]>(`/channel/community/${communityId}/search`, {
      q: query,
      channelId,
    }),
}
```

### 10.3 Add to `lib/api/index.ts`

```typescript
import { channelApi as channel } from './channel.api'

export const api = {
  // ... existing modules ...
  channel,
}
```

---

## 11. Frontend — Phase 2: Socket Hook

### 11.1 Create `lib/channel-socket-context.tsx`

A new context, separate from the DM socket, connecting to the `/channel` namespace.

```typescript
// lib/channel-socket-context.tsx

'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthContext } from '@/app/providers/auth-provider'
import { resolveSocketBaseUrl } from '@/lib/socket-url'
import type { Channel, ChannelMessage, ChannelMessageReaction, TypingUser } from '@/lib/api/types'

interface ChannelSocketContextType {
  socket: Socket | null
  isConnected: boolean
  onlineUsers: Set<string>
  // Typing state per channel: channelId → TypingUser[]
  typingUsers: Map<string, TypingUser[]>
  joinChannel: (channelId: string) => void
  leaveChannel: (channelId: string) => void
  joinCommunity: (communityId: string) => void
  sendTypingStart: (channelId: string) => void
  sendTypingStop: (channelId: string) => void
}

const ChannelSocketContext = createContext<ChannelSocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  joinChannel: () => {},
  leaveChannel: () => {},
  joinCommunity: () => {},
  sendTypingStart: () => {},
  sendTypingStop: () => {},
})

export const useChannelSocket = () => useContext(ChannelSocketContext)

export function ChannelSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthContext()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser[]>>(new Map())
  const socketRef = useRef<Socket | null>(null)

  // Auto-clear typing indicators after 5 seconds of no update
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (!user || !token) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
      return
    }

    const socketUrl = resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    const newSocket = io(`${socketUrl}/channel`, {
      auth: { token: `Bearer ${token}` },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = newSocket

    newSocket.on('connect', () => {
      setIsConnected(true)
      newSocket.emit('channel:get-online-users', {}, (users: string[]) => {
        if (Array.isArray(users)) setOnlineUsers(new Set(users))
      })
    })

    newSocket.on('disconnect', () => setIsConnected(false))

    newSocket.on('user:status', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        status === 'online' ? next.add(userId) : next.delete(userId)
        return next
      })
    })

    newSocket.on('channel:typing:start', (typingUser: TypingUser) => {
      const key = `${typingUser.channelId}:${typingUser.userId}`
      // Clear existing timer for this user+channel
      const existingTimer = typingTimers.current.get(key)
      if (existingTimer) clearTimeout(existingTimer)
      // Add to typing list
      setTypingUsers(prev => {
        const next = new Map(prev)
        const current = next.get(typingUser.channelId) ?? []
        const filtered = current.filter(u => u.userId !== typingUser.userId)
        next.set(typingUser.channelId, [...filtered, typingUser])
        return next
      })
      // Auto-clear after 5 seconds
      const timer = setTimeout(() => {
        setTypingUsers(prev => {
          const next = new Map(prev)
          const current = next.get(typingUser.channelId) ?? []
          next.set(typingUser.channelId, current.filter(u => u.userId !== typingUser.userId))
          return next
        })
        typingTimers.current.delete(key)
      }, 5000)
      typingTimers.current.set(key, timer)
    })

    newSocket.on('channel:typing:stop', ({ userId, channelId }) => {
      const key = `${channelId}:${userId}`
      clearTimeout(typingTimers.current.get(key))
      typingTimers.current.delete(key)
      setTypingUsers(prev => {
        const next = new Map(prev)
        const current = next.get(channelId) ?? []
        next.set(channelId, current.filter(u => u.userId !== userId))
        return next
      })
    })

    setSocket(newSocket)
    return () => {
      newSocket.disconnect()
      socketRef.current = null
    }
  }, [user?.id, token])

  const joinChannel = useCallback((channelId: string) => {
    socketRef.current?.emit('channel:join', { channelId })
  }, [])

  const leaveChannel = useCallback((channelId: string) => {
    socketRef.current?.emit('channel:leave', { channelId })
  }, [])

  const joinCommunity = useCallback((communityId: string) => {
    socketRef.current?.emit('channel:join-community', { communityId })
  }, [])

  // Throttled typing start: don't emit more than once every 3 seconds
  const lastTypingEmit = useRef<Map<string, number>>(new Map())
  const sendTypingStart = useCallback((channelId: string) => {
    const now = Date.now()
    const last = lastTypingEmit.current.get(channelId) ?? 0
    if (now - last < 3000) return
    lastTypingEmit.current.set(channelId, now)
    socketRef.current?.emit('channel:typing:start', { channelId })
  }, [])

  const sendTypingStop = useCallback((channelId: string) => {
    lastTypingEmit.current.delete(channelId)
    socketRef.current?.emit('channel:typing:stop', { channelId })
  }, [])

  return (
    <ChannelSocketContext.Provider value={{
      socket, isConnected, onlineUsers, typingUsers,
      joinChannel, leaveChannel, joinCommunity,
      sendTypingStart, sendTypingStop,
    }}>
      {children}
    </ChannelSocketContext.Provider>
  )
}
```

### 11.2 Register in the community layout

Edit `app/(community)/layout.tsx` to add `<ChannelSocketProvider>` wrapping the children (alongside the existing `<SocketProvider>`).

---

## 12. Frontend — Phase 3: Page & Route Structure

### 12.1 New routes to create

```
app/(community)/[creator]/[feature]/(loggedUser)/
  channels/
    page.tsx                  ← channel list + redirect to last active
    layout.tsx                ← loads channel list, handles sidebar state
    [channelId]/
      page.tsx                ← channel chat view
      loading.tsx             ← skeleton loading state
```

### 12.2 `channels/layout.tsx`

This layout manages:
- Loading all channels for the community on mount
- Subscribing to socket events: `channel:created`, `channel:updated`, `channel:deleted`, `channel:unread:update`
- Joining the community room: `joinCommunity(communityId)`
- Providing the channel list and unread counts via React context to children

```typescript
// The layout shares channel state via a context so the sidebar and 
// the chat view both update in real-time without prop drilling.

interface ChannelLayoutContextType {
  channels: Channel[]
  isLoading: boolean
  totalUnread: number
  refreshChannels: () => void
}
```

### 12.3 `channels/page.tsx`

- If user has a `lastVisitedChannelId` stored in `localStorage` and that channel still exists → redirect to `channels/[lastVisitedChannelId]`
- Else → redirect to the first non-archived channel in the list
- If no channels exist → show empty state with "No channels yet" and a create button (for owners/admins)

### 12.4 `channels/[channelId]/page.tsx`

This is the main chat view. Core responsibilities:

```
On mount:
  1. Fetch channel details (name, description, type, visibility)
  2. Fetch initial messages (latest 50, cursor-paginated)
  3. joinChannel(channelId) via socket
  4. markAsRead(channelId) via REST
  5. Save channelId to localStorage as 'lastVisitedChannelId'

On unmount:
  1. leaveChannel(channelId) via socket
  2. Clear typing indicator if active

Socket events to subscribe to:
  - channel:message:new      → append to messages
  - channel:message:edited   → update message in list
  - channel:message:deleted  → mark as deleted in list
  - channel:message:reaction → update reactions on message
  - channel:message:pinned   → update pinned state
  - channel:unread:update    → handled by layout context (sidebar badge)

Infinite scroll:
  When user scrolls to the top → load older messages (fetch with cursor)
  Append to the BEGINNING of the messages array
  Maintain scroll position (store scrollHeight before load, restore after)
```

---

## 13. Frontend — Phase 4: Component Breakdown

All new components live in `components/channels/`.

### 13.1 Component tree

```
<ChannelLayout>                           # layout.tsx — manages channel list context
  <ChannelSidebar>                        # Left panel: channel list with badges
    <ChannelSidebarHeader>                # Community name + "New Channel" button
    <ChannelSidebarSearch>                # Filter channels by name
    <ChannelSidebarSection>               # Grouped sections (General, Courses, Events)
      <ChannelSidebarItem>                # Single channel row: emoji + name + unread badge
    <ChannelSidebarFooter>                # User's notification settings shortcut
  <ChannelChatView>                       # Right panel: the chat
    <ChannelChatHeader>                   # Channel name, description, member count, search, pin icon
    <ChannelPinnedBanner>                 # Collapsed/expanded pinned messages
    <ChannelMessageList>                  # Scrollable virtualized message list
      <ChannelDateSeparator>              # "Today", "Yesterday", "March 14"
      <ChannelSystemMessage>              # "Alice joined the channel" (italic, centered)
      <ChannelMessageGroup>              # Group consecutive messages from same sender (5-min window)
        <ChannelMessageBubble>           # Individual message
          <ChannelMessageHeader>         # Avatar, username, timestamp (only on first in group)
          <ChannelMessageText>           # Text with @mention highlights, link unfurl
          <ChannelMessageAttachments>    # Grid of image previews, file chips
          <ChannelMessageLinkPreview>    # OG card preview
          <ChannelMessageReactionBar>    # Emoji pill buttons with counts
          <ChannelMessageThreadPreview>  # "3 replies" collapsed thread button
          <ChannelMessageActions>        # Hover toolbar: react, reply, edit, pin, delete
    <ChannelTypingIndicator>             # "Alice and Bob are typing..."
    <ChannelMessageComposer>             # Bottom composer
      <ChannelComposerToolbar>          # Bold, italic, attach file, emoji picker
      <ChannelComposerInput>            # Auto-expanding textarea with @mention autocomplete
      <ChannelComposerReplyPreview>     # Shows quoted message when replying
      <ChannelComposerFilePreview>      # Preview of attached image/file before sending
      <ChannelComposerActions>          # Send button + file upload
  <ChannelThreadPanel>                  # Right-side slide-out panel for thread replies
    <ChannelThreadHeader>               # "Thread" title + close button
    <ChannelThreadMessageList>          # Same as MessageList but for replies
    <ChannelComposerInput>             # Reused composer for replying in thread
  <ChannelSearchPanel>                  # Full-panel search overlay
  <ChannelMembersPanel>                 # Right-side slide-out: private channel members list
```

### 13.2 Key component details

#### `ChannelMessageGroup`

Group messages from the same sender within a 5-minute window. Only show the avatar and username for the first message in a group. Subsequent messages show only the text (no repeated avatar/name), exactly like Discord/Slack.

```
Rule: messages[i].senderId === messages[i+1].senderId
  AND (messages[i+1].createdAt - messages[i].createdAt) < 5 minutes
  AND messages[i+1].parentMessageId === null
→ group together, hide header on subsequent messages
```

#### `ChannelComposerInput`

- `contenteditable` div (not `<textarea>`) for rich paste support
- On every keystroke → detect `@` + next word → show `<MentionAutocomplete>`
- `MentionAutocomplete`: debounced search of community members by `api.communityMembers.search()`
- On mention selected: insert `@username` as a highlighted span in the composer
- Extract mention user IDs before sending
- On `Enter` (no `Shift`) → send message
- On `Shift+Enter` → newline
- On `Escape` → clear reply target

#### `ChannelMessageActions` (hover toolbar)

Appears on message hover with these buttons based on user role:

| Button | Who sees it |
|---|---|
| 😊 React | All members |
| ↩ Reply | All members |
| ✏️ Edit | Sender only |
| 📌 Pin | OWNER, ADMIN, MODERATOR, channel moderator |
| 🗑️ Delete | Sender (own) + OWNER, ADMIN, MODERATOR (any) |
| ⋯ More | Sender: Copy text. Anyone: Copy link. MODERATOR: Mute user. |

#### `ChannelTypingIndicator`

```typescript
// Read from useChannelSocket().typingUsers.get(channelId)
// Display logic:
0 typing  → nothing
1 typing  → "Alice is typing..."
2 typing  → "Alice and Bob are typing..."
3+ typing → "Alice, Bob and 2 others are typing..."
// Animate dots: ●●● pulsing animation via CSS keyframes
```

#### `ChannelSidebarItem`

```typescript
interface ChannelSidebarItemProps {
  channel: Channel
  isActive: boolean
  onSelect: (channelId: string) => void
}

// Rendering:
// - emoji || default icon based on type (💬 TEXT, 📢 ANNOUNCEMENTS, 🎓 COURSE_CHAT, 📅 EVENT_CHAT)
// - # prefix before name (Discord convention, familiar to users)
// - unreadCount badge (purple, same color as DM badge: bg-[#8e78fb])
// - Active state: bg-[#8e78fb]/10 left-border highlight
// - Archived: slightly dimmed, italic, no badge
// - Lock icon on PRIVATE channels
```

#### `ChannelMessageText`

Render the message text with:
1. **@mention highlights**: scan for `@username` patterns, wrap in `<span className="text-purple-400 font-medium">@username</span>` — if the mention is the current user, use `bg-purple-100 text-purple-700` (highlighted, like Discord)
2. **Link detection**: auto-linkify URLs using a regex, render as `<a>` tags
3. **Emoji-only messages**: if message is 1-3 emojis and no text, render at 3× larger size
4. **Deleted message**: render as italic grey "This message was deleted by a moderator"
5. **Edited indicator**: append `(edited)` in muted text after the message body

---

## 14. Frontend — Phase 5: Creator Studio (Channel Management)

### 14.1 New creator studio route

```
app/(creator)/[feature]/community/
  channels/
    page.tsx         ← Channel list management (reorder, archive, settings)
    new/
      page.tsx       ← Create new channel form
    [channelId]/
      page.tsx       ← Edit channel + manage members (private)
```

### 14.2 `channels/page.tsx` (creator)

A drag-and-drop sortable list of all channels for the community.

- Powered by `@dnd-kit/sortable` (already installed)
- Each row shows: emoji, name, type badge, visibility badge, member count, message count
- Actions per row: Edit (pencil), Archive (box), Delete (trash - shows confirmation)
- "New Channel" button opens create dialog
- Reorder by dragging → calls `api.channel.reorder()` on drop

### 14.3 `CreateChannelDialog`

A `<Dialog>` component (shadcn/ui) with:

```
Fields:
  - Channel name (required, text input, live slug preview below)
  - Emoji picker (optional, click to open emoji popover — use emoji-picker-react or similar)
  - Type selector (TEXT / ANNOUNCEMENTS) — COURSE_CHAT and EVENT_CHAT are auto-created
  - Visibility (PUBLIC / PRIVATE toggle)
  - Description (optional textarea, 280 char limit with counter)
  - [If PRIVATE] Member selector: multi-select of community members (searchable)

Validation (client-side with react-hook-form + zod):
  - name: required, 1-80 chars, no special characters except space and hyphen
  - description: max 280 chars
  - emoji: optional, single emoji

Preview pane (right side on desktop):
  - Shows live sidebar preview of how the channel will look
  - Shows the generated slug
```

---

## 15. Database Indexes & Performance

### 15.1 Critical indexes (already listed in schemas above, consolidated here)

```
channels:
  { communityId, slug }               UNIQUE
  { communityId, position, isArchived }
  { communityId, isArchived, type }

channel_messages:
  { channelId, createdAt: -1 }         PRIMARY read pattern
  { parentMessageId, createdAt: 1 }    Thread replies
  { channelId, isPinned: 1 }           Pinned messages
  { channelId, mentions: 1 }           Mention-based queries
  { text: 'text' }                     Full-text search
  { communityId, createdAt: -1 }       Community-wide search

channel_members:
  { channelId, userId }               UNIQUE
  { channelId, role }                 Fan-out all moderators
  { userId, communityId }             User's channel list

channel_read_cursors:
  { channelId, userId }               UNIQUE
  { userId, communityId }             Batch-load all cursors for sidebar
```

### 15.2 Fan-out strategy for unread counts

When a message is sent to a channel with N members, we need to increment unreadCount for N-1 members in `channel_read_cursors`.

**For PUBLIC channels with many members (e.g., 1,000+), this is a hot path.**

Strategy:
1. **Immediate path (inline)**: for channels with < 100 members, do a synchronous `updateMany` in `sendMessage()`
2. **Queue path (deferred)**: for channels with >= 100 members, push a job to a Bull queue (`channel-unread-fanout`) that processes the increment asynchronously. The WebSocket event is still emitted immediately, so real-time delivery is not blocked.

### 15.3 Message pagination strategy

Use **cursor-based pagination** (not page-based) for messages:
- Initial load: fetch the latest 50 messages (no cursor)
- Older messages: send `cursor = messages[0].createdAt` (oldest message loaded so far)
- Server query: `{ channelId, createdAt: { $lt: cursor }, parentMessageId: null }` sorted DESC, limit 50

This avoids the "page skip" problem when new messages arrive between paginated requests.

---

## 16. UX Design Decisions & Patterns

### 16.1 Navigation integration

Add "Channels" to the community navigation alongside the existing tabs:

```
Home  |  Channels  |  Courses  |  Events  |  Members  |  Messages  |  ...
```

The Channels tab shows a total unread badge (sum of all channel unread counts).

On mobile: the sidebar collapses. The channels list is the initial view. Tapping a channel opens the full-screen chat. A back button returns to the list.

### 16.2 Scroll behavior

- On initial load and on new message received: scroll to bottom **only if user is within 150px of the bottom**. If they're scrolled up reading history, don't hijack their position.
- Show a "↓ New messages" floating pill at the bottom when new messages arrive and user is scrolled up. Clicking it scrolls to bottom and marks as read.

### 16.3 Optimistic message sending

Exactly like the DM page:
1. Create a temporary message object with `_tempId: "temp-{Date.now()}"` and `_isOptimistic: true`
2. Append immediately to the messages array
3. Send API request
4. On success: replace temp message with server response
5. On failure: set `_isFailed: true` on the temp message, show a "Retry" button

### 16.4 Sound notifications

Optional: a subtle "pop" sound when a new message arrives in an active channel (only if user is on the page and their tab is visible). Use the Web Audio API (no external library needed, 2KB of code).

### 16.5 Unread divider

When a user returns to a channel they haven't read:
- Show a visual divider: `──── New Messages ────` in purple
- This divider sits above the first unread message (determined by comparing `lastReadAt` to each message's `createdAt`)
- Auto-scroll to this divider instead of to the bottom on channel open (Circle does this)

### 16.6 Desktop keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Alt + ↑` / `Alt + ↓` | Navigate between channels |
| `Escape` | Clear reply target / close thread panel |
| `Ctrl/Cmd + F` | Focus the channel search |
| `Enter` | Send message |
| `Shift + Enter` | New line in composer |
| `↑` (in empty composer) | Edit last own message |

### 16.7 Empty state per channel type

| Channel type | Empty state message |
|---|---|
| TEXT (first open) | "👋 Welcome to #general! This is the beginning of your community chat." |
| ANNOUNCEMENTS | "📢 This is the announcements channel. Only admins can post here." |
| COURSE_CHAT | "🎓 This channel is for course discussions. Ask questions, share progress, and help each other." |
| EVENT_CHAT | "📅 Chat with other attendees here before, during, and after the event." |

### 16.8 Announcement channel visual treatment

ANNOUNCEMENTS channels in the sidebar have a megaphone icon (📢) and a gold border on the channel header. The composer shows "Only admins can post here" for regular members with the input disabled — but reactions and thread replies are still enabled (members can respond in threads without cluttering the main feed).

### 16.9 RTL Support (Arabic)

The entire UI must support RTL layout (Chabaqa already has Arabic support via `next-intl` and the `Tajawal` font):
- The channel sidebar slides in from the right instead of the left
- Message bubbles: own messages appear on the right in LTR mode, left in RTL mode (or always right — match the DM page's convention)
- The composer aligns text to the right in RTL
- All icons that convey direction (back arrow, send arrow) flip via `transform: scaleX(-1)` in RTL

### 16.10 Mobile-specific UX

- Swipe left on a channel sidebar item to reveal "Mute" and "Mark as read" quick actions
- The thread panel opens as a bottom sheet (using `vaul` Drawer, already installed) on mobile instead of a right-side panel
- The emoji reaction picker is a bottom sheet on mobile
- Long-press on a message (touch) opens the message actions sheet (same actions as the hover toolbar on desktop)

---

## 17. Rollout Phases

### Phase 1 — MVP (Week 1–2): Core text channels

**Backend:**
- [ ] Create all 4 schemas and register in Mongoose
- [ ] Add `CHANNELS_*` permissions to the permission system
- [ ] Implement `ChannelGateway` (join, leave, typing, message events)
- [ ] Implement `ChannelService` (create, list, send, read, unread count)
- [ ] Implement `ChannelController` (channel CRUD + messages endpoints)
- [ ] Add `CHANNEL_MENTION` notification type

**Frontend:**
- [ ] Add all Channel types to `lib/api/types.ts`
- [ ] Create `lib/api/channel.api.ts`
- [ ] Create `lib/channel-socket-context.tsx`
- [ ] Register `ChannelSocketProvider` in community layout
- [ ] Create `channels/layout.tsx` with channel list context
- [ ] Create `channels/[channelId]/page.tsx` with message list + composer
- [ ] Create `ChannelSidebar`, `ChannelMessageBubble`, `ChannelMessageComposer`
- [ ] Add "Channels" tab to community navigation
- [ ] Creator can create TEXT channels from the community settings

**Definition of done:** Members can join a community, see a "Channels" tab, read and send messages in TEXT channels in real-time.

---

### Phase 2 — Richness (Week 3): Reactions, threads, mentions, pinning

**Backend:**
- [ ] Implement `addReaction` with toggle logic
- [ ] Implement `listThreadReplies` and `sendThreadReply`
- [ ] Implement `@mention` parsing in `sendMessage`
- [ ] Implement `pinMessage` / `unpinMessage` / `listPinnedMessages`
- [ ] Implement `editMessage` and `deleteMessage` (with moderator override)
- [ ] Add `CHANNEL_REPLY` notification type

**Frontend:**
- [ ] `ChannelMessageReactionBar` with toggle UI
- [ ] `ChannelThreadPanel` (right-side slide-out for desktop, bottom sheet for mobile)
- [ ] `MentionAutocomplete` in the composer
- [ ] `ChannelPinnedBanner` (collapsible, shows latest pinned)
- [ ] Edit message UI (inline editing in the bubble)
- [ ] Moderator delete (replaces content with "deleted" marker)
- [ ] Message actions hover toolbar
- [ ] `ChannelMessageActions` context menu

**Definition of done:** Full rich messaging parity with Circle's core chat feature.

---

### Phase 3 — Access Control & Management (Week 4): Private channels, permissions, creator studio

**Backend:**
- [ ] Implement PRIVATE channel access check in all message endpoints
- [ ] Implement `addMembersToPrivateChannel` and `removeMemberFromChannel`
- [ ] Implement `setChannelMemberRole` (per-channel moderators)
- [ ] Implement `muteMember`
- [ ] ANNOUNCEMENTS channel enforcement in `assertCanSend`
- [ ] Implement `reorderChannels`
- [ ] `archiveChannel` with graceful read-only handling
- [ ] `createAutoChannel` hooked into course publish and event create flows

**Frontend:**
- [ ] Creator studio channel management page (with drag-and-drop reorder via `@dnd-kit`)
- [ ] `CreateChannelDialog` with full form
- [ ] Edit channel settings panel
- [ ] Private channel member management (add/remove members)
- [ ] Muted state handling in composer (disabled input + reason message)
- [ ] ANNOUNCEMENTS channel visual treatment
- [ ] Archive indicator on sidebar + read-only banner in chat view
- [ ] Auto-created COURSE_CHAT / EVENT_CHAT shown in respective course/event pages

**Definition of done:** Full creator control over channels. Private/public/announcements channel types all work correctly.

---

### Phase 4 — Search, Notifications, Polish (Week 5)

**Backend:**
- [ ] Full-text search endpoint with MongoDB text index
- [ ] Bulk unread count fan-out via Bull queue for large communities
- [ ] `CHANNEL_ALL_MESSAGE` notifications for "notify all" preference
- [ ] Unread count via ChannelReadCursor fully working

**Frontend:**
- [ ] `ChannelSearchPanel` (full search within community channels)
- [ ] Notification preference settings per channel (all / mentions / none)
- [ ] Unread divider ("New Messages" marker)
- [ ] "↓ New messages" floating pill
- [ ] Sound notification (optional, respects browser mute)
- [ ] Keyboard shortcuts
- [ ] Mobile: long-press actions, swipe gestures, bottom sheet thread panel
- [ ] RTL layout for Arabic users
- [ ] Empty state improvements per channel type

**Definition of done:** Feature-complete, polished, production-ready. Full parity with Circle's chat, unique advantages in gamification hooks and Arabic support.

---

## 18. File Creation Checklist

### Backend — new files to create

```
src/schema/
  channel.schema.ts
  channel-message.schema.ts
  channel-member.schema.ts
  channel-read-cursor.schema.ts

src/channel/
  channel.module.ts
  channel.gateway.ts
  channel.service.ts
  channel.controller.ts

src/dto-channel/
  create-channel.dto.ts
  update-channel.dto.ts
  send-channel-message.dto.ts
  add-reaction.dto.ts
  reorder-channels.dto.ts
  add-channel-members.dto.ts
```

### Backend — existing files to edit

```
src/common/permissions/community-roles.constants.ts
  → Add CHANNELS_VIEW, CHANNELS_SEND, CHANNELS_MANAGE, CHANNELS_MODERATE

src/notification/notification-types.ts
  → Add CHANNEL_MENTION, CHANNEL_REPLY, CHANNEL_CREATED, CHANNEL_ALL_MESSAGE

src/domains/community-domain.module.ts
  → Import ChannelModule

src/domains/learning-domain.module.ts
  → Import ChannelModule (for auto-channel on course publish)

src/cours/cours.service.ts
  → Call channelService.createAutoChannel() on course publish

src/event/event.service.ts
  → Call channelService.createAutoChannel() on event create

src/community-aff-crea-join/...service.ts
  → Seed ChannelReadCursor records on community join
```

### Frontend — new files to create

```
lib/api/channel.api.ts
lib/channel-socket-context.tsx

app/(community)/[creator]/[feature]/(loggedUser)/channels/
  layout.tsx
  page.tsx
  [channelId]/
    page.tsx
    loading.tsx

app/(creator)/[feature]/community/channels/
  page.tsx
  new/page.tsx (or use Dialog)
  [channelId]/page.tsx

components/channels/
  channel-sidebar.tsx
  channel-sidebar-item.tsx
  channel-sidebar-header.tsx
  channel-chat-view.tsx
  channel-chat-header.tsx
  channel-message-list.tsx
  channel-message-group.tsx
  channel-message-bubble.tsx
  channel-message-text.tsx
  channel-message-attachments.tsx
  channel-message-reactions.tsx
  channel-message-actions.tsx
  channel-message-thread-preview.tsx
  channel-message-composer.tsx
  channel-mention-autocomplete.tsx
  channel-typing-indicator.tsx
  channel-pinned-banner.tsx
  channel-thread-panel.tsx
  channel-search-panel.tsx
  channel-members-panel.tsx
  channel-date-separator.tsx
  channel-system-message.tsx
  channel-unread-divider.tsx
  create-channel-dialog.tsx
  edit-channel-dialog.tsx

hooks/
  use-channel-messages.ts     ← TanStack Query hook for messages + socket merge
  use-channel-list.ts         ← TanStack Query hook for channel list + unread counts
  use-mention-search.ts       ← debounced community member search for @mentions
  use-channel-scroll.ts       ← scroll-to-bottom logic, unread divider tracking
```

### Frontend — existing files to edit

```
lib/api/types.ts
  → Add Channel, ChannelMessage, ChannelMember, ChannelReadCursor types
  → Add ChannelSocketEvents interface

lib/api/index.ts
  → Add channel: channelApi to the api singleton

app/(community)/layout.tsx
  → Wrap with <ChannelSocketProvider>

app/(community)/[creator]/[feature]/(loggedUser)/
  → Add "Channels" tab to navigation component

messages/i18n
  → Add translation keys for all new channel UI strings (en + ar)
```

---

## Appendix: Socket Event Reference (Complete)

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `channel:join` | `{ channelId: string }` | Join a channel room for real-time messages |
| `channel:leave` | `{ channelId: string }` | Leave a channel room |
| `channel:join-community` | `{ communityId: string }` | Join community room for channel CRUD events |
| `channel:typing:start` | `{ channelId: string }` | Start typing indicator |
| `channel:typing:stop` | `{ channelId: string }` | Stop typing indicator |
| `channel:get-online-users` | — | Request current online user list (returns string[]) |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `channel:message:new` | `{ channelId, message: ChannelMessage }` | A new message was sent |
| `channel:message:edited` | `{ channelId, message: ChannelMessage }` | A message was edited |
| `channel:message:deleted` | `{ channelId, messageId, deletedBy }` | A message was deleted |
| `channel:message:reaction` | `{ channelId, messageId, reactions }` | Reactions updated on a message |
| `channel:message:pinned` | `{ channelId, message: ChannelMessage }` | A message was pinned |
| `channel:typing:start` | `{ userId, channelId, username, avatar }` | A user started typing |
| `channel:typing:stop` | `{ userId, channelId }` | A user stopped typing |
| `channel:unread:update` | `{ channelId, unreadCount }` | Targeted to user: your unread count changed |
| `channel:created` | `Channel` | A new channel was created (community room) |
| `channel:updated` | `Channel` | A channel was updated (community room) |
| `channel:deleted` | `{ channelId }` | A channel was archived/deleted (community room) |
| `user:status` | `{ userId, status: 'online' \| 'offline' }` | User online/offline (from /channel namespace) |

---

*Last updated: generated from competitive analysis of Circle.so, Skool.com, and Nas.io, cross-referenced with Chabaqa's existing DM module, community-access permission system, notification service, and frontend architecture.*