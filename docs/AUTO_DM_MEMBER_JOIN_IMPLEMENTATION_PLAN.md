# Auto DM on Member Join — Full Implementation Plan

> **Feature:** When a new member joins any community, they automatically receive a personalised Direct Message from the creator — configured per community in the creator dashboard.
>
> **Analogues:** Skool's *Auto DM* plugin, Circle's *AI Workflow: Welcome new member*
>
> **Estimated effort:** Backend 1–2 days · Frontend 1 day
>
> **Codebase branch target:** This document is written against the exact state of the Chabaqa monorepo as of the research date. Every file path, function name, field name, and line reference is verified against the live source.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Flow Diagram](#2-data-flow-diagram)
3. [Backend Changes](#3-backend-changes)
   - 3.1 [Schema — `community.schema.ts`](#31-schema--communityschemats)
   - 3.2 [DM Service — new `sendWelcomeDm()` method](#32-dm-service--new-sendwelcomedm-method)
   - 3.3 [DM Module — export DmService for external use](#33-dm-module--already-exports-correctly)
   - 3.4 [CommunityAffCreaJoin Module — import DmModule](#34-communityaffcreajoin-module--import-dmmodule)
   - 3.5 [CommunityAffCreaJoin Service — inject DmService + call sendWelcomeDm](#35-communityaffcreajoin-service--inject-dmservice--call-sendwelcomedm)
   - 3.6 [normalizeCommunitySettings — preserve new fields](#36-normalizecommunityservices--preserve-new-fields)
   - 3.7 [transformCommunityForFrontend — expose new fields](#37-transformcommunityforfrontent--expose-new-fields)
4. [Frontend Changes](#4-frontend-changes)
   - 4.1 [Types — `lib/api/types.ts`](#41-types--libapiTypests)
   - 4.2 [NormalizedSettings — `lib/community-settings.ts`](#42-normalizedsettings--libcommunity-settingsts)
   - 4.3 [New page — Auto DM settings UI](#43-new-page--auto-dm-settings-ui)
   - 4.4 [Loading skeleton](#44-loading-skeleton)
   - 4.5 [Sidebar — add Auto DM nav entry](#45-sidebar--add-auto-dm-nav-entry)
5. [Variable Templating Spec](#5-variable-templating-spec)
6. [Edge Cases & Safety Rules](#6-edge-cases--safety-rules)
7. [Testing Checklist](#7-testing-checklist)
8. [V2 Roadmap (Out of Scope for This Sprint)](#8-v2-roadmap-out-of-scope-for-this-sprint)

---

## 1. Architecture Overview

```
NEW MEMBER JOINS COMMUNITY
        │
        ▼
community-aff-crea-join.service.ts
  joinCommunity()       ─────────┐
  joinByInvite()        ─────────┤──► sendWelcomeDm() [DmService]
  (paid path: webhook)  ─────────┘         │
                                           │
                          1. findOne OR create COMMUNITY_DM conv
                             (participantA = member, participantB = creator)
                             type: 'COMMUNITY_DM'
                          2. Resolve {{memberName}} {{communityName}} {{creatorName}}
                          3. messageModel.create({ senderId: creatorId, recipientId: memberId })
                          4. Update conv.unreadCountA + lastMessageAt
                          5. dmGateway.emitNewMessage → member's socket room
                          6. notificationService.createNotification → member push
```

**Key design principle:** `sendWelcomeDm()` is entirely non-blocking. It is wrapped in its own `try/catch`. A failure to send a welcome DM **never** rolls back or fails the join operation. This is identical to how `notifyCreatorMemberJoined()` is currently guarded.

---

## 2. Data Flow Diagram

```
Creator Dashboard
 └─ /creator/marketing/auto-dm
      └─ Toggle: welcomeDmEnabled = true
      └─ Textarea: welcomeDmMessage = "Hi {{memberName}}! Welcome to {{communityName}}..."
      └─ PATCH /community-aff-crea-join/:communityId/settings
           └─ Body: { welcomeDmEnabled: true, welcomeDmMessage: "..." }
                └─ Saved to community.settings.welcomeDmEnabled
                            community.settings.welcomeDmMessage

Member joins community
 └─ POST /community-aff-crea-join/join  (free communities)
 └─ POST /community-aff-crea-join/join-by-invite  (invite links)
      └─ joinCommunity() / joinByInvite()  [service]
           └─ community.settings.welcomeDmEnabled === true?
                └─ YES → dmService.sendWelcomeDm(communityId, memberId, creatorId, template)
                     └─ Conversation COMMUNITY_DM found or created
                     └─ Message created (senderId = creatorId, recipientId = memberId)
                     └─ dmGateway.emitNewMessage(convId, memberId, message)
                     └─ notificationService.createNotification(...)
                          └─ Member sees DM badge + real-time message in /messages page
```

---

## 3. Backend Changes

### 3.1 Schema — `community.schema.ts`

**File:** `backend/src/schema/community.schema.ts`

**What to add:** Two new `@Prop` fields inside the `CommunitySettings` class (around line 192 — just before the closing of the class, after `headerScripts`).

```typescript
// Inside class CommunitySettings — add after headerScripts field (currently ~L192-193)

@Prop({ type: Boolean, default: false })
welcomeDmEnabled: boolean;

@Prop({ type: String, default: '', trim: true, maxlength: 2000 })
welcomeDmMessage: string;
```

**Why `maxlength: 2000`:** Prevents excessively long templates that could be abused. 2000 characters is more than enough for a warm welcome message.

**No migration needed:** MongoDB will return `undefined` for these fields on existing communities (treated as `false` / `''` by all normalize functions). Safe backward-compatible addition.

---

### 3.2 DM Service — new `sendWelcomeDm()` method

**File:** `backend/src/dm/dm.service.ts`

**Where to add:** Add as a new `public async` method at the end of the `DmService` class, after the existing `closeExpiredSessionTempChats()` method (currently ~L638–661). Do not modify any existing methods.

**Full method code:**

```typescript
/**
 * AUTO DM — Send a welcome DM from the community creator to a new member.
 * Called internally after joinCommunity() and joinByInvite() succeed.
 * MUST be non-blocking: never throws — always wrapped in try/catch.
 *
 * @param communityId  - MongoDB ObjectId string of the community
 * @param newMemberId  - MongoDB ObjectId string of the user who just joined
 * @param creatorId    - MongoDB ObjectId string of the community creator (community.createur)
 * @param template     - Raw message template with {{memberName}}, {{communityName}}, {{creatorName}} placeholders
 */
async sendWelcomeDm(
  communityId: string,
  newMemberId: string,
  creatorId: string,
  template: string,
): Promise<void> {
  try {
    // ── 0. Validate inputs ───────────────────────────────────────────────
    if (!communityId || !newMemberId || !creatorId) return;
    const trimmedTemplate = (template || '').trim();
    if (!trimmedTemplate) return;

    // Prevent sending a welcome DM to the creator themselves
    // (edge case: creator joins their own community)
    if (newMemberId === creatorId) return;

    const memberObjectId  = new Types.ObjectId(newMemberId);
    const creatorObjectId = new Types.ObjectId(creatorId);
    const communityObjectId = new Types.ObjectId(communityId);

    // ── 1. Resolve template variables ────────────────────────────────────
    const [memberDoc, creatorDoc, communityDoc] = await Promise.all([
      this.userModel
        .findById(newMemberId)
        .select('name firstName lastName username')
        .lean()
        .exec(),
      this.userModel
        .findById(creatorId)
        .select('name firstName lastName username')
        .lean()
        .exec(),
      this.communityModel
        .findById(communityId)
        .select('name')
        .lean()
        .exec(),
    ]);

    const memberName    = this.resolveDisplayName(memberDoc)  || 'there';
    const creatorName   = this.resolveDisplayName(creatorDoc) || 'the creator';
    const communityName = (communityDoc as any)?.name         || 'our community';

    const resolvedMessage = trimmedTemplate
      .replace(/\{\{memberName\}\}/gi,    memberName)
      .replace(/\{\{communityName\}\}/gi, communityName)
      .replace(/\{\{creatorName\}\}/gi,   creatorName);

    // ── 2. Get or create the COMMUNITY_DM conversation ───────────────────
    // Convention (matches existing startCommunityConversation):
    //   participantA = member  (the one who joined)
    //   participantB = creator (the community owner)
    let conv = await this.conversationModel.findOne({
      type: 'COMMUNITY_DM',
      participantA: memberObjectId,
      participantB: creatorObjectId,
      communityId:  communityObjectId,
    });

    if (!conv) {
      try {
        conv = await this.conversationModel.create({
          type:         'COMMUNITY_DM',
          participantA: memberObjectId,
          participantB: creatorObjectId,
          communityId:  communityObjectId,
          isOpen:       true,
          unreadCountA: 0,
          unreadCountB: 0,
        });
      } catch (createErr: any) {
        // Race condition: another process created it (duplicate key)
        if (createErr?.code === 11000) {
          conv = await this.conversationModel.findOne({
            type:         'COMMUNITY_DM',
            participantA: memberObjectId,
            participantB: creatorObjectId,
            communityId:  communityObjectId,
          });
          if (!conv) return; // Still nothing — give up silently
        } else {
          throw createErr;
        }
      }
    }

    if (!conv) return;

    // ── 3. Create the message ─────────────────────────────────────────────
    // Creator (participantB) is the sender; member (participantA) is the recipient.
    const msg = await this.messageModel.create({
      conversationId: conv._id,
      senderId:       creatorObjectId,   // creator sends
      recipientId:    memberObjectId,    // member receives
      text:           resolvedMessage,
      attachments:    [],
    });

    // ── 4. Update conversation summary ────────────────────────────────────
    conv.lastMessageText = resolvedMessage;
    conv.lastMessageAt   = new Date();
    // participantA (member) has the unread message
    conv.unreadCountA = (conv.unreadCountA || 0) + 1;
    await conv.save();

    // ── 5. Real-time emit to member ───────────────────────────────────────
    // emitNewMessage(convId, recipientUserId, message)
    this.dmGateway.emitNewMessage(
      conv._id.toString(),
      newMemberId,
      msg,
    );

    // ── 6. In-app + push notification to member ───────────────────────────
    this.notificationService.createNotification({
      recipient: newMemberId,
      sender:    creatorId,
      type:      'new_dm_message',
      title:     `Welcome message from ${creatorName}`,
      body:      resolvedMessage.length > 100
                   ? resolvedMessage.slice(0, 97) + '...'
                   : resolvedMessage,
      data: { conversationId: conv._id.toString() },
    });

  } catch (error: any) {
    // NEVER propagate — welcome DM failure must not break the join flow
    console.warn(
      `[AUTO-DM] Failed to send welcome DM | community=${communityId} | member=${newMemberId} | error: ${error?.message || error}`,
    );
  }
}

/**
 * Helper: resolve a user document to a display name string.
 * Mirrors resolveMemberDisplayName in CommunityAffCreaJoinService.
 */
private resolveDisplayName(user: any): string {
  if (!user) return '';
  const explicit = String(user.name || '').trim();
  if (explicit) return explicit;
  const first    = String(user.firstName || '').trim();
  const last     = String(user.lastName  || '').trim();
  const fullName = [first, last].filter(Boolean).join(' ');
  if (fullName) return fullName;
  return String(user.username || '').trim();
}
```

**Notes:**
- This method is `public` so it can be injected and called from `CommunityAffCreaJoinService`.
- It deliberately does NOT call the existing `sendMessage()` method to avoid its membership-guard check (`community.isMember(sid)`). The creator (participantB) is the sender and may not be in the `community.members` array — they are stored in `community.createur`. Writing directly to `messageModel` bypasses this guard safely for this system-initiated use case.
- The `resolveDisplayName()` private helper is a local copy of the pattern already used in `CommunityAffCreaJoinService.resolveMemberDisplayName()`. It is duplicated here to keep `DmService` self-contained.

---

### 3.3 DM Module — already exports correctly

**File:** `backend/src/dm/dm.module.ts`

**No changes needed.** The module already declares:

```typescript
exports: [DmService, DmGateway],
```

`DmService` is already exported. Importing `DmModule` into another module will make `DmService` available for injection.

---

### 3.4 CommunityAffCreaJoin Module — import DmModule

**File:** `backend/src/community-aff-crea-join/community-aff-crea-join.module.ts`

**Change:** Add `DmModule` to the `imports` array.

```typescript
// Add this import at the top of the file:
import { DmModule } from '../dm/dm.module';

// Add DmModule to the imports array (alongside NotificationModule, EmailCampaignModule, etc.):
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: 'Order', schema: OrderSchema },
      { name: CommunityStaff.name, schema: CommunityStaffSchema },
    ]),
    UploadModule,
    PolicyModule,
    FeeModule,
    PromoModule,
    TrackingModule,
    NotificationModule,
    AuthModule,
    EmailCampaignModule,
    DmModule,            // ← ADD THIS LINE
  ],
  controllers: [CommunityAffCreaJoinController],
  providers: [CommunityAffCreaJoinService],
  exports: [CommunityAffCreaJoinService]
})
export class CommunityAffCreaJoinModule {}
```

**Circular dependency check:** `DmModule` imports `AuthModule`, `UploadModule`, and `PolicyModule` — none of which import `CommunityAffCreaJoinModule`. No circular dependency.

---

### 3.5 CommunityAffCreaJoin Service — inject DmService + call sendWelcomeDm

**File:** `backend/src/community-aff-crea-join/community-aff-crea-join.service.ts`

#### Step A — Add import at top of file

```typescript
// Add alongside existing imports at the top of the file
import { DmService } from '../dm/dm.service';
```

#### Step B — Inject DmService in constructor

The existing constructor starts at line 24. Add `DmService` injection:

```typescript
constructor(
  // ... all existing parameters stay exactly as they are ...
  @InjectModel(Community.name) private communityModel: Model<CommunityDocument>,
  @InjectModel(User.name) private userModel: Model<User>,
  // ... etc ...
  private readonly emailCampaignService: EmailCampaignService,
  private readonly dmService: DmService,   // ← ADD THIS LINE at the end
) {}
```

#### Step C — Call sendWelcomeDm in `joinCommunity()` (line ~1808)

Find the end of `joinCommunity()`, just AFTER the existing `await this.notifyCreatorMemberJoined(...)` call (currently line ~1808). Add the auto DM trigger:

```typescript
// After: await this.notifyCreatorMemberJoined(community, userId, this.resolveMemberDisplayName(user));
// ADD:
if (
  community.settings?.welcomeDmEnabled === true &&
  community.settings?.welcomeDmMessage?.trim()
) {
  // Non-blocking — sendWelcomeDm never throws (has its own try/catch)
  void this.dmService.sendWelcomeDm(
    community._id.toString(),
    userId,
    community.createur.toString(),
    community.settings.welcomeDmMessage,
  );
}
```

#### Step D — Call sendWelcomeDm in `joinByInvite()` (line ~1925)

Find the end of `joinByInvite()`, just AFTER the existing `await this.notifyCreatorMemberJoined(...)` call (currently line ~1925). Add the same auto DM trigger:

```typescript
// After: await this.notifyCreatorMemberJoined(community, userId, this.resolveMemberDisplayName(user));
// ADD:
if (
  community.settings?.welcomeDmEnabled === true &&
  community.settings?.welcomeDmMessage?.trim()
) {
  void this.dmService.sendWelcomeDm(
    community._id.toString(),
    userId,
    community.createur.toString(),
    community.settings.welcomeDmMessage,
  );
}
```

**Why `void` instead of `await`?**
Using `void` makes it fire-and-forget. Since `sendWelcomeDm()` has its own `try/catch` and never throws, `await` would also work safely. However, `void` makes the intent explicit: the join response is returned to the client immediately without waiting for the DM to be delivered.

---

### 3.6 normalizeCommunitySettings — preserve new fields

**File:** `backend/src/community-aff-crea-join/community-aff-crea-join.service.ts`

**Method:** `normalizeCommunitySettings()` (lines 660–735)

This private method explicitly maps known settings fields. If a new field is not listed here, it will be dropped during `updateCommunity()`. Add the two new fields at the end of the returned object:

```typescript
// Inside normalizeCommunitySettings(), in the returned settings object,
// add after headerScripts (~L733):

welcomeDmEnabled:
  typeof settings.welcomeDmEnabled === 'boolean'
    ? settings.welcomeDmEnabled
    : false,

welcomeDmMessage:
  typeof settings.welcomeDmMessage === 'string'
    ? settings.welcomeDmMessage.trim().slice(0, 2000)
    : '',
```

---

### 3.7 transformCommunityForFrontend — expose new fields

**File:** `backend/src/community-aff-crea-join/community-aff-crea-join.service.ts`

**Method:** `transformCommunityForFrontend()` (lines 737–922)

Inside this method, there is a `settings` object being built for the return value (lines ~852–898). Add the two new fields after `headerScripts`:

```typescript
// Inside transformCommunityForFrontend(), in the settings: {} block,
// add after headerScripts (~L898):

welcomeDmEnabled: normalizedSettings.welcomeDmEnabled ?? false,
welcomeDmMessage: normalizedSettings.welcomeDmMessage ?? '',
```

This ensures that when the creator dashboard fetches the community, the current Auto DM settings are included in the response and can be displayed in the UI.

---

## 4. Frontend Changes

### 4.1 Types — `lib/api/types.ts`

**File:** `chabaqa-demo/frontend/lib/api/types.ts`

Add two new optional fields to the `CommunitySettings` interface (add after `headerScripts?`):

```typescript
// Inside the CommunitySettings interface, after headerScripts?:
welcomeDmEnabled?: boolean;
welcomeDmMessage?: string;
```

---

### 4.2 NormalizedSettings — `lib/community-settings.ts`

**File:** `chabaqa-demo/frontend/lib/community-settings.ts`

**Step A** — Add new fields to the `NormalizedCommunitySettings` type:

```typescript
export type NormalizedCommunitySettings = {
  // ... all existing fields stay exactly as they are ...
  headerScripts: string;
  // ADD:
  welcomeDmEnabled: boolean;
  welcomeDmMessage: string;
}
```

**Step B** — Add new fields to the return value in `normalizeCommunitySettings()`:

```typescript
// Inside the returned object in normalizeCommunitySettings(), add after headerScripts:
welcomeDmEnabled: settings.welcomeDmEnabled ?? false,
welcomeDmMessage: settings.welcomeDmMessage || '',
```

---

### 4.3 New page — Auto DM settings UI

**File to create:** `chabaqa-demo/frontend/app/(creator)/creator/marketing/auto-dm/page.tsx`

This is a full `"use client"` Next.js page component. It must:

1. Read `selectedCommunityId` and `selectedCommunity` from `useCreatorCommunityContext()`
2. Maintain local state for `welcomeDmEnabled` and `welcomeDmMessage`
3. Hydrate from `selectedCommunity.settings` when community changes
4. Call `communitiesApi.updateSettings(communityId, { welcomeDmEnabled, welcomeDmMessage })` on Save
5. Show a live preview panel replacing all template variables with placeholder values
6. Display variable hint chips the user can click to insert into the textarea

**Complete file:**

```typescript
"use client"

import { useState, useEffect, useCallback } from "react"
import { Save, Bot, ToggleLeft, ToggleRight, Eye, EyeOff, Info, CheckCircle2 } from "lucide-react"
import { useCreatorCommunityContext } from "@/app/(creator)/creator/context/creator-community-context"
import { communitiesApi } from "@/lib/api/communities.api"
import { useToast } from "@/hooks/use-toast"

// ─── Default template shown to new creators ──────────────────────────────────
const DEFAULT_TEMPLATE = `Hi {{memberName}}! 👋

Welcome to {{communityName}}! I'm so excited to have you here.

Feel free to explore all the content — courses, resources, and everything else we've built for you. Don't hesitate to reply here if you have any questions or just want to say hi.

Looking forward to seeing you grow here! 🚀

— {{creatorName}}`

// ─── Template variable definitions ────────────────────────────────────────────
const TEMPLATE_VARIABLES = [
  { variable: "{{memberName}}",    label: "Member Name",    preview: "Alex" },
  { variable: "{{communityName}}", label: "Community Name", preview: "My Community" },
  { variable: "{{creatorName}}",   label: "Your Name",      preview: "You" },
]

// ─── Live preview resolver ─────────────────────────────────────────────────────
function resolvePreview(template: string, communityName: string): string {
  return template
    .replace(/\{\{memberName\}\}/gi,    "Alex")
    .replace(/\{\{communityName\}\}/gi, communityName || "My Community")
    .replace(/\{\{creatorName\}\}/gi,   "You")
}

// ─── Character counter colours ────────────────────────────────────────────────
function getCountColour(count: number): string {
  if (count > 1800) return "text-red-500"
  if (count > 1500) return "text-yellow-500"
  return "text-gray-400"
}

export default function AutoDmPage() {
  const { selectedCommunityId, selectedCommunity } = useCreatorCommunityContext()
  const { toast } = useToast()

  const [enabled,     setEnabled]     = useState(false)
  const [message,     setMessage]     = useState(DEFAULT_TEMPLATE)
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving,    setIsSaving]    = useState(false)
  const [isDirty,     setIsDirty]     = useState(false)
  const [savedAt,     setSavedAt]     = useState<Date | null>(null)

  // ── Hydrate from community settings when community changes ────────────────
  useEffect(() => {
    if (!selectedCommunity) return
    const settings = selectedCommunity.settings
    setEnabled(settings?.welcomeDmEnabled ?? false)
    setMessage(settings?.welcomeDmMessage?.trim() || DEFAULT_TEMPLATE)
    setIsDirty(false)
    setSavedAt(null)
  }, [selectedCommunity?.id, selectedCommunity?.settings?.welcomeDmEnabled, selectedCommunity?.settings?.welcomeDmMessage])

  // ── Track unsaved changes ─────────────────────────────────────────────────
  const handleToggle = useCallback(() => {
    setEnabled(prev => !prev)
    setIsDirty(true)
  }, [])

  const handleMessageChange = useCallback((value: string) => {
    if (value.length <= 2000) {
      setMessage(value)
      setIsDirty(true)
    }
  }, [])

  // ── Insert variable at cursor position ───────────────────────────────────
  const insertVariable = useCallback((variable: string) => {
    const textarea = document.getElementById("welcome-dm-textarea") as HTMLTextAreaElement | null
    if (!textarea) {
      setMessage(prev => prev + variable)
      setIsDirty(true)
      return
    }
    const start = textarea.selectionStart ?? message.length
    const end   = textarea.selectionEnd   ?? message.length
    const updated = message.slice(0, start) + variable + message.slice(end)
    if (updated.length <= 2000) {
      setMessage(updated)
      setIsDirty(true)
      // Restore cursor after inserted variable
      requestAnimationFrame(() => {
        textarea.focus()
        const newPos = start + variable.length
        textarea.setSelectionRange(newPos, newPos)
      })
    }
  }, [message])

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!selectedCommunityId) {
      toast({
        title: "No community selected",
        description: "Please select a community from the top of the sidebar first.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await communitiesApi.updateSettings(selectedCommunityId, {
        welcomeDmEnabled: enabled,
        welcomeDmMessage: message.trim(),
      } as any)

      setIsDirty(false)
      setSavedAt(new Date())
      toast({
        title: "Auto DM saved",
        description: enabled
          ? "New members will automatically receive your welcome message."
          : "Auto DM is disabled. New members will not receive a welcome message.",
      })
    } catch (err: any) {
      toast({
        title: "Failed to save",
        description: err?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [selectedCommunityId, enabled, message, toast])

  // ── Derived ───────────────────────────────────────────────────────────────
  const previewText    = resolvePreview(message, selectedCommunity?.name || "")
  const charCount      = message.length
  const countColour    = getCountColour(charCount)
  const communityName  = selectedCommunity?.name || "—"

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-100">
            <Bot className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Auto DM</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Send an automatic welcome message to every new member who joins{" "}
              <span className="font-medium text-gray-700">{communityName}</span>.
            </p>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8e78fb] text-white text-sm font-medium
                     hover:bg-[#7c65f0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Saved confirmation */}
      {savedAt && !isDirty && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Settings saved at {savedAt.toLocaleTimeString()}.
        </div>
      )}

      {/* ── Enable / disable toggle ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Enable Welcome DM</h2>
            <p className="text-sm text-gray-500 mt-1">
              When turned on, your welcome message is automatically sent as a Direct Message
              every time someone joins this community.
            </p>
          </div>
          <button
            onClick={handleToggle}
            className="flex-shrink-0 ml-6"
            aria-label={enabled ? "Disable Auto DM" : "Enable Auto DM"}
          >
            {enabled ? (
              <ToggleRight className="w-10 h-10 text-[#8e78fb]" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-gray-300" />
            )}
          </button>
        </div>

        {/* Status pill */}
        <div className="mt-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              enabled
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-green-500" : "bg-gray-400"}`}
            />
            {enabled ? "Active — new members will receive a welcome DM" : "Inactive — no auto DM will be sent"}
          </span>
        </div>
      </div>

      {/* ── Message editor ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Welcome Message</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Write your message below. Use the variable buttons to personalise it dynamically.
            </p>
          </div>
          <button
            onClick={() => setShowPreview(prev => !prev)}
            className="flex items-center gap-1.5 text-sm text-[#8e78fb] hover:text-[#7c65f0] transition-colors"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? "Hide preview" : "Preview"}
          </button>
        </div>

        {/* Variable chips */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-400 self-center mr-1">Insert:</span>
          {TEMPLATE_VARIABLES.map(({ variable, label }) => (
            <button
              key={variable}
              onClick={() => insertVariable(variable)}
              className="px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700
                         text-xs font-mono hover:bg-purple-100 transition-colors"
            >
              {variable}
              <span className="ml-1.5 text-purple-400 font-sans font-normal">{label}</span>
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            id="welcome-dm-textarea"
            value={message}
            onChange={e => handleMessageChange(e.target.value)}
            rows={12}
            placeholder="Write your welcome message here…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#8e78fb]
                       focus:ring-2 focus:ring-purple-100 outline-none resize-y font-mono text-sm
                       text-gray-800 placeholder:text-gray-300 bg-gray-50 transition-colors"
          />
          {/* Character counter */}
          <span className={`absolute bottom-3 right-3 text-xs ${countColour}`}>
            {charCount} / 2000
          </span>
        </div>

        {/* Info callout */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-xs">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Variables are replaced with real values when the message is sent.{" "}
            <strong>{"{{memberName}}"}</strong> becomes the member's display name,{" "}
            <strong>{"{{communityName}}"}</strong> becomes <em>{communityName}</em>, and{" "}
            <strong>{"{{creatorName}}"}</strong> becomes your name.
          </span>
        </div>
      </div>

      {/* ── Live preview panel ── */}
      {showPreview && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Message Preview
            <span className="ml-2 text-xs font-normal text-gray-400">
              (as seen by a new member named "Alex")
            </span>
          </h2>

          {/* Simulated DM bubble */}
          <div className="bg-gray-50 rounded-xl p-4 max-w-md">
            {/* Sender row */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8e78fb] to-[#f48fb1] flex items-center justify-center text-white text-xs font-bold">
                {(selectedCommunity?.creator?.name || "C")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  {selectedCommunity?.creator?.name || "You"}
                </p>
                <p className="text-[10px] text-gray-400">Just now</p>
              </div>
            </div>
            {/* Bubble */}
            <div className="bg-[#1f2430] text-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {previewText}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            The member will also receive a push notification and see this in their{" "}
            <strong>Messages</strong> inbox.
          </p>
        </div>
      )}

      {/* ── How it works callout ── */}
      <div className="rounded-2xl border border-dashed border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">How Auto DM works</h3>
        <ol className="space-y-2 text-sm text-gray-500 list-decimal list-inside">
          <li>A new member joins <strong>{communityName}</strong> (free join, invite link, or after payment).</li>
          <li>Chabaqa automatically opens a Direct Message thread between you and the new member.</li>
          <li>Your welcome message is delivered instantly — appearing in their Messages inbox.</li>
          <li>The member receives a push notification and an in-app badge.</li>
          <li>They can reply directly to you in the same thread.</li>
        </ol>
        <p className="mt-4 text-xs text-gray-400">
          Auto DMs are sent as real Direct Messages — members can reply, and you will see their
          reply in <strong>/creator/marketing/emails</strong> or your Messages inbox.
        </p>
      </div>

    </div>
  )
}
```

---

### 4.4 Loading skeleton

**File to create:** `chabaqa-demo/frontend/app/(creator)/creator/marketing/auto-dm/loading.tsx`

```typescript
export default function AutoDmLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="space-y-2">
            <div className="w-28 h-5 rounded bg-gray-200" />
            <div className="w-64 h-4 rounded bg-gray-100" />
          </div>
        </div>
        <div className="w-32 h-9 rounded-lg bg-gray-200" />
      </div>

      {/* Toggle card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex justify-between items-center">
        <div className="space-y-2 flex-1">
          <div className="w-40 h-5 rounded bg-gray-200" />
          <div className="w-72 h-4 rounded bg-gray-100" />
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200 ml-6" />
      </div>

      {/* Message editor card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="w-36 h-5 rounded bg-gray-200" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-32 h-7 rounded-full bg-gray-100" />
          ))}
        </div>
        <div className="w-full h-48 rounded-xl bg-gray-100" />
      </div>
    </div>
  )
}
```

---

### 4.5 Sidebar — add Auto DM nav entry

**File:** `chabaqa-demo/frontend/app/(creator)/creator/components/dashboard-sidebar.tsx`

**Change:** Inside the `navigation` array, in the Marketing section (currently items start at ~line 264), add an **"Auto DM"** entry as the second item (after "Email Campaigns") and **remove the `soon: true` flag** from it. The "Messages" and "WhatsApp" entries already marked as `soon` can stay unchanged.

Find the existing Marketing `items` array (lines ~264–285 currently):

```typescript
// CURRENT (reference — do not copy verbatim):
items: [
    { title: "Email Campaigns", href: "/creator/marketing/emails",    icon: Mail },
    { title: "Affiliates",      href: "/creator/marketing/affiliates", icon: UserPlus,     soon: true },
    { title: "Affiliate Portal",href: "/dashboard/affiliate",          icon: ExternalLink, soon: true },
    { title: "Messages",        href: "/creator/marketing/messages",   icon: MessageSquare, soon: true },
    { title: "WhatsApp",        href: "/creator/marketing/whatsapp",   icon: MessageSquare, soon: true },
],
```

**After change (add the Auto DM entry after Email Campaigns):**

```typescript
items: [
    { title: "Email Campaigns", href: "/creator/marketing/emails",    icon: Mail },
    { title: "Auto DM",         href: "/creator/marketing/auto-dm",   icon: Bot },   // ← ADD
    { title: "Affiliates",      href: "/creator/marketing/affiliates", icon: UserPlus,     soon: true },
    { title: "Affiliate Portal",href: "/dashboard/affiliate",          icon: ExternalLink, soon: true },
    { title: "Messages",        href: "/creator/marketing/messages",   icon: MessageSquare, soon: true },
    { title: "WhatsApp",        href: "/creator/marketing/whatsapp",   icon: MessageSquare, soon: true },
],
```

**Import `Bot`** from `lucide-react` at the top of the file (add alongside the existing lucide imports):

```typescript
import { Bot } from "lucide-react" // ← ADD alongside existing lucide imports
```

---

## 5. Variable Templating Spec

| Variable | Replacement source | Fallback if empty |
|---|---|---|
| `{{memberName}}` | `user.name` → `user.firstName + ' ' + user.lastName` → `user.username` | `"there"` |
| `{{communityName}}` | `community.name` | `"our community"` |
| `{{creatorName}}` | `user.name` of creator → resolved same as memberName | `"the creator"` |

**Case-insensitive matching:** The regex uses the `gi` flags so `{{MemberName}}`, `{{MEMBERNAME}}`, and `{{memberName}}` all resolve correctly.

**Max length enforcement:**
- Backend: `maxlength: 2000` on the schema field + `.slice(0, 2000)` in `normalizeCommunitySettings()`
- Frontend: textarea's `onChange` guards `value.length <= 2000`

---

## 6. Edge Cases & Safety Rules

| Scenario | Behaviour |
|---|---|
| Creator joins their own community | `sendWelcomeDm()` returns early: `if (newMemberId === creatorId) return` |
| `welcomeDmEnabled = false` | Checked before calling `sendWelcomeDm()` — no call is made at all |
| `welcomeDmMessage` is empty string | `sendWelcomeDm()` returns early: `if (!trimmedTemplate) return` |
| Member re-joins (already a member) | `joinCommunity()` returns early before `notifyCreatorMemberJoined()` — no auto DM sent |
| LLM / DM creation fails | `sendWelcomeDm()` has its own `try/catch` — join is never rolled back |
| Race condition: two simultaneous joins | Duplicate key error on conversation creation is caught and handled — falls back to `findOne` |
| Conversation already exists (member DM'd creator manually first) | `findOne()` succeeds, skips `create()`, sends message into existing thread |
| Very long welcome message (>2000 chars) | Blocked at schema level (`maxlength`) and at frontend level (textarea guard) |
| `community.createur` is not populated | `community.createur.toString()` is a string ObjectId — always available without populate |
| Member has no display name | Fallback to `"there"` (e.g., message says "Hi there! 👋") |
| New member has no socket connected | `emitNewMessage()` emits to the room — silently fails if no listener. Push notification is sent regardless. |
| Paid community join | `checkoutCommunityMembership()` usually ends in a PaymentRequiredException. Actual member add happens in the payment confirmation webhook. **V2 item — see Section 8.** |

---

## 7. Testing Checklist

### Backend (manual curl / Postman)

- [ ] Creator creates a community, enables Auto DM via `PATCH /community-aff-crea-join/:id/settings` with `{ welcomeDmEnabled: true, welcomeDmMessage: "Hi {{memberName}}!" }`
- [ ] `GET /community-aff-crea-join/community/:id` returns `settings.welcomeDmEnabled = true` and `settings.welcomeDmMessage = "Hi {{memberName}}!"`
- [ ] A second user calls `POST /community-aff-crea-join/join` with `{ communityId }` → welcome DM is created in the DB (`conversations` collection has a `COMMUNITY_DM` doc; `messages` collection has the welcome message)
- [ ] Message text has `{{memberName}}` replaced with the real member name
- [ ] A second join by the same user does NOT create a duplicate DM (idempotent)
- [ ] Disabling Auto DM (`welcomeDmEnabled: false`) and joining again → no welcome DM is created
- [ ] Creator joining their own community → no welcome DM is sent (self-check guard)
- [ ] `POST /community-aff-crea-join/join-by-invite` also triggers the welcome DM

### Frontend (browser)

- [ ] `/creator/marketing/auto-dm` page loads without errors when a community is selected
- [ ] Toggle switches `enabled` state and marks page as dirty
- [ ] Variable chips insert correctly at cursor position in the textarea
- [ ] Character counter turns yellow at 1500, red at 1800, blocks at 2001
- [ ] Preview panel shows resolved variables with "Alex", current community name, and "You"
- [ ] Save calls `PATCH /community-aff-crea-join/:id/settings` with correct body
- [ ] Success toast appears after save
- [ ] Refreshing the page re-hydrates settings from the API (settings are persisted)
- [ ] Switching community selector updates all state correctly (no stale data from previous community)
- [ ] "Auto DM" nav item appears in the Marketing section of the sidebar
- [ ] Loading skeleton renders during initial page load

### Real-time (browser, two tabs)

- [ ] Tab A: logged in as creator, open `/messages`
- [ ] Tab B: logged in as new member, join the creator's community
- [ ] Tab A: sees new conversation thread appear (if inbox polling is active)
- [ ] Tab B: member receives push notification and DM badge appears in the community header

---

## 8. V2 Roadmap (Out of Scope for This Sprint)

| Item | Reason deferred |
|---|---|
| **Auto DM for paid community members** | The actual member addition for paid communities happens inside the Stripe/Konnect payment webhook handler, which is a separate module not covered in this sprint. The auto DM call must be added to the `ORDER_COMPLETED` webhook processor when `contentType === 'community'`. |
| **AI-personalised welcome message** | Add an optional "Personalise with AI" button that calls `POST /ai/content/assist` with `action: 'improve'` on the current template text. This requires the AI Writing Assistant (Sprint 1B) to be built first. |
| **Delivery analytics** | Track how many Auto DMs were sent, opened (conversation read), and replied to. Adds a `welcomeDmStats` sub-object to community stats. |
| **Delay option** | Let the creator set a delay (e.g., "send 10 minutes after joining") using a Bull delayed job instead of immediate delivery. |
| **Multiple auto DM templates** | A/B testing: Creator defines two message variants; Chabaqa randomly assigns them and tracks which gets more replies. |
| **Rich media in welcome DM** | Allow the creator to attach an image or PDF to the welcome DM (e.g., an onboarding guide). |

---

*Plan authored against: `chabaqa-demo/backend/src/` (40+ modules) and `chabaqa-demo/frontend/` verified April 2026.*