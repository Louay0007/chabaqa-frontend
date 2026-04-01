# Chabaqa — Creator Subscription & Storage Inspection: Full Implementation Plan

> **Goal:** Let every creator see their Chabaqa platform subscription, understand their limits, monitor their storage, and manage their billing — all from inside the dashboard.
>
> **Enforcement flag:** `PLAN_ENFORCEMENT_MODE=true` must be set before any restriction goes live.  
> **Currency:** All prices in TND (Tunisian Dinar).
>
> **Last updated:** 2026-04-01 — enforcement live, all Phase 1–3 complete, payment/billing plan added (Section 16).

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
16. [**Payment Method Save & Auto-Checkout — Full Plan**](#16-payment-billing)

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
| Plan schema + seed script | ✅ **DONE** | Seeded — Starter/Growth/Pro in DB |
| Subscription schema | ✅ **DONE** | `subscription.schema.ts` |
| StorageUsage tracking | ✅ **DONE** | `upload.service.ts` increments on every upload |
| PolicyService limits checks | ✅ **DONE** | members, courses, storage, admins |
| PolicyService feature checks | ✅ **DONE** | `canUseFeature()` |
| PlanFeatureGuard | ✅ **DONE** | `@RequireFeature('challenges')` attached to routes |
| `GET /subscriptions/storage` | ✅ **DONE** | Implemented in `subscription.controller.ts` + service |
| `POST /subscriptions/reactivate` | ✅ **DONE** | Implemented |
| `FREE_MODE` → migrate to `PLAN_ENFORCEMENT_MODE` | ✅ **DONE** | `event.service.ts`, `wallet.service.ts`, `wallet.controller.ts`, `product.service.ts` all migrated |
| Apply `@RequireFeature` to challenge routes | ✅ **DONE** | Already existed on `challenge.controller.ts` |
| Apply `@RequireFeature` to session routes | ✅ **DONE** | Already existed on `session.controller.ts` |
| Apply `@RequireFeature` to event routes | ✅ **DONE** | Already existed on `event.controller.ts` |
| Analytics lookback enforcement | ✅ **DONE** | `analytics.service.ts` checks `PLAN_ENFORCEMENT_MODE` |
| Email campaign quota enforcement | ✅ **DONE** | `email-campaign.service.ts` |
| `PLAN_ENFORCEMENT_MODE=true` in `.env` | ✅ **DONE** | Set + Docker rebuilt |
| All creators backfilled with 14-day trial | ✅ **DONE** | 11 creators → trial until Apr 15, 2026 |

### Frontend ✅ / ⚠️ Status

| Item | Status | Notes |
|---|---|---|
| `plan-config.ts` — canonical plan data | ✅ **DONE** | Single source of truth |
| `use-plan` hook | ✅ **DONE** | `hooks/use-plan.ts` |
| `FeatureGate` component | ✅ **DONE** | `components/plan/feature-gate.tsx` |
| `UsageIndicator` / `UsageSummary` | ✅ **DONE** | `components/plan/usage-indicator.tsx` |
| `UpgradeModal` / `LockedFeatureCard` | ✅ **DONE** | `components/plan/upgrade-modal.tsx` |
| `/creator/plan` — My Plan page | ✅ **DONE** | Built + live |
| `/creator/plan/storage` — Storage inspector | ✅ **DONE** | Built + live |
| `/creator/plan/invoices` — Billing history | ✅ **DONE** | Built + live (bug fixed Apr 1) |
| `/creator/plan/upgrade` — Upgrade flow | ✅ **DONE** | Built + live |
| Trial countdown banner `<TrialBanner />` | ✅ **DONE** | Wired into `dashboard-layout.tsx` |
| Gates on challenges/sessions/events pages | ✅ **DONE** | `FeatureGate` applied to all 3 pages |
| "Plan & Billing" in creator sidebar | ✅ **DONE** | Crown icon + nav item added |
| `NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE=true` | ✅ **DONE** | In `.env` + Docker build arg |
| Settings page — Subscription tab | ⚠️ **Pending** | Section 9 — not yet built |
| `<UsageSummary />` on team/courses/communities pages | ⚠️ **Pending** | Section 10 — widgets not placed yet |
| Member limit check on community join/invite | ⚠️ **Pending** | Section 11 — limit gate not added |
| Payment method save & auto-checkout | ⚠️ **Pending** | **See Section 16 — full plan below** |

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

### Phase 1 — Backend Additions ✅ COMPLETE

1. ✅ Add `GET /subscriptions/storage` endpoint
2. ✅ Add `POST /subscriptions/reactivate` endpoint
3. ✅ `@RequireFeature('challenges')` on `ChallengeController` (already existed)
4. ✅ `@RequireFeature('sessions')` on `SessionController` (already existed)
5. ✅ `@RequireFeature('events')` on `EventController` (already existed)
6. ✅ Migrate `FREE_MODE` → `PLAN_ENFORCEMENT_MODE` in event/wallet/product services
7. ✅ Run seed script — Starter/Growth/Pro seeded in MongoDB

### Phase 2 — Frontend Core Pages ✅ COMPLETE

8. ✅ `/creator/plan/layout.tsx` with tab navigation
9. ✅ `/creator/plan/page.tsx` — My Plan page (status card, usage gauges, features, comparison, cancel)
10. ✅ `/creator/plan/storage/page.tsx` — Storage inspector
11. ✅ `/creator/plan/invoices/page.tsx` — Billing history (bug fixed Apr 1 2026)
12. ✅ `/creator/plan/upgrade/page.tsx` — Upgrade flow
13. ✅ `components/plan/trial-banner.tsx` — Trial countdown banner
14. ✅ `<TrialBanner />` wired into `dashboard-layout.tsx`

### Phase 3 — Feature Gates ✅ COMPLETE

15. ✅ `<FeatureGate feature="challenges">` on challenges page
16. ✅ `<FeatureGate feature="sessions">` on sessions page
17. ✅ `<FeatureGate feature="events">` on events page
18. ⚠️ `<UsageSummary />` on team page (admin seats) — **pending**
19. ⚠️ `<UsageSummary />` on courses page (active courses) — **pending**
20. ⚠️ Member limit check on community join / invite — **pending**

### Phase 4 — Settings Integration ⚠️ PENDING

21. ⚠️ Add "Subscription" tab to `/creator/settings/page.tsx`
22. ✅ Plan & Billing in creator sidebar (Crown icon + nav item)

### Phase 5 — Go Live ✅ COMPLETE

23. ✅ `PLAN_ENFORCEMENT_MODE=true` in backend `.env`
24. ✅ `NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE=true` in frontend `.env` + Docker
25. ✅ All 11 existing creators backfilled with 14-day trial (until Apr 15, 2026)
26. ⚠️ Monitor `ForbiddenException` errors in logs

### Phase 6 — Payment Method Save & Auto-Checkout ⚠️ PENDING

See **Section 16** for the full plan.

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

---

## 16. Payment Method Save & Auto-Checkout — Full Plan

> **Context:** Chabaqa uses **Konnect** as the primary payment gateway for Tunisian creators (TND) and **Stripe** for international. Neither provider currently saves tokenized card data for recurring charges. This section defines how to build saved-card auto-billing on top of what we have.

---

### 16.1 — The Problem: What "Saved Card" Means Here

Konnect and Stripe work differently:

| Provider | How It Works | Card Saving |
|---|---|---|
| **Konnect** | One-time redirect checkout per payment | No native recurring billing. Cards can be saved via Konnect's tokenization API (separate call). |
| **Stripe** | Customer + PaymentMethod objects. SetupIntent tokenizes a card without charging. Then charge later via PaymentIntent with `customer` + `payment_method`. | ✅ Full recurring support via Stripe Subscriptions or PaymentIntents |

**Recommendation:** Use **Stripe** for platform subscriptions (recurring TND-equivalent billing). Konnect is great for one-off purchases but is not designed for recurring SaaS billing. If Konnect must be used, use their "wallet topup + debit" flow.

---

### 16.2 — Database: What to Add

#### A) `payment_methods` collection (new)

Create a dedicated collection for saved payment methods (not storing card numbers — only tokenized provider references).

```
{
  _id: ObjectId
  creatorId: ObjectId       ← links to user
  provider: "stripe"        ← payment provider
  providerCustomerId: string ← Stripe: cus_xxx
  providerPaymentMethodId: string ← Stripe: pm_xxx
  brand: "visa"|"mastercard"|"amex"|...
  last4: "4242"
  expMonth: 12
  expYear: 2028
  isDefault: boolean        ← the card used for auto-billing
  createdAt: Date
  updatedAt: Date
}
```

NestJS Schema file: `src/schema/payment-method.schema.ts`

#### B) Update `subscriptions` collection

Add these fields to the existing Subscription schema:

```
{
  defaultPaymentMethodId: ObjectId  ← ref to payment_methods._id
  billingCycle: "monthly" | "yearly"
  nextBillingAt: Date               ← already exists, ensure it's set
  lastChargedAt: Date
  lastChargeStatus: "success" | "failed" | "pending"
  lastChargeAmount: number
  retryCount: number                ← how many times we've retried a failed charge
  retryNextAt: Date                 ← when to retry next
}
```

---

### 16.3 — Backend: New Endpoints to Build

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/payment-methods/setup-intent` | Create a Stripe SetupIntent to tokenize a card without charging |
| `POST` | `/payment-methods/confirm` | After SetupIntent completes, save the PM to DB and attach to Stripe customer |
| `GET` | `/payment-methods` | List all saved payment methods for the creator |
| `DELETE` | `/payment-methods/:id` | Remove a saved payment method |
| `PATCH` | `/payment-methods/:id/set-default` | Mark a PM as default for auto-billing |
| `POST` | `/subscriptions/charge-now` | Manually trigger a charge using the default PM (admin use) |
| `POST` | `/subscriptions/billing/retry` | Retry a failed charge (called by cron or admin) |

#### `POST /payment-methods/setup-intent` — Spec

```typescript
// Creates a Stripe SetupIntent so the frontend can collect card details
// without immediately charging. The card is tokenized and stored at Stripe.

async createSetupIntent(creatorId: string) {
  // 1. Get or create Stripe Customer
  let customer = await this.stripe.customers.retrieve(sub.providerCustomerId);
  if (!customer) {
    customer = await this.stripe.customers.create({
      email: creator.email,
      name: `${creator.firstName} ${creator.lastName}`,
      metadata: { creatorId: creatorId.toString() }
    });
    // Save providerCustomerId to subscription
  }

  // 2. Create SetupIntent
  const setupIntent = await this.stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ['card'],
    usage: 'off_session',  // allows future charges without user present
  });

  return {
    clientSecret: setupIntent.client_secret,  // sent to frontend
    customerId: customer.id,
  };
}
```

#### `POST /payment-methods/confirm` — Spec

```typescript
// After frontend completes SetupIntent with Stripe.js, call this to save
async confirmPaymentMethod(creatorId: string, setupIntentId: string) {
  // 1. Retrieve the completed SetupIntent from Stripe
  const si = await this.stripe.setupIntents.retrieve(setupIntentId);
  if (si.status !== 'succeeded') throw new BadRequestException('Setup not complete');

  // 2. Retrieve the attached PaymentMethod
  const pm = await this.stripe.paymentMethods.retrieve(si.payment_method as string);

  // 3. Save to payment_methods collection
  const saved = await this.pmModel.create({
    creatorId,
    provider: 'stripe',
    providerCustomerId: si.customer,
    providerPaymentMethodId: pm.id,
    brand: pm.card.brand,
    last4: pm.card.last4,
    expMonth: pm.card.exp_month,
    expYear: pm.card.exp_year,
    isDefault: true,  // first card is always default
  });

  // 4. Update subscription.hasPaymentMethod = true, paymentBrand, paymentLast4
  await this.subModel.updateOne({ creatorId }, {
    hasPaymentMethod: true,
    defaultPaymentMethodId: saved._id,
    provider: 'stripe',
    providerCustomerId: si.customer as string,
    paymentBrand: pm.card.brand,
    paymentLast4: pm.card.last4,
  });

  return { success: true, card: { brand: pm.card.brand, last4: pm.card.last4 } };
}
```

---

### 16.4 — Auto-Checkout Flow: How Recurring Billing Works

#### Scenario A — Stripe Recurring (Recommended)

Use Stripe Subscriptions — Stripe handles billing dates, retries, and webhooks automatically.

```
Creator selects plan on /creator/plan/upgrade
        ↓
If no payment method on file:
  → Redirect to /creator/plan/billing/add-card
  → Frontend: Stripe.js mounts CardElement
  → User enters card → Stripe.js confirms SetupIntent
  → POST /payment-methods/confirm { setupIntentId }
  → Card saved to DB + attached to Stripe Customer
        ↓
If payment method exists (or just saved):
  → POST /payment/stripe-link/init/subscription { tier, billing: 'monthly' }
  → Backend creates Stripe Subscription:
      stripe.subscriptions.create({
        customer: sub.providerCustomerId,
        items: [{ price: STRIPE_PRICE_ID[tier][billing] }],
        default_payment_method: pm.providerPaymentMethodId,
      })
  → Stripe charges the card immediately
  → Stripe sends webhook: customer.subscription.created + invoice.paid
        ↓
Backend webhook handler (already exists at POST /payment/stripe-link/webhook):
  → customer.subscription.updated → update subscription status in DB
  → invoice.paid → update lastChargedAt, status = 'active'
  → invoice.payment_failed → status = 'past_due', retryCount++
        ↓
Creator sees "Active" status on /creator/plan
```

#### Scenario B — Manual Charge with Saved Card (Konnect or Stripe)

If not using Stripe Subscriptions, manually charge on billing date via a scheduled job:

```
Every day at 02:00 UTC — Cron job: BillingService.runDailyBilling()
        ↓
Query subscriptions where:
  - status = 'active' OR 'trialing'
  - nextBillingAt <= now
  - hasPaymentMethod = true
  - cancelAtPeriodEnd = false
        ↓
For each subscription:
  1. Get defaultPaymentMethodId
  2. Create Stripe PaymentIntent:
       stripe.paymentIntents.create({
         amount: sub.amount * 100,  // in cents
         currency: 'eur',           // or tnd if Stripe supports it
         customer: sub.providerCustomerId,
         payment_method: pm.providerPaymentMethodId,
         confirm: true,
         off_session: true,         // charge without user present
       })
  3. On success:
       sub.status = 'active'
       sub.lastChargedAt = now
       sub.currentPeriodStart = now
       sub.currentPeriodEnd = now + 30 days
       sub.nextBillingAt = now + 30 days
       sub.retryCount = 0
  4. On failure (card declined, insufficient funds):
       sub.status = 'past_due'
       sub.lastChargeStatus = 'failed'
       sub.retryCount++
       sub.retryNextAt = now + RETRY_SCHEDULE[retryCount]
       → Send email: "Payment failed — please update your card"
```

#### Retry Schedule for Failed Charges

```
retryCount = 1 → retry after 3 days
retryCount = 2 → retry after 5 days
retryCount = 3 → retry after 7 days
retryCount = 4 → cancel subscription (access removed)
```

---

### 16.5 — Pages to Build

#### Page A: `/creator/plan/billing/add-card` ⚠️ NEW

The main place a creator saves their card. Shown:
- When clicking "Add Payment Method" in trial banner
- When trial expires and no card is saved
- When upgrading from within upgrade page with no card on file
- From settings page → "Update Payment Method" button

```
Add Payment Method
─────────────────────────────────────────────────────
  ┌─────────────────────────────────────────────┐
  │  Card Number    [____ ____ ____ ____]        │
  │  Expiry         [MM/YY]  CVC  [___]          │
  │  Name on Card   [_________________________]  │
  └─────────────────────────────────────────────┘

  🔒  Your card is secured by Stripe. Chabaqa never
      stores your full card number.

  [Save Card]    [Cancel]
```

**Implementation:**
- Uses Stripe.js `<CardElement>` or `<PaymentElement>` (hosted by Stripe, PCI-compliant)
- Frontend calls `POST /payment-methods/setup-intent` to get `clientSecret`
- Stripe.js confirms the SetupIntent: `stripe.confirmCardSetup(clientSecret, { payment_method: { card: cardElement } })`
- On success: `POST /payment-methods/confirm { setupIntentId }`
- Redirect to `/creator/plan` or wherever the creator came from

#### Page B: `/creator/plan/billing/manage` ⚠️ NEW

List of all saved payment methods. Accessible from:
- "Manage Billing" button on `/creator/plan`
- Settings page → Subscription tab

```
Payment Methods
─────────────────────────────────────────────────────
  ┌─────────────────────────────────────────────────┐
  │  💳  VISA •••• 4242    Expires 12/28  [DEFAULT] │
  │      [Set as Default] [Remove]                  │
  ├─────────────────────────────────────────────────┤
  │  💳  Mastercard •••• 1234  Expires 06/27        │
  │      [Set as Default] [Remove]                  │
  └─────────────────────────────────────────────────┘

  [+ Add New Card]
```

**Backend calls:**
- `GET /payment-methods` → list saved cards
- `PATCH /payment-methods/:id/set-default` → set default
- `DELETE /payment-methods/:id` → remove card

#### Page C: `/creator/plan/billing/upgrade-confirm` (flow inside upgrade page)

Shown as a step inside `/creator/plan/upgrade` when confirming an upgrade.

```
Step 2 of 2 — Confirm & Pay
─────────────────────────────────────────
Plan:     Growth
Billing:  Monthly (99 TND / month)
Card:     VISA •••• 4242

  ⚡ You'll be charged 99 TND now.
     Next charge: May 1, 2026.

  [Confirm & Pay 99 TND]    [Back]
```

If `cancelAtPeriodEnd` is set on current plan:
```
  ⚠️ Note: Upgrading will reactivate your subscription.
```

---

### 16.6 — Trial Expiry → Card Gate Flow

When a creator's trial ends and they have no payment method:

```
Trial ends (trialEndsAt < now AND hasPaymentMethod = false)
        ↓
Backend cron at 02:00 UTC:
  → Set status = 'incomplete' (NOT canceled — data preserved)
  → Send email: "Your trial has ended — add a card to keep access"
        ↓
Creator visits any creator page
        ↓
Frontend middleware: status = 'incomplete' AND no payment method
  → Show full-page overlay (not just a banner):

  ┌────────────────────────────────────────┐
  │         Your Trial Has Ended           │
  │                                        │
  │  Add a payment method to continue      │
  │  using Chabaqa.                        │
  │                                        │
  │  [Add Payment Method]                  │
  │  [Choose a Plan First →]               │
  └────────────────────────────────────────┘
        ↓
Creator adds card → charged immediately → status = 'active'
```

**Frontend component:** `<SubscriptionPaywall />` — full-screen overlay rendered in creator layout when `status === 'incomplete'` or `(status === 'trialing' && trialEndsAt < now)`.

---

### 16.7 — TrialBanner Updates

The existing `<TrialBanner />` needs to link to add-card page:

```
Current:  ⏰ Your trial ends in 3 days.  [Add Payment Method]  [Dismiss]
Updated:  ⏰ Your trial ends in 3 days.  [Add Payment Method →/creator/plan/billing/add-card]
```

When `hasPaymentMethod = true` but trial still running:
```
✅ Your trial ends in 3 days. You're all set — your card will be charged on [date].  [Dismiss]
```

---

### 16.8 — Backend Services to Create

#### `BillingService` (new file: `src/billing/billing.service.ts`)

Handles all recurring charge logic.

```typescript
@Injectable()
export class BillingService {
  // Called by cron every day at 02:00 UTC
  async runDailyBilling(): Promise<void>

  // Charge a single subscription
  async chargeSubscription(subscriptionId: string): Promise<ChargeResult>

  // Retry failed charges based on retryNextAt
  async retryFailedCharges(): Promise<void>

  // Handle trial expiry — set status = 'incomplete'
  async processExpiredTrials(): Promise<void>

  // Send dunning emails (payment failed reminders)
  async sendDunningEmail(creatorId: string, retryCount: number): Promise<void>
}
```

#### `PaymentMethodService` (new file: `src/payment-methods/payment-method.service.ts`)

```typescript
@Injectable()
export class PaymentMethodService {
  async createSetupIntent(creatorId: string): Promise<{ clientSecret: string }>
  async confirmPaymentMethod(creatorId: string, setupIntentId: string): Promise<SavedCard>
  async listPaymentMethods(creatorId: string): Promise<SavedCard[]>
  async setDefault(creatorId: string, pmId: string): Promise<void>
  async remove(creatorId: string, pmId: string): Promise<void>
}
```

---

### 16.9 — Stripe Price IDs (Configuration)

Create Stripe Products + Prices in the Stripe dashboard, then add to `.env`:

```env
# backend/.env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (monthly)
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_GROWTH_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...

# Stripe Price IDs (yearly)
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_GROWTH_YEARLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
```

---

### 16.10 — Implementation TODO Order (Phase 6)

| # | Task | File | Priority |
|---|---|---|---|
| 1 | Create `payment-method.schema.ts` | `src/schema/` | 🔴 Critical |
| 2 | Create `PaymentMethodService` with SetupIntent + confirm | `src/payment-methods/` | 🔴 Critical |
| 3 | Create `PaymentMethodController` with 5 endpoints | `src/payment-methods/` | 🔴 Critical |
| 4 | Create Stripe Products + Prices in Stripe dashboard | Stripe dashboard | 🔴 Critical |
| 5 | Add `STRIPE_PRICE_*` env vars to `.env` + Docker | `backend/.env`, `docker-compose.yml` | 🔴 Critical |
| 6 | Build `/creator/plan/billing/add-card` page | Frontend | 🔴 Critical |
| 7 | Update upgrade page step 2 to charge via Stripe Subscription | `plan/upgrade/page.tsx` | 🔴 Critical |
| 8 | Create `BillingService` with cron + charge logic | `src/billing/` | 🟡 High |
| 9 | Build `/creator/plan/billing/manage` page | Frontend | 🟡 High |
| 10 | Create `<SubscriptionPaywall />` component | `components/plan/` | 🟡 High |
| 11 | Wire paywall into creator layout (check status) | `dashboard-layout.tsx` | 🟡 High |
| 12 | Update `<TrialBanner />` to link to add-card + show "card saved" state | `components/plan/trial-banner.tsx` | 🟡 High |
| 13 | Add retry logic + dunning email on `invoice.payment_failed` webhook | `payment.controller.ts` | 🟡 High |
| 14 | Backend cron to process expired trials → `status = incomplete` | `billing.service.ts` | 🟡 High |
| 15 | Add "Payment Methods" section to settings page | `creator/settings/page.tsx` | 🟢 Normal |
| 16 | Test full end-to-end: signup → trial → add card → upgrade → auto-charge | Testing | 🟢 Normal |

---

### 16.11 — Security Checklist for Payment

| Item | Requirement |
|---|---|
| Card numbers never touch our server | ✅ Stripe.js tokenizes client-side |
| Webhook signature verification | ✅ Already implemented (`stripe-signature` header) |
| SetupIntent `usage: 'off_session'` | Required for charging without user present |
| Stripe Customer ID stored per creator | One customer per creator in Stripe |
| PCI compliance | Stripe handles it — use hosted elements, never log card data |
| Remove card validates ownership | `PaymentMethodService.remove()` must verify `creatorId` matches |
| HTTPS only | All payment pages must be served over HTTPS |
| Idempotency keys on charge calls | Prevent double charges on network retry |
