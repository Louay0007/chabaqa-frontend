"use client";

import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "@/lib/api/subscription.api";
import {
    PLANS,
    PLAN_ENFORCEMENT_MODE,
    toSafeTier,
    type Plan,
    type PlanTier,
    type PlanFeatures,
    type PlanLimits,
} from "@/lib/plans/plan-config";

/**
 * Shared query key for the current creator's subscription.
 * Use this when invalidating from mutations so every consumer refreshes.
 *
 * Example:
 *   queryClient.invalidateQueries({ queryKey: MY_SUBSCRIPTION_QUERY_KEY });
 */
export const MY_SUBSCRIPTION_QUERY_KEY = ["my-subscription"] as const;

export function usePlan() {
    const {
        data: subscription,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: [...MY_SUBSCRIPTION_QUERY_KEY],
        queryFn: async () => {
            try {
                const res = await subscriptionApi.getMySubscription();
                return res.data ?? null;
            } catch {
                return null;
            }
        },
        // Reduced from 60s → 30s so post-upgrade UI refreshes faster.
        staleTime: 30_000,
        retry: 1,
        // Always fetch subscription data — even when enforcement is off the data
        // is useful for display (trial banner, usage indicators, billing pages).
        enabled: true,
    });

    // Use toSafeTier for validated tier extraction (avoids unsafe casts).
    const tier: PlanTier = toSafeTier(subscription?.plan, "starter");
    const plan: Plan = PLANS[tier] ?? PLANS.starter;

    if (!PLAN_ENFORCEMENT_MODE) {
        return {
            // When enforcement is off, report the Pro plan so nothing is gated,
            // but still expose the real subscription object for informational pages.
            plan: PLANS.pro as Plan,
            tier: "pro" as PlanTier,
            isLoading: false,
            subscription: subscription ?? null,
            enforcementEnabled: false,
            canUseFeature: (_feature: keyof PlanFeatures) => true,
            isAtLimit: (_limit: keyof PlanLimits, _currentValue: number) =>
                false,
            limitValue: (limit: keyof PlanLimits) => PLANS.pro.limits[limit],
            refetch,
            // Expose the *real* tier/plan even when enforcement is off so billing
            // pages can display accurate data.
            realTier: tier,
            realPlan: plan,
        };
    }

    return {
        plan,
        tier,
        isLoading,
        subscription: subscription ?? null,
        enforcementEnabled: true,
        canUseFeature: (feature: keyof PlanFeatures): boolean =>
            plan.features[feature] ?? false,
        isAtLimit: (limit: keyof PlanLimits, currentValue: number): boolean =>
            currentValue >= (plan.limits[limit] as number),
        limitValue: (limit: keyof PlanLimits): number =>
            plan.limits[limit] as number,
        refetch,
        realTier: tier,
        realPlan: plan,
    };
}

export function isPlanEnforcementEnabled(): boolean {
    return PLAN_ENFORCEMENT_MODE;
}
