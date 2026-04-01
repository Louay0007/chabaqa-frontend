# Chabaqa — Creator Subscription & Storage Inspection: Full Implementation Plan

> **Goal:** Let every creator see their Chabaqa platform subscription, understand their limits, monitor their storage, and manage their billing — all from inside the dashboard.
>
> **Enforcement flag:** `PLAN_ENFORCEMENT_MODE=true` must be set before any restriction goes live.  
> **Currency:** All prices in TND (Tunisian Dinar).

---

## Table of Contents

1. [Big Picture: What We Are Building](#1-big-picture)
2. [Database — What Exists & What Powers Each View](#2-database)
3. [Backend API Endpoints — Full Map](#3-backend-api)
4. [Page Architecture — Where Everything Lives](#4-page-architecture)
5. [Page 1: My Plan (`/creator/plan`)](#5-my-plan-page)
6. [Page 2: Storage Inspector (`/creator/plan/storage`)](#6-storage-inspector)
7. [Page 3: Invoices (`/creator/plan/invoices`)](#7-invoices-page)
8. [Page 4: Upgrade / Change Plan (`/creator/plan/upgrade`)](#8-upgrade-page)
9. [Settings Page — Subscription Section](#9-settings-page)
10. [Usage Indicator Widgets — Global Components](#10-usage-widgets)
11. [Feature Gates — How Locked Features Look](#11-feature-gates)
12. [Trial Banner — Countdown Widget](#12-trial-banner)
13. [Enforcement Mode Checklist](#13-enforcement-checklist)
14. [Data Flow Diagrams](#14-data-flow)
15. [Implementation TODO Order](#15-todo-order)

---

## 1. Big Picture

### What the Creator Needs to Do

| Creator Action | Where It Happens |
|---|---|
| See which plan I'm on | `/creator/plan` — "My Plan" page |
| See how much of my limits I've used | `/creator/plan` — Usage cards |
| See how much storage I've used/remaining | `/creator/plan/storage` |
| See billing history / download invoices | `/creator/plan/invoices` |
| Upgrade or change my plan | `/creator/plan/upgrade` |
| Cancel my subscription | `/creator/plan` — danger zone |
| See subscription settings in one place | `/creator/settings` — Subscription tab |
| See trial countdown | Global sticky banner (all creator pages) |
| Get blocked when limit is hit | Inline gate with upgrade CTA |

### Two Contexts — Do Not Confuse Them

| Context | URL | What It Is |
|---|---|---|
| **My Chabaqa Subscription** | `/creator/plan` | The creator's OWN subscription to the Chabaqa platform (Starter/Growth/Pro) |
| **My Audience Subscriptions** | `/creator/monetization/subscriptions` | The memberships that *the creator's fans* pay to join their community |

This document covers **context #1** only — the creator's own platform subscription.

---

## 2. Database

### Collections Involved

#### `plans` collection — Plan Definitions

Seeded once via `seed-plans.ts`. One document per tier.

```
{
  tier: "starter" | "growth" | "pro"
  name: "Starter" | "Growth" | "Pro"
  priceDTPerMonth: 39 | 99 | 159
  yearlyPriceDTPerMonth: 31 | 79 | 127
  yearlyTotalDT: 372 | 948 | 1524
  trialDays: 7
  limits: {
    communitiesMax, membersMax, coursesActivationMax,
    storageGB, adminsMax,
    emailCampaignRecipientsPerMonth, whatsappMessagesPerMonth,
    analyticsLookbackDays, sessionBookingsPerMonth
  }
  features: {
    courses, challenges, sessions, products, events,
    automationQuota, branding, gamification,
    verifiedBadge, featuredBadge
  }
  transactionFeePercent: 7.9 | 4.9 | 2.9
  transactionFixedFeeDT: 0.5
  isActive: true
}
```

#### `subscriptions` collection — Creator's Subscription State

One document per creator. Updated on every plan change.

```
{
  creatorId: ObjectId         ← links to the creator user
  plan: "starter"|"growth"|"pro"
  status: "trialing"|"active"|"past_due"|"canceled"|"incomplete"
  trialEndsAt: Date
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  hasPaymentMethod: boolean
  paymentBrand: "visa"|"mastercard"|...
  paymentLast4: "1234"
  amount: number              ← amount charged per period
  currency: "TND"
  nextBillingAt: Date

  // Denormalized limits (copy from plan at subscription time for fast lookups)
  membersMax, communitiesMax, coursesActivationMax,
  storageGB, adminsMax,
  emailCampaignRecipientsPerMonth, whatsappMessagesPerMonth,
  analyticsLookbackDays, sessionBookingsPerMonth
}
```

#### `storageusages` collection — Per-Creator Storage Tracking

One document per creator user. Updated on every upload/delete.

```
{
  userId: ObjectId    ← same as creatorId
  usedBytes: number   ← total bytes used, incremented by upload service
}
```

#### How Storage Is Tracked Right Now

`UploadService` calls `storageModel.updateOne({ userId }, { $inc: { usedBytes: bytes } }, { upsert: true })` after every upload. On file delete, it decrements. This is already wired up.

To get current usage in GB:
```
usedGB = usedBytes / (1024 * 1024 * 1024)
```

### Key Queries

| What We Need | Query |
|---|---|
| Creator's plan & subscription | `subscriptions.findOne({ creatorId })` |
| Plan details (features/limits) | `plans.findOne({ tier: sub.plan })` |
| Storage used (bytes) | `storageusages.findOne({ userId: creatorId })` |
| % storage used | `(usedBytes / (storageGB * 1024^3)) * 100` |
| Days left in trial | `Math.ceil((trialEndsAt - now) / 86400000)` |
| Days left in billing period | `Math.ceil((currentPeriodEnd - now) / 86400000)` |

---

## 3. Backend API Endpoints

### Already Exists ✅

| Method | Endpoint | What It Returns |
|---|---|---|
| `GET` | `/subscriptions/me` | Creator's full subscription object |
| `GET` | `/subscriptions/trial-remaining` | `{ days, hours, minutes, isTrialing, message }` |
| `GET` | `/subscriptions/usage` | Usage summary vs. plan limits |
| `GET` | `/subscriptions/invoices` | Paginated list of invoices |
| `GET` | `/subscriptions/invoices/:id` | Single invoice |
| `POST` | `/subscriptions/start-trial` | Starts 7-day Starter trial |
| `POST` | `/subscriptions/upgrade` | Changes plan tier |
| `POST` | `/subscriptions/cancel` | Cancels at period end |
| `POST` | `/subscriptions/setup-billing` | Saves payment method info |
| `GET` | `/subscriptions/plans` | All available plans with prices/features |

### Needs to Be Added ⚠️

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/subscriptions/storage` | Return `{ usedBytes, usedGB, limitGB, percentUsed, remainingGB }` |
| `POST` | `/subscriptions/reactivate` | Undo `cancelAtPeriodEnd` if creator changes mind |

#### `/subscriptions/storage` — Implementation Spec

```typescript
// In SubscriptionController
@Get('storage')
@UseGuards(JwtAuthGuard)
async getStorageUsage(@Request() req: any) {
  const creatorId = req.user._id || req.user.sub;
  return this.subscriptionService.getStorageUsage(creatorId);
}

// In SubscriptionService
async getStorageUsage(creatorId: string) {
  const sub = await this.subModel.findOne({ creatorId: new Types.ObjectId(creatorId) }).lean();
  const storageDoc = await this.storageModel.findOne({ userId: new Types.ObjectId(creatorId) }).lean();
  
  const usedBytes = storageDoc?.usedBytes ?? 0;
  const limitGB = sub?.storageGB ?? 5;  // fallback to Starter default
  const limitBytes = limitGB * 1024 * 1024 * 1024;
  const usedGB = usedBytes / (1024 * 1024 * 1024);
  const percentUsed = Math.min(100, (usedBytes / limitBytes) * 100);
  const remainingGB = Math.max(0, limitGB - usedGB);

  return {
    usedBytes,
    usedGB: parseFloat(usedGB.toFixed(2)),
    limitGB,
    limitBytes,
    percentUsed: parseFloat(percentUsed.toFixed(1)),
    remainingGB: parseFloat(remainingGB.toFixed(2)),
    isNearLimit: percentUsed >= 80,
    isAtLimit: percentUsed >= 100,
  };
}
```

---

## 4. Page Architecture

### File Structure to Create

```
frontend/app/(creator)/creator/
├── plan/
│   ├── layout.tsx            ← shared layout with tab navigation
│   ├── page.tsx              ← "My Plan" — main overview
│   ├── loading.tsx
│   ├── storage/
│   │   ├── page.tsx          ← storage inspector
│   │   └── loading.tsx
│   ├── invoices/
│   │   ├── page.tsx          ← billing history
│   │   └── loading.tsx
│   └── upgrade/
│       ├── page.tsx          ← upgrade/change plan
│       └── loading.tsx
└── settings/
    └── page.tsx              ← existing, add subscription tab
```

### Navigation Integration

Add to creator sidebar (already has `/creator/monetization` section):

```
⚙️  Plan & Billing          /creator/plan
    └── Storage             /creator/plan/storage
    └── Invoices            /creator/plan/invoices
```

---

## 5. My Plan Page (`/creator/plan`)

This is the **main hub** for everything subscription-related.

### Sections on This Page

#### Section A — Plan Status Card (Top)

Visual card showing current plan. Data from `GET /subscriptions/me`.

```
┌─────────────────────────────────────────────┐
│  🚀 Pro Plan                    [ACTIVE]     │
│  Renews on: April 28, 2026                  │
│  Next charge: 159 TND                        │
│  Payment: VISA •••• 4242                    │
│                                             │
│  [Manage Billing]  [Upgrade]  [Cancel]      │
└─────────────────────────────────────────────┘
```

States to handle:
- `trialing` → Show trial countdown banner + days left badge
- `active` → Normal display with renewal date
- `past_due` → Red banner: "Payment failed — update billing to restore access"
- `canceled` → Orange banner: "Cancels on [date]. Reactivate?"
- `incomplete` → Yellow: "Subscription setup incomplete"
- No subscription → Prompt to choose a plan

#### Section B — Usage Gauges

Visual progress bars for every limit. Data from `GET /subscriptions/usage` + `GET /subscriptions/storage`.

```
Plan Usage — Growth
─────────────────────────────────────────
Members          ████████░░  312 / 500
Storage          ███░░░░░░░  14.2 GB / 50 GB
Active Courses   ██████████  Unlimited
Admin Seats      ██░░░░░░░░  1 / 2
Email Recipients ████░░░░░░  420 / 1,000 this month
Session Bookings ██░░░░░░░░  48 / 300 this month
WhatsApp         ███░░░░░░░  78 / 250 this month
```

Color coding:
- 0–79%: Green progress bar
- 80–99%: Amber progress bar + "⚠️ Near limit" label
- 100%+: Red progress bar + "❌ At limit — Upgrade to continue"

#### Section C — Features Included / Not Included

Two-column checklist based on plan features.

```
✅ Included in Your Plan          ❌ Not Included (Upgrade)
─────────────────────────         ────────────────────────
✓ Courses (unlimited)             ✗ Remove Chabaqa Branding  → Pro
✓ Digital Products                ✗ Featured Badge           → Pro
✓ Challenges                      
✓ Events                          
✓ 1:1 Sessions (300/mo)           
✓ Gamification                    
✓ Verified Badge                  
✓ 6-month Analytics               
✓ Email Campaigns (1,000/mo)      
```

#### Section D — Plan Comparison Table

Static comparison so the creator can see what the next plan offers. Trigger upgrade modal from here.

```
                    You Are Here
                        ↓
        Starter    [Growth]     Pro
Members   100        500       Unlimited
Storage   5 GB       50 GB     300 GB
...
Fee       7.9%       4.9%      2.9%

                  [Upgrade to Pro →]
```

#### Section E — Add-ons

If the creator is on Starter or Growth, show available add-ons:
- Extra admin seat: +15 TND/month
- Extra storage: +10–12 TND per 100 GB/month

#### Section F — Danger Zone

```
⚠️ Danger Zone
─────────────────────────────────────────────
Cancel Subscription    [Cancel at period end]

Note: You will retain access until April 28, 2026.
All your data will be preserved for 30 days after cancellation.
```

---

## 6. Storage Inspector (`/creator/plan/storage`)

### Data Source

- `GET /subscriptions/storage` → `{ usedGB, limitGB, percentUsed, remainingGB, usedBytes }`
- Also useful: a breakdown by content type (videos, images, documents, other)

### Page Layout

#### Header Card

```
Storage Usage
─────────────────────────────────────────
       [██████████████░░░░░░░░░░░░░░]
        14.2 GB used of 50 GB
        35.8 GB remaining (71.6% free)

[Upgrade to Pro for 300 GB →]
```

#### Breakdown by Type (if available)

```
📹 Videos          8.4 GB  ████████████░░░░░░░░  59%
🖼️ Images          3.1 GB  █████░░░░░░░░░░░░░░░  22%
📄 Documents       1.8 GB  ███░░░░░░░░░░░░░░░░░  13%
📦 Other           0.9 GB  █░░░░░░░░░░░░░░░░░░░   6%
```

> Note: If backend doesn't track per-type breakdown yet, show only the total. The breakdown column can be added later by tagging uploads with a media type in the `storageusages` collection.

#### Storage Add-on Banner (when > 80% full)

```
⚠️ You've used 80%+ of your storage!
  
  Add more storage without upgrading your plan:
  +100 GB for 10 TND/month (Growth plan rate)
  
  [Add 100 GB]   [Upgrade to Pro instead]
```

#### Best Practice Tips (always visible)

```
💡 Save Storage Space
─────────────────────────────
• Compress video before upload (use HandBrake — target 1080p max)
• Use external embed for YouTube/Vimeo instead of direct upload
• Archive or delete unused course content
```

---

## 7. Invoices Page (`/creator/plan/invoices`)

### Data Source

`GET /subscriptions/invoices?page=1&limit=20`

### Page Layout

```
Billing History
─────────────────────────────────────────────────────────────────
Invoice #      Date           Amount    Status    Action
─────────────────────────────────────────────────────────────────
INV-2026-003   Apr 1, 2026    159 TND   ✅ Paid    [Download PDF]
INV-2026-002   Mar 1, 2026    159 TND   ✅ Paid    [Download PDF]
INV-2026-001   Feb 1, 2026    159 TND   ✅ Paid    [Download PDF]
INV-2025-012   Jan 1, 2026    99 TND    ✅ Paid    [Download PDF]
─────────────────────────────────────────────────────────────────
```

Status badges:
- `paid` → Green ✅
- `open` → Blue (awaiting payment)
- `void` → Gray
- `uncollectible` → Red

Also show:
- Total paid this year (summary card at top)
- Download all button (future: ZIP of PDFs)

---

## 8. Upgrade Page (`/creator/plan/upgrade`)

### URL Params Accepted

`/creator/plan/upgrade?plan=pro&billing=yearly`

This page is also reachable from:
- The upgrade button on `/creator/plan`
- Any `UpgradeModal` in the app
- Any `LockedFeatureCard` CTA

### Page Layout

#### Step 1 — Choose Plan

Visual plan cards (same as landing pricing page, styled for the dashboard).

```
         [Monthly]  [Yearly — Save 20%]

┌─────────────┐  ┌──────────────────┐  ┌───────────────┐
│   Starter   │  │     Growth ⭐     │  │     Pro       │
│   39 TND/mo │  │    99 TND/mo     │  │  159 TND/mo   │
│ ─────────── │  │ ──────────────── │  │ ───────────── │
│ 100 members │  │  500 members     │  │ ∞ members     │
│   5 GB      │  │   50 GB          │  │  300 GB       │
│   7.9% fee  │  │    4.9% fee      │  │   2.9% fee    │
│  [Select]   │  │   [Select]       │  │   [Select]    │
└─────────────┘  └──────────────────┘  └───────────────┘
```

Highlight the recommended plan based on current usage (e.g., if member count > 80% of current limit, highlight the next plan).

#### Step 2 — Confirm & Pay

```
Upgrading to Pro Plan
─────────────────────────────────────
Plan:     Pro
Billing:  Monthly
Amount:   159 TND / month
Trial:    N/A (already subscribed)
Payment:  VISA •••• 4242

[Confirm Upgrade]   [Back]
```

If no payment method on file → show "Add Payment Method" step first.

#### Payment Methods Available

Based on current backend stubs:
- Stripe Link → `POST /payment/stripe-link/init/subscription`
- Konnect → `POST /payment/konnect/init/subscription`

When payment is confirmed by the provider webhook → backend calls `SubscriptionService.upgradePlan(creatorId, tier)` which:
1. Fetches plan document from `plans` collection
2. Updates `subscriptions` document with new tier + denormalized limits
3. Updates `status = 'active'`

---

## 9. Settings Page — Subscription Section

The existing `/creator/settings` page should include a **"Subscription"** tab (or sub-section).

### What Goes in This Section

```
Settings > Subscription
─────────────────────────────────────────────

Current Plan
  Growth Plan — Active
  Renews April 28, 2026 for 99 TND
  [Change Plan]

Payment Method
  VISA •••• 4242
  [Update Payment Method]

Billing Email
  creator@example.com
  [Change]

Cancellation
  [Cancel Subscription]
```

This is intentionally minimal — it's a settings view, not the full billing hub. Link to `/creator/plan` for full details.

---

## 10. Usage Indicator Widgets — Global Components

These are already built in `components/plan/usage-indicator.tsx`. They need to be placed on key pages.

### Where to Place `<UsageSummary />`

| Page | Placement | Data Props |
|---|---|---|
| `/creator/plan` | Main content area | Full usage data |
| `/creator/team` | Sidebar or top | `adminCount` |
| `/creator/courses` | Sidebar or top | `activeCourseCount` |
| `/creator/communities` | Sidebar or top | `memberCount` |
| `/creator/marketing/emails` | Sidebar | `emailsSentThisMonth` |
| `/creator/sessions` | Sidebar | `sessionBookingsThisMonth` |

### How to Fetch Usage Data

```typescript
// use this hook on any page that needs usage data
const { data: usage } = useQuery({
  queryKey: ['subscription-usage'],
  queryFn: () => subscriptionApi.getUsageSummary(),
  staleTime: 5 * 60 * 1000,  // refresh every 5 minutes
  enabled: PLAN_ENFORCEMENT_MODE,
});
```

---

## 11. Feature Gates — How Locked Features Look

### Component: `<FeatureGate feature="challenges">`

Already built in `components/plan/feature-gate.tsx`.

Usage pattern:

```tsx
// Option 1: Hide completely
<FeatureGate feature="challenges">
  <ChallengesContent />
</FeatureGate>

// Option 2: Show lock screen instead
<FeatureGate 
  feature="challenges" 
  fallback={
    <LockedFeatureCard 
      feature="Challenges" 
      requiredPlan="growth"
      description="Create competitive challenges for your community members."
    />
  }
>
  <ChallengesContent />
</FeatureGate>
```

### Pages That Need Feature Gates Added

| Page | Feature Key | Minimum Plan |
|---|---|---|
| `/creator/challenges` | `challenges` | Growth |
| `/creator/sessions` | `sessions` | Growth |
| `/creator/events` | `events` | Growth |
| `/creator/marketing/emails` | *(limit gate)* | Growth (1,000/mo) |
| `/creator/marketing/whatsapp` | *(limit gate)* | Growth (250/mo) |
| Creator branding/customize | `branding` | Pro |
| Analytics export button | *(manual check)* | Pro |

### Limit Gates (not boolean features)

For things like "you've hit 100 members on Starter", use `isAtLimit`:

```tsx
const { isAtLimit } = usePlan();

// When inviting a new member
if (isAtLimit('membersMax', currentMemberCount)) {
  return <LimitReachedBanner feature="Members" requiredPlan="growth" />;
}
```

---

## 12. Trial Banner — Countdown Widget

### Component: `<TrialBanner />`

This banner should appear at the top of **all creator pages** when `status === 'trialing'`.

```
⏰  Your 7-day free trial ends in 3 days.  [Add Payment Method]  [Dismiss]
```

When < 24 hours:
```
🔴  Your trial expires in 6 hours!  [Upgrade Now]
```

### Data Source

`GET /subscriptions/trial-remaining` → `{ days, hours, minutes, isTrialing, message }`

### Placement

Wrap in creator layout (`/app/(creator)/creator/layout.tsx`):

```tsx
// In creator layout
import { TrialBanner } from '@/components/plan/trial-banner';

export default function CreatorLayout({ children }) {
  return (
    <div>
      <TrialBanner />       {/* ← add here */}
      <CreatorSidebar />
      <main>{children}</main>
    </div>
  );
}
```

---

## 13. Enforcement Mode Checklist

Before flipping `PLAN_ENFORCEMENT_MODE=true`, verify each item:

### Backend ✅ / ⚠️ Status

| Item | Status | Notes |
|---|---|---|
| Plan schema + seed script | ✅ Ready | Run `npx ts-node src/common/scripts/seed-plans.ts` |
| Subscription schema | ✅ Ready | `subscription.schema.ts` |
| StorageUsage tracking | ✅ Ready | `upload.service.ts` increments on every upload |
| PolicyService limits checks | ✅ Ready | members, courses, storage, admins |
| PolicyService feature checks | ✅ Ready | `canUseFeature()` |
| PlanFeatureGuard | ✅ Ready | Attach to routes with `@RequireFeature('challenges')` |
| `GET /subscriptions/storage` | ⚠️ Needs to be added | See Section 3 |
| `POST /subscriptions/reactivate` | ⚠️ Needs to be added | Optional |
| `FREE_MODE` → migrate to `PLAN_ENFORCEMENT_MODE` | ⚠️ Pending | `event.service.ts`, `wallet.service.ts`, `product.service.ts` still use `FREE_MODE` |
| Apply `@RequireFeature` to challenge routes | ⚠️ Pending | `challenge.controller.ts` |
| Apply `@RequireFeature` to session routes | ⚠️ Pending | `session.controller.ts` |
| Apply `@RequireFeature` to event routes | ⚠️ Pending | `event.controller.ts` |
| Analytics lookback enforcement | ✅ Ready | `analytics.service.ts` checks `PLAN_ENFORCEMENT_MODE` |
| Email campaign quota enforcement | ✅ Ready | `email-campaign.service.ts` |

### Frontend ✅ / ⚠️ Status

| Item | Status | Notes |
|---|---|---|
| `plan-config.ts` — canonical plan data | ✅ Ready | Single source of truth |
| `use-plan` hook | ✅ Ready | `hooks/use-plan.ts` |
| `FeatureGate` component | ✅ Ready | `components/plan/feature-gate.tsx` |
| `UsageIndicator` / `UsageSummary` | ✅ Ready | `components/plan/usage-indicator.tsx` |
| `UpgradeModal` / `LockedFeatureCard` | ✅ Ready | `components/plan/upgrade-modal.tsx` |
| `/creator/plan` — My Plan page | ⚠️ **Not built yet** | Main work |
| `/creator/plan/storage` — Storage inspector | ⚠️ **Not built yet** | |
| `/creator/plan/invoices` — Billing history | ⚠️ **Not built yet** | |
| `/creator/plan/upgrade` — Upgrade flow | ⚠️ **Not built yet** | |
| Trial countdown banner | ⚠️ **Not built yet** | |
| Gates on challenges/sessions/events pages | ⚠️ **Not applied yet** | |
| `NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE=true` in `.env` | ⚠️ **Not flipped yet** | Flip last |

---

## 14. Data Flow Diagrams

### Flow A — Creator Opens "My Plan" Page

```
Creator visits /creator/plan
        ↓
Frontend calls:
  GET /subscriptions/me          → subscription object (plan, status, dates, limits)
  GET /subscriptions/plans       → all plan definitions (for comparison table)
  GET /subscriptions/usage       → current usage counts vs. limits
  GET /subscriptions/storage     → storage bytes used
        ↓
Render:
  - Status card (plan name, status badge, renewal date, payment info)
  - Usage gauges (members, storage, courses, admins, email, sessions)
  - Feature checklist (what's included vs. not)
  - Plan comparison table
  - Upgrade CTA if on Starter/Growth
  - Danger zone (cancel)
```

### Flow B — Creator Hits a Feature Gate

```
Creator clicks "Challenges" in sidebar
        ↓
Page renders
        ↓
<FeatureGate feature="challenges">
  checks: usePlan().canUseFeature('challenges')
        ↓
  PLAN_ENFORCEMENT_MODE=true?
    NO  → render ChallengesContent (bypass)
    YES → fetch subscription → check plan.features.challenges
            → false (Starter) → render <LockedFeatureCard requiredPlan="growth" />
            → true (Growth/Pro) → render ChallengesContent
```

### Flow C — Creator Upgrades Plan

```
Creator clicks [Upgrade to Growth]
        ↓
/creator/plan/upgrade?plan=growth&billing=monthly
        ↓
No payment method? → Show payment form → Konnect/Stripe redirect
Has payment method? → Show confirmation card
        ↓
Creator confirms
        ↓
POST /payment/konnect/init/subscription { tier: 'growth' }
OR POST /payment/stripe-link/init/subscription { tier: 'growth' }
        ↓
Payment provider redirects back + sends webhook
        ↓
Backend webhook handler:
  → SubscriptionService.upgradePlan(creatorId, 'growth')
  → Fetches Growth plan doc from plans collection
  → Updates subscription document:
      plan: 'growth',
      status: 'active',
      membersMax: 500,
      storageGB: 50,
      ... (all Growth limits denormalized)
        ↓
Frontend invalidates ['my-subscription'] query cache
        ↓
Creator sees updated plan on /creator/plan
```

### Flow D — Storage Upload Check

```
Creator uploads a video file
        ↓
UploadService.handleUpload()
        ↓
Get current storage usage: storageModel.findOne({ userId })
Get subscription limit: policyService.getEffectiveLimitsForCreator(creatorId)
        ↓
Check: usedBytes + newFileBytes > limitGB * 1024^3 ?
  YES → throw ForbiddenException("Storage limit reached. Upgrade your plan.")
  NO  → save file → storageModel.updateOne({ $inc: { usedBytes: fileSize } })
```

---

## 15. Implementation TODO Order

### Phase 1 — Backend Additions (no frontend changes yet)

1. Add `GET /subscriptions/storage` endpoint in `subscription.controller.ts` + service method
2. Add `POST /subscriptions/reactivate` endpoint (undo `cancelAtPeriodEnd`)
3. Add `@RequireFeature('challenges')` to `ChallengeController` routes
4. Add `@RequireFeature('sessions')` to `SessionController` routes
5. Add `@RequireFeature('events')` to `EventController` routes
6. Migrate `FREE_MODE` references in `event.service.ts`, `wallet.service.ts`, `product.service.ts` → use `PLAN_ENFORCEMENT_MODE`
7. Run seed script: `npx ts-node src/common/scripts/seed-plans.ts`

### Phase 2 — Frontend Core Pages

8. Create `/creator/plan/layout.tsx` with tab navigation
9. Create `/creator/plan/page.tsx` — My Plan page (all 6 sections)
10. Create `/creator/plan/storage/page.tsx` — Storage inspector
11. Create `/creator/plan/invoices/page.tsx` — Billing history
12. Create `/creator/plan/upgrade/page.tsx` — Upgrade flow
13. Create `components/plan/trial-banner.tsx` — Trial countdown banner
14. Wire `<TrialBanner />` into creator layout

### Phase 3 — Feature Gates on Existing Pages

15. Add `<FeatureGate feature="challenges">` to challenges page
16. Add `<FeatureGate feature="sessions">` to sessions page
17. Add `<FeatureGate feature="events">` to events page
18. Add `<UsageSummary />` to team page (admin seats)
19. Add `<UsageSummary />` to courses page (active courses)
20. Add member limit check on community join / invite action

### Phase 4 — Settings Integration

21. Add "Subscription" tab to `/creator/settings/page.tsx`
22. Add plan info to creator sidebar (small badge showing plan name)

### Phase 5 — Go Live

23. Set `PLAN_ENFORCEMENT_MODE=true` in backend `.env`
24. Set `NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE=true` in frontend `.env`
25. Notify all existing creators 30 days before enforcement (email campaign)
26. Monitor for `ForbiddenException` errors in Sentry/logs

---

## Summary

```
/creator/plan           → Main subscription hub
  ├── Status card       → plan name, status, renewal date, payment
  ├── Usage gauges      → all limits with % bars
  ├── Feature list      → what's included / what requires upgrade
  ├── Plan comparison   → side-by-side with upgrade CTAs
  └── Danger zone       → cancel subscription

/creator/plan/storage   → Storage drill-down
  ├── Total used GB / limit GB
  ├── % progress bar
  └── Tips to save space

/creator/plan/invoices  → Billing history
  └── Downloadable invoice PDFs

/creator/plan/upgrade   → Upgrade flow
  ├── Plan selector
  ├── Billing toggle (monthly/yearly)
  └── Payment confirmation

DB collections powering this:
  plans           → plan definitions + prices + limits
  subscriptions   → creator's current plan state + denormalized limits
  storageusages   → bytes used per creator

Key env flags:
  PLAN_ENFORCEMENT_MODE=true     (backend .env)
  NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE=true  (frontend .env)
```
