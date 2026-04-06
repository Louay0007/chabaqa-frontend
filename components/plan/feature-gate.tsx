"use client";

import { usePlan } from "@/hooks/use-plan";
import type { PlanFeatures, PlanLimits } from "@/lib/plans/plan-config";

interface FeatureGateProps {
    feature: keyof PlanFeatures;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
    const { canUseFeature, enforcementEnabled, isLoading } = usePlan();

    if (!enforcementEnabled) return <>{children}</>;
    if (isLoading) return fallback ? <>{fallback}</> : null;
    if (canUseFeature(feature)) return <>{children}</>;

    return fallback ? <>{fallback}</> : null;
}

interface LimitGateProps {
    limitKey: keyof PlanLimits;
    currentValue: number;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export function LimitGate({
    limitKey,
    currentValue,
    fallback,
    children,
}: LimitGateProps) {
    const { isAtLimit, enforcementEnabled, isLoading } = usePlan();

    if (!enforcementEnabled) return <>{children}</>;
    if (isLoading) return fallback ? <>{fallback}</> : null;
    if (isAtLimit(limitKey, currentValue))
        return fallback ? <>{fallback}</> : null;

    return <>{children}</>;
}
