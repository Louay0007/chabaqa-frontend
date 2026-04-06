"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    PLANS,
    PLAN_TIERS,
    PLAN_ICONS,
    FEATURE_LABELS,
    type PlanTier,
    type PlanFeatures,
    formatLimit,
} from "@/lib/plans/plan-config";
import { usePlan } from "@/hooks/use-plan";
import { Check, Lock, X } from "lucide-react";

interface UpgradeModalProps {
    open: boolean;
    onClose: () => void;
    requiredPlan?: PlanTier;
    blockedFeature?: string;
}

export function UpgradeModal({
    open,
    onClose,
    requiredPlan = "growth",
    blockedFeature,
}: UpgradeModalProps) {
    const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
    const { tier: currentTier } = usePlan();

    const requiredIdx = PLAN_TIERS.indexOf(requiredPlan);
    const visibleTiers = PLAN_TIERS.filter((_, i) => i >= requiredIdx);

    const currentPlan = PLANS[currentTier];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                        Upgrade Your Plan
                    </DialogTitle>
                    {blockedFeature && (
                        <DialogDescription>
                            <strong>{blockedFeature}</strong> requires the{" "}
                            <strong>{PLANS[requiredPlan].name}</strong> plan or
                            higher.
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="flex justify-center gap-2 my-4">
                    <Button
                        size="sm"
                        variant={billing === "monthly" ? "default" : "outline"}
                        onClick={() => setBilling("monthly")}
                    >
                        Monthly
                    </Button>
                    <Button
                        size="sm"
                        variant={billing === "yearly" ? "default" : "outline"}
                        onClick={() => setBilling("yearly")}
                    >
                        Yearly
                        <Badge variant="secondary" className="ml-2">
                            Save 20%
                        </Badge>
                    </Button>
                </div>

                <div
                    className={`grid gap-4 ${visibleTiers.length > 1 ? "md:grid-cols-2" : ""}`}
                >
                    {visibleTiers.map((tier) => {
                        const plan = PLANS[tier];
                        const Icon = PLAN_ICONS[tier];
                        const price =
                            billing === "yearly"
                                ? plan.yearlyMonthlyPrice
                                : plan.monthlyPrice;
                        const isHighlighted = tier === requiredPlan;

                        // Determine which features are NEW compared to the user's current plan
                        const newFeatures = new Set<keyof PlanFeatures>();
                        for (const key of Object.keys(FEATURE_LABELS) as Array<
                            keyof PlanFeatures
                        >) {
                            if (
                                !currentPlan.features[key] &&
                                plan.features[key]
                            ) {
                                newFeatures.add(key);
                            }
                        }

                        return (
                            <div
                                key={tier}
                                className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
                                    isHighlighted
                                        ? "border-primary ring-2 ring-primary/30"
                                        : "border-border"
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Icon className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold text-lg">
                                        {plan.name}
                                    </h3>
                                    {isHighlighted && (
                                        <Badge>Recommended</Badge>
                                    )}
                                </div>
                                <div className="text-3xl font-bold mb-1">
                                    {price}{" "}
                                    <span className="text-base font-normal text-muted-foreground">
                                        TND/mo
                                    </span>
                                </div>
                                {billing === "yearly" && (
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Billed {plan.yearlyTotal} TND/year
                                    </p>
                                )}

                                {/* Feature comparison list */}
                                <ul className="space-y-2 text-sm mb-4">
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                                        <span>
                                            {formatLimit(
                                                plan.limits.membersMax,
                                            )}{" "}
                                            members
                                        </span>
                                        {plan.limits.membersMax >
                                            currentPlan.limits.membersMax && (
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700"
                                            >
                                                NEW
                                            </Badge>
                                        )}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                                        <span>
                                            {plan.limits.storageGB} GB storage
                                        </span>
                                        {plan.limits.storageGB >
                                            currentPlan.limits.storageGB && (
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700"
                                            >
                                                NEW
                                            </Badge>
                                        )}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                                        <span>
                                            {plan.transactionFee}% transaction
                                            fee
                                        </span>
                                        {plan.transactionFee <
                                            currentPlan.transactionFee && (
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700"
                                            >
                                                NEW
                                            </Badge>
                                        )}
                                    </li>

                                    {/* Boolean features with NEW badges for upgrades */}
                                    {(
                                        Object.keys(FEATURE_LABELS) as Array<
                                            keyof PlanFeatures
                                        >
                                    ).map((featureKey) => {
                                        if (!plan.features[featureKey])
                                            return null;
                                        const isNew =
                                            newFeatures.has(featureKey);
                                        return (
                                            <li
                                                key={featureKey}
                                                className="flex items-center gap-2"
                                            >
                                                <Check className="h-4 w-4 text-green-500 shrink-0" />
                                                <span>
                                                    {FEATURE_LABELS[featureKey]}
                                                </span>
                                                {isNew && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700"
                                                    >
                                                        NEW
                                                    </Badge>
                                                )}
                                            </li>
                                        );
                                    })}

                                    {/* Features the user currently has but this plan doesn't */}
                                    {(
                                        Object.keys(FEATURE_LABELS) as Array<
                                            keyof PlanFeatures
                                        >
                                    ).map((featureKey) => {
                                        if (plan.features[featureKey])
                                            return null;
                                        if (!currentPlan.features[featureKey])
                                            return null;
                                        return (
                                            <li
                                                key={featureKey}
                                                className="flex items-center gap-2 text-muted-foreground"
                                            >
                                                <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                                                <span className="line-through">
                                                    {FEATURE_LABELS[featureKey]}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <Button
                                    className="w-full"
                                    variant={
                                        isHighlighted ? "default" : "outline"
                                    }
                                    onClick={() => {
                                        window.location.href = `/creator/plan/upgrade?plan=${tier}&billing=${billing}`;
                                    }}
                                >
                                    Upgrade to {plan.name}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface LockedFeatureCardProps {
    feature: string;
    requiredPlan?: PlanTier;
    description?: string;
}

export function LockedFeatureCard({
    feature,
    requiredPlan = "growth",
    description,
}: LockedFeatureCardProps) {
    const [showUpgrade, setShowUpgrade] = useState(false);

    return (
        <>
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-8 text-center">
                <Lock className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg mb-1">{feature}</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                    {description ??
                        `${feature} is available on the ${PLANS[requiredPlan].name} plan and above.`}
                </p>
                <Button variant="default" onClick={() => setShowUpgrade(true)}>
                    Upgrade to {PLANS[requiredPlan].name}
                </Button>
            </div>
            <UpgradeModal
                open={showUpgrade}
                onClose={() => setShowUpgrade(false)}
                requiredPlan={requiredPlan}
                blockedFeature={feature}
            />
        </>
    );
}
