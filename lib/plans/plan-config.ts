/**
 * Canonical plan configuration — single source of truth for all plan data.
 * Mirrors the backend seed-plans.ts values exactly.
 *
 * Also exports shared UI constants (icons, colors, labels) so that every
 * page renders plans consistently without duplicating config.
 */

import { Zap, Star, Rocket, type LucideIcon } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

export type PlanTier = "starter" | "growth" | "pro";

export type BillingInterval = "monthly" | "yearly";

export interface PlanLimits {
    membersMax: number;
    adminsMax: number;
    coursesActivationMax: number;
    storageGB: number;
    emailCampaignRecipientsPerMonth: number;
    whatsappMessagesPerMonth: number;
    sessionBookingsPerMonth: number;
    analyticsLookbackDays: number;
}

export interface PlanFeatures {
    courses: boolean;
    products: boolean;
    challenges: boolean;
    sessions: boolean;
    events: boolean;
    branding: boolean;
    gamification: boolean;
    verifiedBadge: boolean;
    featuredBadge: boolean;
}

export interface Plan {
    tier: PlanTier;
    name: string;
    monthlyPrice: number;
    yearlyMonthlyPrice: number;
    yearlyTotal: number;
    transactionFee: number;
    currency: string;
    trialDays: number;
    highlight?: boolean;
    limits: PlanLimits;
    features: PlanFeatures;
}

export type PlanMap = Record<PlanTier, Plan>;

// ── ENV Flag ───────────────────────────────────────────────────────────────

export const PLAN_ENFORCEMENT_MODE =
    process.env.NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE === "true";

// ── Plan Definitions ───────────────────────────────────────────────────────

export const PLANS: PlanMap = {
    starter: {
        tier: "starter",
        name: "Starter",
        monthlyPrice: 39,
        yearlyMonthlyPrice: 31,
        yearlyTotal: 372,
        transactionFee: 7.9,
        currency: "TND",
        trialDays: 7,
        limits: {
            membersMax: 100,
            adminsMax: 1,
            coursesActivationMax: 3,
            storageGB: 5,
            emailCampaignRecipientsPerMonth: 0,
            whatsappMessagesPerMonth: 0,
            sessionBookingsPerMonth: 0,
            analyticsLookbackDays: 30,
        },
        features: {
            courses: true,
            products: true,
            challenges: false,
            sessions: false,
            events: false,
            branding: false,
            gamification: false,
            verifiedBadge: false,
            featuredBadge: false,
        },
    },
    growth: {
        tier: "growth",
        name: "Growth",
        monthlyPrice: 99,
        yearlyMonthlyPrice: 79,
        yearlyTotal: 948,
        transactionFee: 4.9,
        currency: "TND",
        trialDays: 7,
        highlight: true,
        limits: {
            membersMax: 500,
            adminsMax: 2,
            coursesActivationMax: 999,
            storageGB: 50,
            emailCampaignRecipientsPerMonth: 1000,
            whatsappMessagesPerMonth: 250,
            sessionBookingsPerMonth: 300,
            analyticsLookbackDays: 180,
        },
        features: {
            courses: true,
            products: true,
            challenges: true,
            sessions: true,
            events: true,
            branding: false,
            gamification: true,
            verifiedBadge: true,
            featuredBadge: false,
        },
    },
    pro: {
        tier: "pro",
        name: "Pro",
        monthlyPrice: 159,
        yearlyMonthlyPrice: 127,
        yearlyTotal: 1524,
        transactionFee: 2.9,
        currency: "TND",
        trialDays: 7,
        limits: {
            membersMax: 999999,
            adminsMax: 3,
            coursesActivationMax: 999999,
            storageGB: 300,
            emailCampaignRecipientsPerMonth: 15000,
            whatsappMessagesPerMonth: 1000,
            sessionBookingsPerMonth: 1000,
            analyticsLookbackDays: 365,
        },
        features: {
            courses: true,
            products: true,
            challenges: true,
            sessions: true,
            events: true,
            branding: true,
            gamification: true,
            verifiedBadge: true,
            featuredBadge: true,
        },
    },
};

// ── Helpers ────────────────────────────────────────────────────────────────

export const PLAN_TIERS: PlanTier[] = ["starter", "growth", "pro"];

export function minimumPlanForFeature(feature: keyof PlanFeatures): PlanTier {
    for (const tier of PLAN_TIERS) {
        if (PLANS[tier].features[feature]) return tier;
    }
    return "pro";
}

export function formatLimit(value: number, suffix = ""): string {
    if (value >= 999999) return "Unlimited";
    if (value >= 999) return "Unlimited";
    return `${value.toLocaleString()}${suffix}`;
}

/**
 * Get the price for a plan given a billing interval.
 */
export function getPlanPrice(
    tier: PlanTier,
    interval: BillingInterval,
): number {
    const plan = PLANS[tier];
    return interval === "yearly" ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
}

/**
 * Safely clamp a float to avoid "-0.00" display artifacts.
 */
export function safeFixed(value: number, digits = 2): string {
    const clamped = Math.max(0, value);
    return clamped.toFixed(digits);
}

// ── Add-ons ────────────────────────────────────────────────────────────────

export const ADD_ONS = {
    extraAdminSeat: { priceTND: 15, label: "Extra admin seat", per: "/month" },
    extraStorage: {
        starter: { priceTND: 12, per100GB: true },
        growth: { priceTND: 10, per100GB: true },
        pro: { priceTND: 9, per100GB: true },
    },
} as const;

export function getAddonStoragePrice(tier: PlanTier): number {
    return ADD_ONS.extraStorage[tier]?.priceTND ?? 12;
}

// ── Shared UI Constants ────────────────────────────────────────────────────
// These were previously duplicated in plan/page.tsx, upgrade/page.tsx,
// pricing/page.tsx, admin/subscription/page.tsx, and upgrade-modal.tsx.
// Now centralised here for consistency.

/** Icons per plan tier */
export const PLAN_ICONS: Record<PlanTier, LucideIcon> = {
    starter: Zap,
    growth: Star,
    pro: Rocket,
};

/** Tier visual theming (color, background) */
export interface TierTheme {
    icon: LucideIcon;
    color: string;
    bg: string;
    border: string;
    gradient: string;
}

export const TIER_THEMES: Record<PlanTier, TierTheme> = {
    starter: {
        icon: Zap,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        gradient: "from-blue-500 to-blue-600",
    },
    growth: {
        icon: Star,
        color: "text-primary",
        bg: "bg-primary/5",
        border: "border-primary/30",
        gradient: "from-primary to-primary/80",
    },
    pro: {
        icon: Rocket,
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
        gradient: "from-purple-500 to-purple-600",
    },
};

/** Subscription status badges — renders consistently across all pages */
export interface StatusBadgeConfig {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
}

export const STATUS_CONFIG: Record<string, StatusBadgeConfig> = {
    active: { label: "Active", variant: "default" },
    trialing: {
        label: "Trial",
        variant: "secondary",
        className: "bg-blue-100 text-blue-700",
    },
    past_due: { label: "Past Due", variant: "destructive" },
    canceled: {
        label: "Canceled",
        variant: "outline",
        className: "border-orange-400 text-orange-600",
    },
    incomplete: {
        label: "Incomplete",
        variant: "outline",
        className: "border-yellow-400 text-yellow-600",
    },
};

/** Invoice status badge config */
export interface InvoiceStatusConfig {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
}

export const INVOICE_STATUS_MAP: Record<string, InvoiceStatusConfig> = {
    paid: { label: "Paid", variant: "default" },
    open: { label: "Open", variant: "secondary" },
    draft: { label: "Draft", variant: "outline" },
    void: { label: "Void", variant: "outline" },
    uncollectible: { label: "Uncollectible", variant: "destructive" },
};

/** Feature display labels for plan feature lists */
export const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
    courses: "Courses",
    products: "Digital Products",
    challenges: "Challenges",
    sessions: "1:1 Sessions",
    events: "Events",
    branding: "Remove Chabaqa Branding",
    gamification: "Gamification (Points & Badges)",
    verifiedBadge: "Verified Badge",
    featuredBadge: "Featured Badge",
};

/** Cancellation reason options for retention flow */
export const CANCELLATION_REASONS = [
    { id: "too_expensive", label: "Too expensive", offer: "downgrade" },
    {
        id: "missing_features",
        label: "Missing features I need",
        offer: "roadmap",
    },
    { id: "not_using", label: "Not using it enough", offer: "pause" },
    { id: "switching", label: "Switching to another platform", offer: "none" },
    { id: "other", label: "Other reason", offer: "none" },
] as const;

export type CancellationReasonId = (typeof CANCELLATION_REASONS)[number]["id"];

// ── localStorage keys for persistent UI state ──────────────────────────────

export const STORAGE_KEYS = {
    BILLING_INTERVAL: "chabaqa_billing_interval",
    TRIAL_BANNER_DISMISSED: "chabaqa_trial_banner_dismissed",
    TRIAL_BANNER_DISMISS_EXPIRY: "chabaqa_trial_banner_dismiss_expiry",
} as const;

/**
 * Persist billing interval preference to localStorage.
 */
export function saveBillingPreference(interval: BillingInterval): void {
    try {
        localStorage.setItem(STORAGE_KEYS.BILLING_INTERVAL, interval);
    } catch {
        // SSR or localStorage unavailable — silent fail
    }
}

/**
 * Read billing interval preference from localStorage.
 */
export function loadBillingPreference(): BillingInterval {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.BILLING_INTERVAL);
        if (stored === "monthly" || stored === "yearly") return stored;
    } catch {
        // SSR or localStorage unavailable
    }
    return "yearly";
}

/**
 * Dismiss the trial banner for 24 hours (persisted).
 */
export function dismissTrialBanner(): void {
    try {
        const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24h
        localStorage.setItem(STORAGE_KEYS.TRIAL_BANNER_DISMISSED, "true");
        localStorage.setItem(
            STORAGE_KEYS.TRIAL_BANNER_DISMISS_EXPIRY,
            String(expiry),
        );
    } catch {
        // silent
    }
}

/**
 * Check if the trial banner was dismissed and hasn't expired.
 */
export function isTrialBannerDismissed(): boolean {
    try {
        const dismissed = localStorage.getItem(
            STORAGE_KEYS.TRIAL_BANNER_DISMISSED,
        );
        if (dismissed !== "true") return false;
        const expiry = Number(
            localStorage.getItem(STORAGE_KEYS.TRIAL_BANNER_DISMISS_EXPIRY) ||
                "0",
        );
        if (Date.now() > expiry) {
            // Expired — clear
            localStorage.removeItem(STORAGE_KEYS.TRIAL_BANNER_DISMISSED);
            localStorage.removeItem(STORAGE_KEYS.TRIAL_BANNER_DISMISS_EXPIRY);
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate that a string is a valid PlanTier.
 */
export function isValidTier(value: unknown): value is PlanTier {
    return typeof value === "string" && PLAN_TIERS.includes(value as PlanTier);
}

/**
 * Safely cast a value to PlanTier with fallback.
 */
export function toSafeTier(
    value: unknown,
    fallback: PlanTier = "starter",
): PlanTier {
    return isValidTier(value) ? value : fallback;
}

/**
 * Get features gained when upgrading from one tier to another.
 */
export function getFeaturesGained(
    fromTier: PlanTier,
    toTier: PlanTier,
): { feature: string; label: string }[] {
    const from = PLANS[fromTier];
    const to = PLANS[toTier];
    const gained: { feature: string; label: string }[] = [];

    for (const [key, label] of Object.entries(FEATURE_LABELS)) {
        const featureKey = key as keyof PlanFeatures;
        if (!from.features[featureKey] && to.features[featureKey]) {
            gained.push({ feature: key, label });
        }
    }

    return gained;
}

/**
 * Get features that will be lost when downgrading from one tier to another.
 */
export function getFeaturesLost(
    fromTier: PlanTier,
    toTier: PlanTier,
): { feature: string; label: string }[] {
    return getFeaturesGained(toTier, fromTier);
}

/**
 * Get limit improvements when upgrading.
 */
export function getLimitImprovements(
    fromTier: PlanTier,
    toTier: PlanTier,
): { key: string; from: number; to: number; label: string }[] {
    const fromPlan = PLANS[fromTier];
    const toPlan = PLANS[toTier];

    const limitLabels: Record<keyof PlanLimits, string> = {
        membersMax: "Members",
        adminsMax: "Admin Seats",
        coursesActivationMax: "Active Courses",
        storageGB: "Storage (GB)",
        emailCampaignRecipientsPerMonth: "Email Recipients/mo",
        whatsappMessagesPerMonth: "WhatsApp Messages/mo",
        sessionBookingsPerMonth: "Session Bookings/mo",
        analyticsLookbackDays: "Analytics History (days)",
    };

    const improvements: {
        key: string;
        from: number;
        to: number;
        label: string;
    }[] = [];

    for (const [key, label] of Object.entries(limitLabels)) {
        const limitKey = key as keyof PlanLimits;
        const fromVal = fromPlan.limits[limitKey];
        const toVal = toPlan.limits[limitKey];
        if (toVal > fromVal) {
            improvements.push({ key, from: fromVal, to: toVal, label });
        }
    }

    return improvements;
}
