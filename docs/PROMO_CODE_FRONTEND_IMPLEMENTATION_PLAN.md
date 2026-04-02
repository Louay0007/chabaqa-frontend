# Promo Code Management - Frontend Implementation Plan

## 📋 Executive Summary

This document provides a comprehensive, backend-verified plan for implementing the Promo Code Management UI in the Creator Dashboard. Every API endpoint, DTO field, validation rule, and response shape has been verified against the actual backend source code.

**Sources of truth:**
- Backend controller: `backend/src/promo-code/promo-code.controller.ts`
- Backend service: `backend/src/promo-code/promo-code.service.ts`
- Backend DTOs: `backend/src/promo-code/dto/`
- Backend schema: `backend/src/schema/promo-code.schema.ts`
- Frontend API client pattern: `frontend/lib/api/client.ts` + `frontend/lib/api/index.ts`
- Frontend page pattern: `frontend/app/(creator)/creator/monetization/payouts/page.tsx`

---

## 🎯 Objectives

1. **Creator Promo Code Management**: Allow creators to create, view, edit, and delete promo codes for their content
2. **Usage Analytics**: Display promo code performance metrics and usage statistics
3. **User Tracking**: Show which users have used specific promo codes
4. **Content Integration**: Support all `TrackableContentType` values from the backend enum
5. **Consistent UX**: Follow the exact patterns used in existing creator dashboard pages (payouts, products, analytics)

---

## 🏗️ Architecture Overview

### Technology Stack (Matching Existing Codebase)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS + Shadcn UI components (Radix)
- **State Management**: `useState` + `useEffect` (matching existing creator pages — NOT React Query hooks)
- **Forms**: React Hook Form + Zod validation (available but existing pages mostly use `useState`)
- **API Client**: Singleton `apiClient` from `lib/api/client.ts` — uses native `fetch`, auto-attaches Bearer token
- **Toasts**: `useToast()` from `@/hooks/use-toast`
- **Guard**: `useCommunityGuard()` from `@/hooks/use-community-guard`
- **Layout**: `PageShell` from `@/components/creator-dashboard`

### File Structure
```
frontend/
├── lib/api/
│   └── promo-codes.api.ts              # API client (register in index.ts)
├── app/(creator)/creator/
│   └── monetization/
│       └── promo-codes/
│           ├── page.tsx                  # Main promo codes page
│           └── components/
│               ├── promo-codes-header.tsx
│               ├── promo-codes-stats.tsx
│               ├── promo-codes-table.tsx
│               ├── promo-code-form-dialog.tsx
│               ├── promo-code-stats-dialog.tsx
│               └── promo-code-usage-dialog.tsx
```

---

## 📊 Backend API Reference (Verified from Source Code)

### Creator Endpoints (`/promo-codes`) — All require `JwtAuthGuard`

| Method | Route | Purpose | Request Body | Response |
|--------|-------|---------|--------------|----------|
| `POST` | `/promo-codes` | Create promo code | `CreatePromoCodeDto` | `PromoCodeResponseDto` (201) |
| `GET` | `/promo-codes/my-codes` | Get current user's codes | — | `PromoCodeResponseDto[]` |
| `GET` | `/promo-codes/code/:code` | Get by code string | — | `PromoCodeResponseDto` |
| `GET` | `/promo-codes/:id` | Get by MongoDB ID | — | `PromoCodeResponseDto` |
| `PUT` | `/promo-codes/code/:code` | Update promo code | `UpdatePromoCodeDto` | `PromoCodeResponseDto` |
| `DELETE` | `/promo-codes/code/:code` | Delete promo code | — | `{ message: string }` (200) |
| `GET` | `/promo-codes/code/:code/stats` | Get usage statistics | — | `PromoCodeStatsDto` |
| `GET` | `/promo-codes/code/:code/usage` | Get usage list (paginated) | Query: `page`, `limit` | `{ data: PromoCodeUsageDto[], total, page, limit, totalPages }` |

> **IMPORTANT**: The creator listing endpoint is `GET /promo-codes/my-codes` (NOT `GET /promo-codes`).
> It returns a flat array `PromoCodeResponseDto[]` (NOT paginated), filtered by `creatorId` from JWT.
> The admin `GET /admin/promo-codes` endpoint has pagination and filtering — the creator one does not.

### Backend Validation Rules (from DTOs)

**CreatePromoCodeDto** — all fields verified from `create-promo-code.dto.ts`:
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `code` | `string` | ✅ Yes | `@MinLength(3) @MaxLength(50)` | Auto-uppercased & trimmed by service |
| `percentOff` | `number` | Optional | `@Min(0) @Max(100)` | 0–100 range |
| `amountOffDT` | `number` | Optional | `@Min(0)` | No max limit |
| `appliesToType` | `TrackableContentType` | Optional | `@IsEnum(TrackableContentType)` | See enum below |
| `appliesToId` | `string` | Optional | `@IsString()` | MongoDB ObjectId |
| `creatorId` | `string` | Optional | `@IsString()` | Admin use only; auto-set from JWT for creators |
| `communityId` | `string` | Optional | `@IsString()` | Community association |
| `startsAt` | `string` | Optional | `@IsDateString()` | ISO 8601 format |
| `endsAt` | `string` | Optional | `@IsDateString()` | ISO 8601 format |
| `maxRedemptions` | `number` | Optional | `@Min(1)` | null = unlimited |
| `isActive` | `boolean` | Optional | `@IsBoolean()` | Defaults to `true` |
| `allowedEmails` | `string[]` | Optional | `@IsArray() @IsString({each:true})` | Empty = no restriction |

**UpdatePromoCodeDto** — same fields as Create EXCEPT:
- `code` field is **NOT included** (code string cannot be changed)
- `creatorId` field is **NOT included**
- `communityId` field is **NOT included**
- All fields are optional (partial update)

**Service-level validation** (beyond DTO decorators):
1. At least one of `percentOff` or `amountOffDT` must be provided (else 400)
2. Code uniqueness check (else 409 ConflictException)
3. `startsAt` must be before `endsAt` if both provided (else 400)
4. Both `percentOff` AND `amountOffDT` **can coexist** — they are **additive** in discount calculation

### TrackableContentType Enum (Complete — from `content-tracking.schema.ts`)
```typescript
enum TrackableContentType {
  COURSE = 'course',
  CHAPTER = 'chapter',
  CHALLENGE = 'challenge',
  SESSION = 'session',
  POST = 'post',
  EVENT = 'event',
  PRODUCT = 'product',
  RESOURCE = 'resource',
  COMMUNITY = 'community',
  SUBSCRIPTION = 'subscription'
}
```

### Response DTOs (Verified from `promo-code-response.dto.ts`)

```typescript
interface PromoCodeResponseDto {
  id: string;              // MongoDB _id.toString()
  code: string;            // Uppercase code
  percentOff?: number;     // undefined if not set (service uses `|| undefined`)
  amountOffDT?: number;    // undefined if not set
  appliesToType?: string;  // TrackableContentType value or undefined
  appliesToId?: string;    // ObjectId string or undefined
  creatorId?: string;      // ObjectId string or undefined
  communityId?: string;    // string or undefined
  startsAt?: Date;         // Date or undefined (JSON serialized as ISO string)
  endsAt?: Date;           // Date or undefined
  maxRedemptions?: number; // number or undefined (null → undefined via `|| undefined`)
  redemptionsCount: number;// Always present, defaults to 0
  isActive: boolean;       // Always present
  allowedEmails?: string[];// Array or empty array (service defaults `|| []`)
  createdAt: Date;         // Auto-managed by Mongoose timestamps
  updatedAt: Date;         // Auto-managed by Mongoose timestamps
}

interface PromoCodeStatsDto {
  code: string;
  totalUses: number;        // Count of paid orders using this code
  totalRevenue: number;     // Sum of order.amountDT (what customers paid AFTER discount)
  totalDiscounts: number;   // Sum of order.discountDT
  averageDiscount: number;  // totalDiscounts / totalUses (0 if no uses)
  maxRedemptions?: number;  // undefined if unlimited
  remainingUses?: number;   // maxRedemptions - redemptionsCount (undefined if unlimited)
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
}

interface PromoCodeUsageDto {
  orderId: string;
  buyerId: string;
  buyerEmail: string;       // From populated User document, fallback 'N/A'
  buyerName: string;        // From populated User document, fallback 'N/A'
  originalAmount: number;   // amountDT + discountDT (reconstructed)
  discountAmount: number;   // order.discountDT
  finalAmount: number;      // order.amountDT (what customer actually paid)
  contentType: string;      // order.contentType
  contentId: string;        // order.contentId
  contentTitle?: string;    // Always undefined in current backend (placeholder)
  usedAt: Date;             // order.createdAt
  orderStatus: string;      // order.status
}
```

### Error Response Format (NestJS Standard)
```typescript
// 400 Bad Request
{ statusCode: 400, message: "At least one discount type...", error: "Bad Request" }

// 404 Not Found
{ statusCode: 404, message: "Promo code \"CODE\" not found", error: "Not Found" }

// 409 Conflict
{ statusCode: 409, message: "Promo code \"CODE\" already exists", error: "Conflict" }
```

### Discount Calculation Model (from `promo.service.ts`)
```
discountDT = (amountDT × percentOff / 100) + amountOffDT
finalAmountDT = max(0, amountDT - discountDT)
```
Both discount types are **additive** — a code can have both `percentOff` AND `amountOffDT`.
Fees are calculated on the **discounted** amount, not the original.

---

## 🎨 UI/UX Design Specifications

### Design Principles
1. **Consistency**: Match existing creator dashboard pages (payouts, products, analytics)
2. **Clarity**: Clear visual hierarchy and status indicators
3. **Efficiency**: Quick actions and bulk operations
4. **Feedback**: Real-time validation and success/error messages
5. **Accessibility**: WCAG 2.1 AA compliant components

### Color Scheme (Chabaqa Brand)
- **Primary**: `#8e78fb` (Purple) - Action buttons, active states
- **Success**: Green - Active promo codes, successful operations
- **Warning**: Yellow/Orange - Expiring soon, usage warnings
- **Error**: Red - Inactive, expired, errors
- **Neutral**: Gray - Disabled, secondary info

### Page Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header: "Promo Codes" + Description                        │
│ Actions: [Refresh] [+ Create Promo Code]                   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Stats Cards (4 columns)                                     │
│ [Total Codes] [Active Codes] [Total Uses] [Total Discounts]│
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Filters & Search                                            │
│ Tabs: [All] [Active] [Expired] [Scheduled]                 │
│ Search: [🔍 Search by code...]                              │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Promo Codes Table                                           │
│ Columns: Code | Discount | Applies To | Uses | Status | ... │
│ Actions: Copy Code | View Stats | View Usage | Edit |Delete│
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Detailed Implementation Steps

### STEP 1: API Client Implementation

**File**: `frontend/lib/api/promo-codes.api.ts`

**Purpose**: Create typed API client matching the exact backend endpoints and existing `apiClient` patterns.

**Key Corrections from original plan:**
- Import `apiClient` from `./client` (not `@/lib/api-client`)
- Use `GET /promo-codes/my-codes` for listing (NOT `GET /promo-codes`)
- `my-codes` returns `PromoCodeResponseDto[]` (flat array, NOT paginated)
- `UpdatePromoCodeDto` is a separate type (no `code`, `creatorId`, `communityId`)
- Dates are ISO 8601 strings, not Date objects
- `appliesToType` uses full `TrackableContentType` enum (10 values, not 6)

```typescript
import { apiClient } from './client';

// === TrackableContentType (matches backend enum exactly) ===
export type TrackableContentType =
  | 'course'
  | 'chapter'
  | 'challenge'
  | 'session'
  | 'post'
  | 'event'
  | 'product'
  | 'resource'
  | 'community'
  | 'subscription';

// === DTOs matching backend exactly ===

export interface CreatePromoCodeDto {
  code: string;                            // 3-50 chars, auto-uppercased by backend
  percentOff?: number;                     // 0-100 (can coexist with amountOffDT)
  amountOffDT?: number;                    // >= 0 (can coexist with percentOff)
  appliesToType?: TrackableContentType;
  appliesToId?: string;
  creatorId?: string;                      // Admin use only
  communityId?: string;
  startsAt?: string;                       // ISO 8601 date string
  endsAt?: string;                         // ISO 8601 date string
  maxRedemptions?: number;                 // >= 1
  isActive?: boolean;                      // Default: true
  allowedEmails?: string[];
}

// UpdatePromoCodeDto intentionally excludes code, creatorId, communityId
export interface UpdatePromoCodeDto {
  percentOff?: number;
  amountOffDT?: number;
  appliesToType?: TrackableContentType;
  appliesToId?: string;
  startsAt?: string;
  endsAt?: string;
  maxRedemptions?: number;
  isActive?: boolean;
  allowedEmails?: string[];
}

export interface PromoCodeResponseDto {
  id: string;
  code: string;
  percentOff?: number;
  amountOffDT?: number;
  appliesToType?: string;
  appliesToId?: string;
  creatorId?: string;
  communityId?: string;
  startsAt?: string;
  endsAt?: string;
  maxRedemptions?: number;
  redemptionsCount: number;
  isActive: boolean;
  allowedEmails?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PromoCodeStatsDto {
  code: string;
  totalUses: number;
  totalRevenue: number;
  totalDiscounts: number;
  averageDiscount: number;
  maxRedemptions?: number;
  remainingUses?: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface PromoCodeUsageDto {
  orderId: string;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  contentType: string;
  contentId: string;
  contentTitle?: string;
  usedAt: string;
  orderStatus: string;
}

// === API Client ===

export const promoCodesApi = {
  // Get current creator's promo codes (flat array, NOT paginated)
  getMyCodes: async (): Promise<PromoCodeResponseDto[]> => {
    return apiClient.get<PromoCodeResponseDto[]>('/promo-codes/my-codes');
  },

  // Create new promo code
  create: async (data: CreatePromoCodeDto): Promise<PromoCodeResponseDto> => {
    return apiClient.post<PromoCodeResponseDto>('/promo-codes', data);
  },

  // Get promo code by code string
  getByCode: async (code: string): Promise<PromoCodeResponseDto> => {
    return apiClient.get<PromoCodeResponseDto>(`/promo-codes/code/${encodeURIComponent(code)}`);
  },

  // Get promo code by MongoDB ID
  getById: async (id: string): Promise<PromoCodeResponseDto> => {
    return apiClient.get<PromoCodeResponseDto>(`/promo-codes/${id}`);
  },

  // Update promo code (partial update — code string cannot be changed)
  update: async (code: string, data: UpdatePromoCodeDto): Promise<PromoCodeResponseDto> => {
    return apiClient.put<PromoCodeResponseDto>(
      `/promo-codes/code/${encodeURIComponent(code)}`,
      data
    );
  },

  // Delete promo code
  delete: async (code: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(
      `/promo-codes/code/${encodeURIComponent(code)}`
    );
  },

  // Get usage statistics for a promo code
  getStats: async (code: string): Promise<PromoCodeStatsDto> => {
    return apiClient.get<PromoCodeStatsDto>(
      `/promo-codes/code/${encodeURIComponent(code)}/stats`
    );
  },

  // Get paginated list of users who used a promo code
  getUsage: async (
    code: string,
    params?: { page?: number; limit?: number }
  ): Promise<{
    data: PromoCodeUsageDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    return apiClient.get(
      `/promo-codes/code/${encodeURIComponent(code)}/usage`,
      params
    );
  },
};
```

**Then register in `lib/api/index.ts`:**
```typescript
// Add to imports
import { promoCodesApi } from './promo-codes.api';

// Add to barrel export
export * from './promo-codes.api';

// Add to api object
export const api = {
  // ... existing entries ...
  promoCodes: promoCodesApi,
};
```

---

### STEP 2: Main Page Component

**File**: `frontend/app/(creator)/creator/monetization/promo-codes/page.tsx`

**Key corrections from original plan:**
- Use `api.promoCodes.getMyCodes()` (not `getAll` with communityId filter)
- The backend returns all creator codes — client-side filter by `communityId` if needed
- Follow the exact `useState`/`useEffect` pattern from payouts page (no React Query)
- Import from `@/lib/api` (barrel), not direct file import
- Use `.catch(() => null as any)` defensive pattern from existing pages

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useCommunityGuard } from '@/hooks/use-community-guard'
import { PageShell } from '@/components/creator-dashboard'
import { api, PromoCodeResponseDto } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

import { PromoCodesHeader } from './components/promo-codes-header'
import { PromoCodesStats } from './components/promo-codes-stats'
import { PromoCodesTable } from './components/promo-codes-table'
import { PromoCodeFormDialog } from './components/promo-code-form-dialog'
import { PromoCodeStatsDialog } from './components/promo-code-stats-dialog'
import { PromoCodeUsageDialog } from './components/promo-code-usage-dialog'

export default function PromoCodesPage() {
  const { guard, selectedCommunityId, isLoading: communityLoading } = useCommunityGuard()
  const { toast } = useToast()

  const [promoCodes, setPromoCodes] = useState<PromoCodeResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCode, setEditingCode] = useState<PromoCodeResponseDto | null>(null)
  const [statsCode, setStatsCode] = useState<string | null>(null)
  const [usageCode, setUsageCode] = useState<string | null>(null)

  const loadPromoCodes = async () => {
    setLoading(true)
    try {
      // Backend returns all creator codes — filter by community client-side
      const res = await api.promoCodes.getMyCodes().catch(() => null as any)
      const list: PromoCodeResponseDto[] = Array.isArray(res) ? res : (res?.data || [])
      // Filter to current community if selectedCommunityId is set
      const filtered = selectedCommunityId
        ? list.filter(c => !c.communityId || c.communityId === selectedCommunityId)
        : list
      setPromoCodes(filtered)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load promo codes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (communityLoading) return
    if (!selectedCommunityId) {
      setPromoCodes([])
      setLoading(false)
      return
    }
    loadPromoCodes()
  }, [selectedCommunityId, communityLoading])

  // Client-side filtering by tab + search
  const filteredCodes = promoCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchQuery.toLowerCase())
    const now = new Date()
    const isExpired = code.endsAt && new Date(code.endsAt) < now
    const isScheduled = code.startsAt && new Date(code.startsAt) > now
    const isMaxedOut = code.maxRedemptions && code.redemptionsCount >= code.maxRedemptions
    const isEffectivelyActive = code.isActive && !isExpired && !isMaxedOut && !isScheduled

    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'active') return matchesSearch && isEffectivelyActive
    if (activeTab === 'expired') return matchesSearch && (isExpired || isMaxedOut)
    if (activeTab === 'scheduled') return matchesSearch && isScheduled
    if (activeTab === 'inactive') return matchesSearch && !code.isActive

    return matchesSearch
  })

  if (guard) return guard

  return (
    <PageShell>
      <PromoCodesHeader
        onCreateClick={() => {
          setEditingCode(null)
          setShowCreateDialog(true)
        }}
        onRefresh={loadPromoCodes}
      />

      <PromoCodesStats promoCodes={promoCodes} />

      <PromoCodesTable
        promoCodes={filteredCodes}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onEdit={(code) => {
          setEditingCode(code)
          setShowCreateDialog(true)
        }}
        onDelete={async (code) => {
          try {
            await api.promoCodes.delete(code.code)
            toast({ title: 'Success', description: `Promo code "${code.code}" deleted` })
            await loadPromoCodes()
          } catch (error: any) {
            toast({
              title: 'Error',
              description: error.message || 'Failed to delete promo code',
              variant: 'destructive',
            })
          }
        }}
        onViewStats={(code) => setStatsCode(code.code)}
        onViewUsage={(code) => setUsageCode(code.code)}
      />

      <PromoCodeFormDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) setEditingCode(null)
        }}
        editingCode={editingCode}
        communityId={selectedCommunityId}
        onSuccess={() => {
          loadPromoCodes()
          setShowCreateDialog(false)
          setEditingCode(null)
        }}
      />

      <PromoCodeStatsDialog
        open={!!statsCode}
        onOpenChange={(open) => { if (!open) setStatsCode(null) }}
        code={statsCode || ''}
      />

      <PromoCodeUsageDialog
        open={!!usageCode}
        onOpenChange={(open) => { if (!open) setUsageCode(null) }}
        code={usageCode || ''}
      />
    </PageShell>
  )
}
```

---

### STEP 3: Header Component

**File**: `frontend/app/(creator)/creator/monetization/promo-codes/components/promo-codes-header.tsx`

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'

interface PromoCodesHeaderProps {
  onCreateClick: () => void
  onRefresh: () => void
}

export function PromoCodesHeader({ onCreateClick, onRefresh }: PromoCodesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Promo Codes</h1>
        <p className="text-gray-600 mt-1">
          Create and manage discount codes for your content
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button size="sm" onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Create Promo Code
        </Button>
      </div>
    </div>
  )
}
```

---

### STEP 4: Stats Cards Component

**File**: `frontend/app/(creator)/creator/monetization/promo-codes/components/promo-codes-stats.tsx`

**Note**: Stats cards compute from the local data only (total codes, active, total redemptions). The "Total Discounts Given" card is omitted since accurate discount totals require per-code API calls — we show total redemptions instead.

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tag, CheckCircle, TrendingUp, XCircle } from 'lucide-react'
import { PromoCodeResponseDto } from '@/lib/api'

interface PromoCodesStatsProps {
  promoCodes: PromoCodeResponseDto[]
}

export function PromoCodesStats({ promoCodes }: PromoCodesStatsProps) {
  const totalCodes = promoCodes.length
  const now = new Date()
  const activeCodes = promoCodes.filter(c =>
    c.isActive
    && (!c.endsAt || new Date(c.endsAt) > now)
    && (!c.startsAt || new Date(c.startsAt) <= now)
    && (!c.maxRedemptions || c.redemptionsCount < c.maxRedemptions)
  ).length
  const totalRedemptions = promoCodes.reduce((sum, c) => sum + c.redemptionsCount, 0)
  const expiredCodes = promoCodes.filter(c =>
    (c.endsAt && new Date(c.endsAt) < now)
    || (c.maxRedemptions && c.redemptionsCount >= c.maxRedemptions)
  ).length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCodes}</div>
          <p className="text-xs text-muted-foreground">All promo codes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeCodes}</div>
          <p className="text-xs text-muted-foreground">Currently usable</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRedemptions}</div>
          <p className="text-xs text-muted-foreground">All-time uses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expired / Maxed</CardTitle>
          <XCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiredCodes}</div>
          <p className="text-xs text-muted-foreground">No longer valid</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### STEP 5: Promo Codes Table Component

**File**: `frontend/app/(creator)/creator/monetization/promo-codes/components/promo-codes-table.tsx`

**Key corrections from original plan:**
- Added `onViewStats` and `onViewUsage` callbacks (were missing — stats dialog handler was a no-op comment)
- Discount display shows BOTH percentOff and amountOffDT when both exist (they're additive)
- Tab includes "Inactive" for manually deactivated codes
- Uses `AlertDialog` for delete confirmation instead of `window.confirm`

```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search, MoreHorizontal, Edit, Trash2, Copy,
  BarChart3, Users, CheckCircle, XCircle, Clock, Loader2,
} from 'lucide-react'
import { PromoCodeResponseDto } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface PromoCodesTableProps {
  promoCodes: PromoCodeResponseDto[]
  loading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  activeTab: string
  onTabChange: (tab: string) => void
  onEdit: (code: PromoCodeResponseDto) => void
  onDelete: (code: PromoCodeResponseDto) => Promise<void>
  onViewStats: (code: PromoCodeResponseDto) => void
  onViewUsage: (code: PromoCodeResponseDto) => void
}

export function PromoCodesTable({
  promoCodes, loading, searchQuery, onSearchChange,
  activeTab, onTabChange, onEdit, onDelete,
  onViewStats, onViewUsage,
}: PromoCodesTableProps) {
  const { toast } = useToast()
  const [deletingCode, setDeletingCode] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PromoCodeResponseDto | null>(null)

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: 'Copied!', description: `Code "${code}" copied to clipboard` })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeletingCode(deleteTarget.id)
    try {
      await onDelete(deleteTarget)
    } finally {
      setDeletingCode(null)
      setDeleteTarget(null)
    }
  }

  const getStatusBadge = (code: PromoCodeResponseDto) => {
    const now = new Date()
    const isExpired = code.endsAt && new Date(code.endsAt) < now
    const isScheduled = code.startsAt && new Date(code.startsAt) > now
    const isMaxedOut = code.maxRedemptions && code.redemptionsCount >= code.maxRedemptions

    if (!code.isActive) {
      return <Badge variant="outline" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Inactive</Badge>
    }
    if (isExpired) {
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Expired</Badge>
    }
    if (isMaxedOut) {
      return <Badge variant="secondary" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Maxed Out</Badge>
    }
    if (isScheduled) {
      return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Scheduled</Badge>
    }
    return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Active</Badge>
  }

  const getDiscountDisplay = (code: PromoCodeResponseDto) => {
    const parts: string[] = []
    if (code.percentOff) parts.push(`${code.percentOff}%`)
    if (code.amountOffDT) parts.push(`${code.amountOffDT} DT`)
    if (parts.length === 0) return 'N/A'
    return parts.join(' + ') + ' off'
  }

  const getAppliesToDisplay = (code: PromoCodeResponseDto) => {
    if (!code.appliesToType) return 'All content'
    if (code.appliesToId) return `Specific ${code.appliesToType}`
    return `All ${code.appliesToType}s`
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Promo Code Management</CardTitle>
          <CardDescription>View and manage your promo codes</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search promo codes..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value={activeTab} className="m-0">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Applies To</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : promoCodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No promo codes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      promoCodes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                          <TableCell>{getDiscountDisplay(code)}</TableCell>
                          <TableCell>{getAppliesToDisplay(code)}</TableCell>
                          <TableCell>
                            {code.redemptionsCount}
                            {code.maxRedemptions != null && ` / ${code.maxRedemptions}`}
                          </TableCell>
                          <TableCell>{getStatusBadge(code)}</TableCell>
                          <TableCell>
                            {code.endsAt
                              ? new Date(code.endsAt).toLocaleDateString()
                              : 'No expiry'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={deletingCode === code.id}>
                                  {deletingCode === code.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => copyToClipboard(code.code)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Code
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onViewStats(code)}>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  View Stats
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onViewUsage(code)}>
                                  <Users className="h-4 w-4 mr-2" />
                                  View Usage
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onEdit(code)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => setDeleteTarget(code)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.code}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

---

### STEP 6: Create/Edit Form Dialog

**File**: `frontend/app/(creator)/creator/monetization/promo-codes/components/promo-code-form-dialog.tsx`

**Key corrections from original plan:**
- Code max length is **50** (not 20) — matches `@MaxLength(50)` in backend
- Code regex removed — backend accepts any string 3–50 chars, auto-uppercases it. Users should be free to type lowercase.
- `percentOff` min is **0** (not 1) and `amountOffDT` min is **0** (not 0.01) — matches backend `@Min(0)`
- Added **combined discount** support: both percentOff AND amountOffDT can be set simultaneously
- Discount type selector changed to checkboxes (percent, fixed, or both)
- `appliesToType` includes all 10 `TrackableContentType` values
- Uses `UpdatePromoCodeDto` (not `Partial<CreatePromoCodeDto>`) for edits
- ISO 8601 date strings sent to backend (not Date objects)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import {
  api, CreatePromoCodeDto, UpdatePromoCodeDto,
  PromoCodeResponseDto,
} from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const promoCodeSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be at most 50 characters'),
  percentOff: z.union([z.number().min(0).max(100), z.nan()]).optional(),
  amountOffDT: z.union([z.number().min(0), z.nan()]).optional(),
  appliesToType: z.string().optional(),
  appliesToId: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  maxRedemptions: z.union([z.number().min(1), z.nan()]).optional(),
  isActive: z.boolean(),
  allowedEmails: z.string().optional(),
}).refine(data => {
  const pct = typeof data.percentOff === 'number' && !isNaN(data.percentOff) && data.percentOff > 0
  const amt = typeof data.amountOffDT === 'number' && !isNaN(data.amountOffDT) && data.amountOffDT > 0
  return pct || amt
}, {
  message: 'At least one discount (percentage or fixed amount) is required',
  path: ['percentOff'],
}).refine(data => {
  if (data.startsAt && data.endsAt) {
    return new Date(data.startsAt) < new Date(data.endsAt)
  }
  return true
}, {
  message: 'Start date must be before end date',
  path: ['endsAt'],
})

type FormData = z.infer<typeof promoCodeSchema>

interface PromoCodeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCode: PromoCodeResponseDto | null
  communityId: string | null
  onSuccess: () => void
}

export function PromoCodeFormDialog({
  open, onOpenChange, editingCode, communityId, onSuccess,
}: PromoCodeFormDialogProps) {
  const { toast } = useToast()
  const isEditing = !!editingCode

  const form = useForm<FormData>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: '',
      percentOff: undefined,
      amountOffDT: undefined,
      appliesToType: '',
      appliesToId: '',
      startsAt: '',
      endsAt: '',
      maxRedemptions: undefined,
      isActive: true,
      allowedEmails: '',
    },
  })

  useEffect(() => {
    if (editingCode) {
      form.reset({
        code: editingCode.code,
        percentOff: editingCode.percentOff ?? undefined,
        amountOffDT: editingCode.amountOffDT ?? undefined,
        appliesToType: editingCode.appliesToType || '',
        appliesToId: editingCode.appliesToId || '',
        startsAt: editingCode.startsAt
          ? new Date(editingCode.startsAt).toISOString().split('T')[0]
          : '',
        endsAt: editingCode.endsAt
          ? new Date(editingCode.endsAt).toISOString().split('T')[0]
          : '',
        maxRedemptions: editingCode.maxRedemptions ?? undefined,
        isActive: editingCode.isActive,
        allowedEmails: editingCode.allowedEmails?.join(', ') || '',
      })
    } else {
      form.reset({
        code: '', percentOff: undefined, amountOffDT: undefined,
        appliesToType: '', appliesToId: '', startsAt: '', endsAt: '',
        maxRedemptions: undefined, isActive: true, allowedEmails: '',
      })
    }
  }, [editingCode, open])

  const onSubmit = async (data: FormData) => {
    try {
      const cleanNumber = (v: number | undefined) =>
        typeof v === 'number' && !isNaN(v) && v > 0 ? v : undefined

      const emails = data.allowedEmails
        ? data.allowedEmails.split(',').map(e => e.trim()).filter(Boolean)
        : undefined

      if (isEditing) {
        const payload: UpdatePromoCodeDto = {
          percentOff: cleanNumber(data.percentOff),
          amountOffDT: cleanNumber(data.amountOffDT),
          appliesToType: (data.appliesToType || undefined) as any,
          appliesToId: data.appliesToId || undefined,
          startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : undefined,
          endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
          maxRedemptions: cleanNumber(data.maxRedemptions),
          isActive: data.isActive,
          allowedEmails: emails,
        }
        await api.promoCodes.update(editingCode!.code, payload)
        toast({ title: 'Success', description: 'Promo code updated successfully' })
      } else {
        const payload: CreatePromoCodeDto = {
          code: data.code.toUpperCase().trim(),
          percentOff: cleanNumber(data.percentOff),
          amountOffDT: cleanNumber(data.amountOffDT),
          appliesToType: (data.appliesToType || undefined) as any,
          appliesToId: data.appliesToId || undefined,
          communityId: communityId || undefined,
          startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : undefined,
          endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
          maxRedemptions: cleanNumber(data.maxRedemptions),
          isActive: data.isActive,
          allowedEmails: emails,
        }
        await api.promoCodes.create(payload)
        toast({ title: 'Success', description: 'Promo code created successfully' })
      }

      onSuccess()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save promo code',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Create'} Promo Code</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the promo code details'
              : 'Create a new discount code for your content'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Promo Code *</Label>
            <Input
              id="code"
              placeholder="SUMMER25"
              {...form.register('code')}
              disabled={isEditing}
              className="font-mono uppercase"
            />
            {form.formState.errors.code && (
              <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
            )}
          </div>

          {/* Discount — both fields shown, both can be filled */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="percentOff">Percentage Off (%)</Label>
              <Input
                id="percentOff"
                type="number"
                step="1"
                min="0"
                max="100"
                placeholder="e.g. 25"
                {...form.register('percentOff', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountOffDT">Fixed Amount Off (DT)</Label>
              <Input
                id="amountOffDT"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 10"
                {...form.register('amountOffDT', { valueAsNumber: true })}
              />
            </div>
          </div>
          {form.formState.errors.percentOff && (
            <p className="text-sm text-red-500">{form.formState.errors.percentOff.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            You can set both — they are additive (e.g. 10% off + 5 DT off).
          </p>

          {/* Applies To */}
          <div className="space-y-2">
            <Label>Applies To</Label>
            <Select
              value={form.watch('appliesToType') || ''}
              onValueChange={(value) => form.setValue('appliesToType', value || '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Content" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Content</SelectItem>
                <SelectItem value="course">Courses</SelectItem>
                <SelectItem value="chapter">Chapters</SelectItem>
                <SelectItem value="challenge">Challenges</SelectItem>
                <SelectItem value="session">Sessions</SelectItem>
                <SelectItem value="event">Events</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="resource">Resources</SelectItem>
                <SelectItem value="community">Communities</SelectItem>
                <SelectItem value="subscription">Subscriptions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Specific Content ID (shown when type is selected) */}
          {form.watch('appliesToType') && (
            <div className="space-y-2">
              <Label htmlFor="appliesToId">Specific Content ID (Optional)</Label>
              <Input
                id="appliesToId"
                placeholder="Leave empty to apply to all of this type"
                {...form.register('appliesToId')}
              />
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startsAt">Start Date</Label>
              <Input
                id="startsAt"
                type="date"
                {...form.register('startsAt')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endsAt">End Date</Label>
              <Input
                id="endsAt"
                type="date"
                {...form.register('endsAt')}
              />
              {form.formState.errors.endsAt && (
                <p className="text-sm text-red-500">{form.formState.errors.endsAt.message}</p>
              )}
            </div>
          </div>

          {/* Max Redemptions */}
          <div className="space-y-2">
            <Label htmlFor="maxRedemptions">Max Redemptions</Label>
            <Input
              id="maxRedemptions"
              type="number"
              min="1"
              placeholder="Unlimited"
              {...form.register('maxRedemptions', { valueAsNumber: true })}
            />
          </div>

          {/* Allowed Emails */}
          <div className="space-y-2">
            <Label htmlFor="allowedEmails">Allowed Emails</Label>
            <Textarea
              id="allowedEmails"
              placeholder="user1@example.com, user2@example.com"
              {...form.register('allowedEmails')}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated. Leave empty to allow everyone.
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update' : 'Create'} Promo Code
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

### STEP 7: Stats Dialog Component

**File**: `frontend/app/(creator)/creator/monetization/promo-codes/components/promo-code-stats-dialog.tsx`

**Key correction**: The API returns the stats DTO directly (not wrapped in `data` property). Handle both response shapes defensively.

```typescript
'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, Users, DollarSign, Percent } from 'lucide-react'
import { api, PromoCodeStatsDto } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface PromoCodeStatsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
}

export function PromoCodeStatsDialog({ open, onOpenChange, code }: PromoCodeStatsDialogProps) {
  const { toast } = useToast()
  const [stats, setStats] = useState<PromoCodeStatsDto | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && code) {
      loadStats()
    } else {
      setStats(null)
    }
  }, [open, code])

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await api.promoCodes.getStats(code).catch(() => null as any)
      // Handle both direct response and wrapped response
      setStats(res?.data ?? res ?? null)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load statistics', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Promo Code Statistics</DialogTitle>
          <DialogDescription>
            Performance metrics for code: <span className="font-mono font-semibold">{code}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUses}</div>
                  {stats.maxRedemptions != null && (
                    <p className="text-xs text-muted-foreground">
                      of {stats.maxRedemptions} max
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} DT</div>
                  <p className="text-xs text-muted-foreground">After discounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                  <Percent className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDiscounts.toFixed(2)} DT</div>
                  <p className="text-xs text-muted-foreground">Given to customers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Discount</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageDiscount.toFixed(2)} DT</div>
                  <p className="text-xs text-muted-foreground">Per redemption</p>
                </CardContent>
              </Card>
            </div>

            {stats.remainingUses != null && stats.maxRedemptions != null && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Remaining Uses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    {stats.remainingUses} of {stats.maxRedemptions} remaining
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, (stats.totalUses / stats.maxRedemptions) * 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No statistics available
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

### STEP 8: Usage Dialog Component

**File**: `frontend/app/(creator)/creator/monetization/promo-codes/components/promo-code-usage-dialog.tsx`

**Key correction**: Backend `contentTitle` is always `undefined` in current implementation. Handle gracefully.

```typescript
'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, PromoCodeUsageDto } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface PromoCodeUsageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
}

export function PromoCodeUsageDialog({ open, onOpenChange, code }: PromoCodeUsageDialogProps) {
  const { toast } = useToast()
  const [usage, setUsage] = useState<PromoCodeUsageDto[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    if (open && code) {
      setPage(1)
      loadUsage(1)
    } else {
      setUsage([])
    }
  }, [open, code])

  const loadUsage = async (p: number) => {
    setLoading(true)
    try {
      const res = await api.promoCodes.getUsage(code, { page: p, limit })
        .catch(() => null as any)
      const data = res?.data ?? res
      setUsage(Array.isArray(data) ? data : data?.data || [])
      setTotal(res?.total ?? data?.total ?? 0)
      setTotalPages(res?.totalPages ?? data?.totalPages ?? 1)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load usage data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    loadUsage(newPage)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Promo Code Usage</DialogTitle>
          <DialogDescription>
            Users who have used code: <span className="font-mono font-semibold">{code}</span>
            {total > 0 && <span className="ml-2">({total} total)</span>}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : usage.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No usage data available
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Final</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage.map((item) => (
                    <TableRow key={item.orderId}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{item.buyerName}</div>
                          <div className="text-muted-foreground">{item.buyerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm capitalize">{item.contentType}</div>
                      </TableCell>
                      <TableCell>{item.originalAmount.toFixed(2)} DT</TableCell>
                      <TableCell className="text-green-600">
                        -{item.discountAmount.toFixed(2)} DT
                      </TableCell>
                      <TableCell className="font-semibold">
                        {item.finalAmount.toFixed(2)} DT
                      </TableCell>
                      <TableCell>
                        {new Date(item.usedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.orderStatus === 'paid' ? 'default' : 'outline'}>
                          {item.orderStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🔗 Integration Checklist

### API Index Registration
After creating `lib/api/promo-codes.api.ts`, add to `lib/api/index.ts`:
```typescript
export * from './promo-codes.api';
import { promoCodesApi } from './promo-codes.api';

// In the api object:
promoCodes: promoCodesApi,
```

### Navigation
Add promo codes link to the monetization sidebar/nav in the creator dashboard layout.

---

## 🧪 Testing Strategy

### Unit Tests
- API client methods (mock `apiClient`, verify endpoints/params)
- Zod form validation (combined discount rule, date ordering)
- Status badge logic (active/expired/scheduled/maxed/inactive)
- Discount display (percent only, fixed only, both combined)
- Client-side filter by tab and search

### Integration Tests
- Create promo code → verify API call with correct payload
- Edit promo code → verify `UpdatePromoCodeDto` (no `code` field)
- Delete promo code → verify confirmation dialog → API call
- View stats → verify stats dialog renders API response
- View usage → verify pagination works

### E2E Tests (Playwright)
- Complete create → search → edit → delete workflow
- Tab filtering (active/expired/scheduled)
- Copy code to clipboard
- Stats and usage dialog open/close

---

## 📱 Responsive Design

### Mobile (< 768px)
- Stack header buttons vertically
- Single column stats cards
- Horizontal scroll for table (`overflow-x-auto` on table container)
- Tabs stack or scroll horizontally

### Tablet (768px – 1024px)
- 2 column stats cards
- Compact table layout

### Desktop (> 1024px)
- 4 column stats cards
- Full table layout
- Multi-column form layout

---

## ⚠️ Important Backend Notes

1. **Both discounts are additive**: `percentOff` and `amountOffDT` can coexist. Discount = `(amount × percentOff / 100) + amountOffDT`. The form must support both simultaneously.

2. **Code is immutable**: Once created, the code string cannot be changed (`UpdatePromoCodeDto` has no `code` field). The form disables the code input when editing.

3. **Creator isolation**: `GET /promo-codes/my-codes` returns only codes where `creatorId` matches the JWT user. No community filtering on the backend — filter client-side if needed.

4. **No ownership enforcement on write**: The backend controller doesn't check if the creator owns the code before `PUT`/`DELETE`. Any authenticated user could theoretically update/delete any code by string. This is a known limitation.

5. **Redemption count is atomic**: `incrementRedemptionCount` uses MongoDB `$inc` — race-safe.

6. **Usage includes ALL orders**: `getUsage` returns orders of any status that reference the code, not just `paid` ones. `getStats` only counts `paid` orders for statistics.

7. **contentTitle is always undefined**: The backend `getUsage` method sets `contentTitle: undefined` as a placeholder. Don't rely on it.

8. **Uppercase normalization**: Backend uppercases and trims all code lookups. Frontend should uppercase before display but doesn't need to force it in the search.

---

## 🚀 Deployment Checklist

- [ ] `lib/api/promo-codes.api.ts` created with correct types and endpoints
- [ ] `lib/api/index.ts` updated with export and `api.promoCodes` entry
- [ ] All 7 components created (page + 6 sub-components)
- [ ] Form validation matches backend rules (3–50 chars, at least one discount, dates)
- [ ] Error handling covers 400/404/409 backend errors
- [ ] Loading/empty states for all data views
- [ ] Delete confirmation uses AlertDialog (not window.confirm)
- [ ] Stats and Usage dialogs properly wired
- [ ] Responsive table with `overflow-x-auto`
- [ ] Navigation link added to monetization sidebar
- [ ] TypeScript compiles without errors
- [ ] Manual testing against running backend

---

**Document Version**: 2.0
**Last Updated**: 2026-04-02
**Status**: Backend-verified, ready for implementation
