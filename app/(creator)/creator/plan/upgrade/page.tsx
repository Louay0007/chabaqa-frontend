"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Check,
    ArrowLeft,
    CreditCard,
    Loader2,
    AlertTriangle,
    Info,
    X,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { subscriptionApi } from "@/lib/api/subscription.api";
import type { UpgradePreview } from "@/lib/api/subscription.api";
import {
    PLANS,
    PLAN_TIERS,
    PLAN_ICONS,
    type PlanTier,
    type BillingInterval,
    formatLimit,
    getFeaturesLost,
    saveBillingPreference,
    loadBillingPreference,
} from "@/lib/plans/plan-config";
import { usePlan } from "@/hooks/use-plan";

export default function UpgradePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { tier: currentTier, subscription } = usePlan();

    const preselectedPlan = searchParams.get("plan") as PlanTier | null;
    const preselectedBilling = searchParams.get(
        "billing",
    ) as BillingInterval | null;

    const [billing, setBilling] = useState<BillingInterval>(
        preselectedBilling || "yearly",
    );
    const [selectedTier, setSelectedTier] = useState<PlanTier | null>(
        preselectedPlan,
    );
    const [upgrading, setUpgrading] = useState(false);

    // Downgrade dialog state
    const [downgradeTier, setDowngradeTier] = useState<PlanTier | null>(null);
    const [downgrading, setDowngrading] = useState(false);

    // Proration preview state
    const [preview, setPreview] = useState<UpgradePreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState(false);

    // Initialize billing preference from localStorage (only when URL params don't override)
    useEffect(() => {
        if (!preselectedBilling) {
            setBilling(loadBillingPreference());
        }
    }, [preselectedBilling]);

    // Persist billing preference whenever it changes
    const handleBillingChange = (newBilling: BillingInterval) => {
        setBilling(newBilling);
        saveBillingPreference(newBilling);
    };

    // Fetch proration preview when a tier is selected for upgrade
    useEffect(() => {
        if (!selectedTier) {
            setPreview(null);
            setPreviewLoading(false);
            setPreviewError(false);
            return;
        }

        let cancelled = false;
        const fetchPreview = async () => {
            setPreviewLoading(true);
            setPreviewError(false);
            setPreview(null);
            try {
                const interval =
                    billing === "yearly"
                        ? ("year" as const)
                        : ("month" as const);
                const res = await subscriptionApi.getUpgradePreview(
                    selectedTier as any,
                    interval,
                );
                if (!cancelled && res?.data) {
                    setPreview(res.data);
                }
            } catch {
                if (!cancelled) {
                    setPreviewError(true);
                }
            } finally {
                if (!cancelled) {
                    setPreviewLoading(false);
                }
            }
        };

        fetchPreview();
        return () => {
            cancelled = true;
        };
    }, [selectedTier, billing]);

    const handleUpgrade = async (tier: PlanTier) => {
        setUpgrading(true);
        try {
            const billingInterval =
                billing === "yearly" ? ("year" as const) : ("month" as const);

            // If has payment method, try direct upgrade
            if (subscription?.hasPaymentMethod) {
                await subscriptionApi.upgradePlan({
                    tier: tier as any,
                    billingInterval,
                });
                await queryClient.invalidateQueries({
                    queryKey: ["my-subscription"],
                });
                toast({
                    title: "Plan upgraded!",
                    description: `You are now on the ${PLANS[tier].name} plan.`,
                });
                router.push("/creator/plan");
            } else {
                // Redirect to payment
                try {
                    const res = await subscriptionApi.initKonnectPayment(
                        tier as any,
                    );
                    if (res?.data?.paymentUrl) {
                        window.location.href = res.data.paymentUrl;
                        return;
                    }
                } catch {
                    // Fallback to Stripe
                }
                try {
                    const res = await subscriptionApi.initStripePayment(
                        tier as any,
                        billingInterval,
                    );
                    if (res?.data?.url) {
                        window.location.href = res.data.url;
                        return;
                    }
                } catch {
                    // fallback
                }
                toast({
                    title: "Payment setup required",
                    description: "Please contact support to set up billing.",
                    variant: "destructive",
                });
            }
        } catch (err: any) {
            toast({
                title: "Upgrade failed",
                description: err?.message || "Please try again.",
                variant: "destructive",
            });
        } finally {
            setUpgrading(false);
        }
    };

    const handleDowngrade = async () => {
        if (!downgradeTier) return;
        setDowngrading(true);
        try {
            await subscriptionApi.downgradePlan({ tier: downgradeTier as any });
            await queryClient.invalidateQueries({
                queryKey: ["my-subscription"],
            });
            toast({
                title: "Downgrade scheduled",
                description: `Your plan will change to ${PLANS[downgradeTier].name} at the end of your current billing period.`,
            });
            setDowngradeTier(null);
            router.push("/creator/plan");
        } catch (err: any) {
            toast({
                title: "Downgrade failed",
                description: err?.message || "Please try again.",
                variant: "destructive",
            });
        } finally {
            setDowngrading(false);
        }
    };

    const currentIdx = PLAN_TIERS.indexOf(currentTier);
    const isTrialing = subscription?.status === "trialing";

    // Compute features lost for the downgrade dialog
    const featuresLost = downgradeTier
        ? getFeaturesLost(currentTier, downgradeTier)
        : [];

    // Show confirmation view when a plan is selected for upgrade
    if (selectedTier) {
        const targetPlan = PLANS[selectedTier];
        const price =
            billing === "yearly"
                ? targetPlan.yearlyMonthlyPrice
                : targetPlan.monthlyPrice;
        const Icon = PLAN_ICONS[selectedTier];

        return (
            <div className="max-w-lg mx-auto space-y-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTier(null)}
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Plans
                </Button>

                <Card>
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                                <Icon className="h-7 w-7 text-primary" />
                            </div>
                        </div>
                        <CardTitle>Upgrade to {targetPlan.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Trial warning */}
                        {isTrialing && (
                            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>
                                    Upgrading will end your free trial and start
                                    billing immediately.
                                </span>
                            </div>
                        )}

                        <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Plan
                                </span>
                                <span className="font-medium">
                                    {targetPlan.name}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Billing
                                </span>
                                <span className="font-medium">
                                    {billing === "yearly"
                                        ? "Yearly"
                                        : "Monthly"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Amount
                                </span>
                                <span className="font-medium">
                                    {price} TND / month
                                </span>
                            </div>
                            {billing === "yearly" && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Annual Total
                                    </span>
                                    <span className="font-medium">
                                        {targetPlan.yearlyTotal} TND / year
                                    </span>
                                </div>
                            )}
                            {subscription?.hasPaymentMethod && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Payment
                                    </span>
                                    <span className="flex items-center gap-1 font-medium">
                                        <CreditCard className="h-3.5 w-3.5" />
                                        {subscription.paymentBrand?.toUpperCase()}{" "}
                                        •••• {subscription.paymentLast4}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Proration preview section */}
                        <div className="rounded-lg border p-4 space-y-2">
                            <p className="text-sm font-medium">
                                Payment Summary
                            </p>
                            {previewLoading ? (
                                <div className="flex items-center justify-center py-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        Calculating proration…
                                    </span>
                                </div>
                            ) : preview ? (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Charge today (prorated)
                                        </span>
                                        <span className="font-medium">
                                            {preview.chargeToday}{" "}
                                            {preview.currency}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Then {preview.nextInvoiceAmount}{" "}
                                            {preview.currency}/
                                            {preview.billingInterval === "year"
                                                ? "year"
                                                : "month"}{" "}
                                            starting{" "}
                                            {new Date(
                                                preview.nextInvoiceDate,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </>
                            ) : previewError ? (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Estimated price
                                    </span>
                                    <span className="font-medium">
                                        {billing === "yearly"
                                            ? targetPlan.yearlyTotal
                                            : price}{" "}
                                        TND /{" "}
                                        {billing === "yearly"
                                            ? "year"
                                            : "month"}
                                    </span>
                                </div>
                            ) : null}
                        </div>

                        <Button
                            className="w-full"
                            size="lg"
                            disabled={upgrading}
                            onClick={() => handleUpgrade(selectedTier)}
                        >
                            {upgrading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            {subscription?.hasPaymentMethod
                                ? "Confirm Upgrade"
                                : "Continue to Payment"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Trial indicator banner */}
            {isTrialing && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                        You are currently on a free trial. Upgrading will end
                        your trial and start billing immediately.
                    </span>
                </div>
            )}

            {/* Billing Toggle */}
            <div className="flex justify-center gap-2">
                <Button
                    size="sm"
                    variant={billing === "monthly" ? "default" : "outline"}
                    onClick={() => handleBillingChange("monthly")}
                >
                    Monthly
                </Button>
                <Button
                    size="sm"
                    variant={billing === "yearly" ? "default" : "outline"}
                    onClick={() => handleBillingChange("yearly")}
                >
                    Yearly
                    <Badge variant="secondary" className="ml-2">
                        Save 20%
                    </Badge>
                </Button>
            </div>

            {/* Plan Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {PLAN_TIERS.map((t, idx) => {
                    const p = PLANS[t];
                    const Icon = PLAN_ICONS[t];
                    const price =
                        billing === "yearly"
                            ? p.yearlyMonthlyPrice
                            : p.monthlyPrice;
                    const isCurrent = t === currentTier;
                    const isDowngrade = idx < currentIdx;
                    const isHighlighted = p.highlight;

                    return (
                        <Card
                            key={t}
                            className={`relative transition-shadow hover:shadow-md ${
                                isHighlighted
                                    ? "border-primary ring-2 ring-primary/20"
                                    : ""
                            } ${isCurrent ? "border-primary/50 bg-primary/5" : ""}`}
                        >
                            {isHighlighted && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge>Most Popular</Badge>
                                </div>
                            )}
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold text-lg">
                                        {p.name}
                                    </h3>
                                    {isCurrent && (
                                        <Badge variant="secondary">
                                            Current
                                        </Badge>
                                    )}
                                </div>

                                <div>
                                    <span className="text-3xl font-bold">
                                        {price}
                                    </span>
                                    <span className="text-muted-foreground ml-1">
                                        TND/mo
                                    </span>
                                    {billing === "yearly" && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Billed {p.yearlyTotal} TND/year
                                        </p>
                                    )}
                                </div>

                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                                        {formatLimit(p.limits.membersMax)}{" "}
                                        members
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                                        {p.limits.storageGB} GB storage
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                                        {p.transactionFee}% transaction fee
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                                        {p.limits.adminsMax} admin seats
                                    </li>
                                    {p.features.challenges && (
                                        <li className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                                            Challenges
                                        </li>
                                    )}
                                    {p.features.sessions && (
                                        <li className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                                            1:1 Sessions
                                        </li>
                                    )}
                                    {p.features.events && (
                                        <li className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                                            Events
                                        </li>
                                    )}
                                    {p.features.branding && (
                                        <li className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                                            Remove Branding
                                        </li>
                                    )}
                                    {p.features.gamification && (
                                        <li className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                                            Gamification
                                        </li>
                                    )}
                                </ul>

                                {isCurrent ? (
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        disabled
                                    >
                                        Current Plan
                                    </Button>
                                ) : isDowngrade ? (
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => setDowngradeTier(t)}
                                    >
                                        Downgrade to {p.name}
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        variant={
                                            isHighlighted
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() => setSelectedTier(t)}
                                    >
                                        Upgrade to {p.name}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Downgrade Warning Dialog */}
            <AlertDialog
                open={downgradeTier !== null}
                onOpenChange={(open) => {
                    if (!open) setDowngradeTier(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Downgrade to{" "}
                            {downgradeTier ? PLANS[downgradeTier].name : ""}?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                {featuresLost.length > 0 && (
                                    <div>
                                        <p className="font-medium text-foreground mb-1">
                                            You will lose access to:
                                        </p>
                                        <ul className="space-y-1">
                                            {featuresLost.map((f) => (
                                                <li
                                                    key={f.feature}
                                                    className="flex items-center gap-2 text-sm"
                                                >
                                                    <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                                    {f.label}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {subscription?.currentPeriodEnd && (
                                    <p className="text-sm text-muted-foreground">
                                        Takes effect at end of billing period on{" "}
                                        <span className="font-medium text-foreground">
                                            {new Date(
                                                subscription.currentPeriodEnd,
                                            ).toLocaleDateString()}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={downgrading}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDowngrade();
                            }}
                            disabled={downgrading}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {downgrading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Confirm Downgrade
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
