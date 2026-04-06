"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Zap,
    Star,
    Rocket,
    Check,
    X,
    CreditCard,
    Calendar,
    AlertTriangle,
    RefreshCw,
    Loader2,
    Crown,
    Receipt,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
    subscriptionApi,
    type CreatorSubscription,
    type StorageUsageData,
    type UsageSummary,
    type CancellationFeedback,
} from "@/lib/api/subscription.api";
import {
    PLANS,
    PLAN_TIERS,
    PLAN_ICONS,
    STATUS_CONFIG,
    FEATURE_LABELS,
    CANCELLATION_REASONS,
    type PlanTier,
    type PlanFeatures,
    type CancellationReasonId,
    formatLimit,
    ADD_ONS,
    getAddonStoragePrice,
    getFeaturesLost,
    toSafeTier,
} from "@/lib/plans/plan-config";
import { usePlan } from "@/hooks/use-plan";

/* ── Upcoming invoice shape (mirrors API response) ─────────────────────── */
interface UpcomingInvoice {
    amount: number;
    currency: string;
    dueDate: string;
    planName: string;
}

/* ── UsageBar ──────────────────────────────────────────────────────────── */
function UsageBar({
    label,
    current,
    max,
    suffix = "",
}: {
    label: string;
    current: number;
    max: number;
    suffix?: string;
}) {
    const isUnlimited = max >= 999;
    const percent = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
    const isNear = percent >= 80;
    const isAt = percent >= 100;

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span
                    className={
                        isAt
                            ? "text-destructive font-medium"
                            : isNear
                              ? "text-amber-600 font-medium"
                              : ""
                    }
                >
                    {isUnlimited
                        ? `${current.toLocaleString()}${suffix} / Unlimited`
                        : `${current.toLocaleString()}${suffix} / ${formatLimit(max)}${suffix}`}
                </span>
            </div>
            {!isUnlimited && (
                <Progress
                    value={percent}
                    className={
                        isAt
                            ? "[&>div]:bg-destructive"
                            : isNear
                              ? "[&>div]:bg-amber-500"
                              : ""
                    }
                />
            )}
            {isUnlimited && <div className="h-2 rounded-full bg-green-100" />}
        </div>
    );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */
export default function MyPlanPage() {
    const router = useRouter();
    const { plan, tier, enforcementEnabled } = usePlan();

    /* ── Data state ── */
    const [sub, setSub] = useState<CreatorSubscription | null>(null);
    const [storage, setStorage] = useState<StorageUsageData | null>(null);
    const [usage, setUsage] = useState<UsageSummary | null>(null);
    const [upcomingInvoice, setUpcomingInvoice] =
        useState<UpcomingInvoice | null>(null);
    const [loading, setLoading] = useState(true);

    /* ── Action states ── */
    const [canceling, setCanceling] = useState(false);
    const [reactivating, setReactivating] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [purchasingAddon, setPurchasingAddon] = useState(false);

    /* ── Add-on confirmation dialog ── */
    const [addonDialogType, setAddonDialogType] = useState<
        "storage" | "admin_seat" | null
    >(null);

    /* ── Cancellation retention flow ── */
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelStep, setCancelStep] = useState(1);
    const [cancelReason, setCancelReason] = useState<CancellationReasonId | "">(
        "",
    );
    const [cancelComment, setCancelComment] = useState("");

    /* ── Load all data ── */
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [subRes, storageRes, usageRes, invoiceRes] =
                await Promise.allSettled([
                    subscriptionApi.getMySubscription(),
                    subscriptionApi.getStorageUsage(),
                    subscriptionApi.getUsageSummary(),
                    subscriptionApi.getUpcomingInvoice(),
                ]);
            if (subRes.status === "fulfilled") setSub(subRes.value.data);
            if (storageRes.status === "fulfilled")
                setStorage(storageRes.value.data);
            if (usageRes.status === "fulfilled") setUsage(usageRes.value.data);
            if (invoiceRes.status === "fulfilled")
                setUpcomingInvoice(invoiceRes.value.data ?? null);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    /* ── Handlers ── */

    const handleRetryPayment = async () => {
        setRetrying(true);
        try {
            const res = await subscriptionApi.retryPayment();
            if (res.data.success) {
                toast({
                    title: "Payment successful",
                    description: `Charged ${res.data.chargedAmount ?? ""} ${res.data.currency ?? "TND"}.`,
                });
                load();
            } else {
                toast({
                    title: "Payment failed",
                    description:
                        res.data.error ?? "Please update your payment method.",
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to retry payment.",
                variant: "destructive",
            });
        } finally {
            setRetrying(false);
        }
    };

    const handlePurchaseAddOn = async () => {
        if (!addonDialogType) return;
        setPurchasingAddon(true);
        try {
            const res = await subscriptionApi.purchaseAddOn({
                type: addonDialogType,
                units: 1,
            });
            toast({ title: "Add-on purchased", description: res.data.message });
            setAddonDialogType(null);
            load();
        } catch {
            toast({
                title: "Error",
                description: "Failed to purchase add-on.",
                variant: "destructive",
            });
        } finally {
            setPurchasingAddon(false);
        }
    };

    const resetCancelFlow = () => {
        setCancelStep(1);
        setCancelReason("");
        setCancelComment("");
    };

    const handleCancelDialogOpenChange = (open: boolean) => {
        setCancelDialogOpen(open);
        if (!open) resetCancelFlow();
    };

    const handleCancelConfirm = async () => {
        setCanceling(true);
        try {
            const feedback: CancellationFeedback = {
                reason: cancelReason || "other",
                ...(cancelComment.trim()
                    ? { comment: cancelComment.trim() }
                    : {}),
            };
            await subscriptionApi.cancelSubscription(feedback);
            toast({
                title: "Subscription canceled",
                description:
                    "Your subscription will end at the current period.",
            });
            setCancelDialogOpen(false);
            resetCancelFlow();
            load();
        } catch {
            toast({
                title: "Error",
                description: "Failed to cancel subscription.",
                variant: "destructive",
            });
        } finally {
            setCanceling(false);
        }
    };

    const handleReactivate = async () => {
        setReactivating(true);
        try {
            await subscriptionApi.reactivateSubscription();
            toast({
                title: "Subscription reactivated",
                description: "Your subscription will continue.",
            });
            load();
        } catch {
            toast({
                title: "Error",
                description: "Failed to reactivate.",
                variant: "destructive",
            });
        } finally {
            setReactivating(false);
        }
    };

    const handleCancelNext = () => {
        if (cancelStep === 2 && cancelReason) {
            const reason = CANCELLATION_REASONS.find(
                (r) => r.id === cancelReason,
            );
            setCancelStep(reason?.offer === "none" ? 4 : 3);
        } else {
            setCancelStep((prev) => prev + 1);
        }
    };

    const handleCancelBack = () => {
        if (cancelStep === 4) {
            const reason = CANCELLATION_REASONS.find(
                (r) => r.id === cancelReason,
            );
            setCancelStep(reason?.offer === "none" ? 2 : 3);
        } else {
            setCancelStep((prev) => prev - 1);
        }
    };

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-40 animate-pulse rounded-lg bg-muted"
                    />
                ))}
            </div>
        );
    }

    /* ── Derived values ── */
    const currentTier = toSafeTier(sub?.plan ?? tier);
    const currentPlan = PLANS[currentTier];
    const PlanIcon = PLAN_ICONS[currentTier] || Zap;
    const statusCfg =
        STATUS_CONFIG[sub?.status || "active"] || STATUS_CONFIG.active;

    const periodEnd = sub?.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
          })
        : "—";

    const featuresLost = getFeaturesLost(currentTier, "starter");
    const downgradeTier: PlanTier | null =
        currentTier === "pro"
            ? "growth"
            : currentTier === "growth"
              ? "starter"
              : null;
    const selectedCancelReason = CANCELLATION_REASONS.find(
        (r) => r.id === cancelReason,
    );

    // Session bookings — the API may return this field even if the TS type hasn't been updated yet
    const sessionBookings =
        (usage as (UsageSummary & { sessionBookingsThisMonth?: number }) | null)
            ?.sessionBookingsThisMonth ?? 0;

    return (
        <div className="space-y-6">
            {/* ── Section A — Status Card ─────────────────────────────────── */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                <PlanIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold">
                                        {currentPlan.name} Plan
                                    </h2>
                                    <Badge
                                        variant={statusCfg.variant}
                                        className={statusCfg.className}
                                    >
                                        {statusCfg.label}
                                    </Badge>
                                    {sub?.cancelAtPeriodEnd && (
                                        <Badge
                                            variant="outline"
                                            className="border-orange-400 text-orange-600"
                                        >
                                            Cancels {periodEnd}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                    {sub?.status === "trialing" &&
                                        sub.trialEndsAt && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                Trial ends{" "}
                                                {new Date(
                                                    sub.trialEndsAt,
                                                ).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        )}
                                    {sub?.status === "active" && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Renews {periodEnd}
                                        </span>
                                    )}
                                    {sub?.hasPaymentMethod && (
                                        <span className="flex items-center gap-1">
                                            <CreditCard className="h-3.5 w-3.5" />
                                            {sub.paymentBrand?.toUpperCase()}{" "}
                                            &bull;&bull;&bull;&bull;{" "}
                                            {sub.paymentLast4}
                                        </span>
                                    )}
                                    <span>
                                        {currentPlan.transactionFee}%
                                        transaction fee
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button variant="outline" size="sm" onClick={load}>
                                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                            </Button>
                            <Button
                                size="sm"
                                onClick={() =>
                                    router.push("/creator/plan/upgrade")
                                }
                            >
                                <Crown className="h-4 w-4 mr-1" /> Upgrade
                            </Button>
                        </div>
                    </div>

                    {/* past_due recovery CTA */}
                    {sub?.status === "past_due" && (
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            <div className="flex items-center gap-2 flex-1">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>
                                    Payment failed — please update your billing
                                    method to restore full access.{" "}
                                    <Link
                                        href="/creator/plan/billing/manage"
                                        className="underline font-medium hover:text-destructive/80"
                                    >
                                        Update Payment Method &rarr;
                                    </Link>
                                </span>
                            </div>
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={retrying}
                                onClick={handleRetryPayment}
                            >
                                {retrying && (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                )}
                                Retry Payment
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Upcoming Invoice Preview ────────────────────────────────── */}
            {upcomingInvoice && (
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <Receipt className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div className="text-sm">
                                <span className="font-medium">
                                    Next Invoice:
                                </span>{" "}
                                {upcomingInvoice.amount}{" "}
                                {upcomingInvoice.currency} on{" "}
                                {new Date(
                                    upcomingInvoice.dueDate,
                                ).toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                                <span className="text-muted-foreground ml-1">
                                    ({upcomingInvoice.planName})
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Section B — Usage Gauges ────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Plan Usage — {currentPlan.name}
                    </CardTitle>
                    <CardDescription>
                        Your current resource consumption vs. plan limits
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <UsageBar
                        label="Members"
                        current={usage?.membersAdded ?? 0}
                        max={currentPlan.limits.membersMax}
                    />
                    <UsageBar
                        label="Storage"
                        current={storage?.usedGB ?? 0}
                        max={currentPlan.limits.storageGB}
                        suffix=" GB"
                    />
                    <UsageBar
                        label="Active Courses"
                        current={usage?.coursesActivated ?? 0}
                        max={currentPlan.limits.coursesActivationMax}
                    />
                    <UsageBar
                        label="Admin Seats"
                        current={usage?.adminsAdded ?? 0}
                        max={currentPlan.limits.adminsMax}
                    />
                    {currentPlan.limits.emailCampaignRecipientsPerMonth > 0 && (
                        <UsageBar
                            label="Email Recipients / mo"
                            current={usage?.emailsSent ?? 0}
                            max={
                                currentPlan.limits
                                    .emailCampaignRecipientsPerMonth
                            }
                        />
                    )}
                    {currentPlan.limits.sessionBookingsPerMonth > 0 && (
                        <UsageBar
                            label="Session Bookings / mo"
                            current={sessionBookings}
                            max={currentPlan.limits.sessionBookingsPerMonth}
                        />
                    )}
                </CardContent>
            </Card>

            {/* ── Section C — Features Included ───────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Features</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        {(
                            Object.keys(
                                FEATURE_LABELS,
                            ) as (keyof PlanFeatures)[]
                        ).map((key) => {
                            const included = currentPlan.features[key];
                            return (
                                <div
                                    key={key}
                                    className="flex items-center gap-2 text-sm py-1"
                                >
                                    {included ? (
                                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                                    ) : (
                                        <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                                    )}
                                    <span
                                        className={
                                            !included
                                                ? "text-muted-foreground"
                                                : ""
                                        }
                                    >
                                        {FEATURE_LABELS[key]}
                                    </span>
                                    {!included && (
                                        <Badge
                                            variant="outline"
                                            className="text-xs ml-auto"
                                        >
                                            {PLAN_TIERS.find(
                                                (t) => PLANS[t].features[key],
                                            ) || "pro"}
                                        </Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ── Section D — Plan Comparison ─────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Compare Plans</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                                    Feature
                                </th>
                                {PLAN_TIERS.map((t) => (
                                    <th
                                        key={t}
                                        className={`text-center py-2 px-3 font-medium ${t === currentTier ? "text-primary" : ""}`}
                                    >
                                        {PLANS[t].name}
                                        {t === currentTier && (
                                            <div className="text-xs text-primary">
                                                Current
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            <tr>
                                <td className="py-2 pr-4">Monthly Price</td>
                                {PLAN_TIERS.map((t) => (
                                    <td
                                        key={t}
                                        className="text-center py-2 px-3"
                                    >
                                        {PLANS[t].monthlyPrice} TND
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Members</td>
                                {PLAN_TIERS.map((t) => (
                                    <td
                                        key={t}
                                        className="text-center py-2 px-3"
                                    >
                                        {formatLimit(
                                            PLANS[t].limits.membersMax,
                                        )}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Storage</td>
                                {PLAN_TIERS.map((t) => (
                                    <td
                                        key={t}
                                        className="text-center py-2 px-3"
                                    >
                                        {PLANS[t].limits.storageGB} GB
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Active Courses</td>
                                {PLAN_TIERS.map((t) => (
                                    <td
                                        key={t}
                                        className="text-center py-2 px-3"
                                    >
                                        {formatLimit(
                                            PLANS[t].limits
                                                .coursesActivationMax,
                                        )}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Admin Seats</td>
                                {PLAN_TIERS.map((t) => (
                                    <td
                                        key={t}
                                        className="text-center py-2 px-3"
                                    >
                                        {PLANS[t].limits.adminsMax}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Transaction Fee</td>
                                {PLAN_TIERS.map((t) => (
                                    <td
                                        key={t}
                                        className="text-center py-2 px-3"
                                    >
                                        {PLANS[t].transactionFee}%
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Challenges</td>
                                {PLAN_TIERS.map((t) => (
                                    <td
                                        key={t}
                                        className="text-center py-2 px-3"
                                    >
                                        {PLANS[t].features.challenges ? (
                                            <Check className="h-4 w-4 text-green-500 mx-auto" />
                                        ) : (
                                            <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                                        )}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Sessions</td>
                                {PLAN_TIERS.map((t) => (
                                    <td
                                        key={t}
                                        className="text-center py-2 px-3"
                                    >
                                        {PLANS[t].features.sessions ? (
                                            <Check className="h-4 w-4 text-green-500 mx-auto" />
                                        ) : (
                                            <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                                        )}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Events</td>
                                {PLAN_TIERS.map((t) => (
                                    <td
                                        key={t}
                                        className="text-center py-2 px-3"
                                    >
                                        {PLANS[t].features.events ? (
                                            <Check className="h-4 w-4 text-green-500 mx-auto" />
                                        ) : (
                                            <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                                        )}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Branding</td>
                                {PLAN_TIERS.map((t) => (
                                    <td
                                        key={t}
                                        className="text-center py-2 px-3"
                                    >
                                        {PLANS[t].features.branding ? (
                                            <Check className="h-4 w-4 text-green-500 mx-auto" />
                                        ) : (
                                            <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* ── Section E — Add-ons ─────────────────────────────────────── */}
            {currentTier !== "pro" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Available Add-ons
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-lg border p-4 flex flex-col justify-between gap-3">
                                <div>
                                    <h4 className="font-medium">
                                        Extra Admin Seat
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        +{ADD_ONS.extraAdminSeat.priceTND}{" "}
                                        TND/month per seat
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        setAddonDialogType("admin_seat")
                                    }
                                >
                                    Add Seat
                                </Button>
                            </div>
                            <div className="rounded-lg border p-4 flex flex-col justify-between gap-3">
                                <div>
                                    <h4 className="font-medium">
                                        Extra Storage
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        +{getAddonStoragePrice(currentTier)} TND
                                        per 100 GB/month
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        setAddonDialogType("storage")
                                    }
                                >
                                    Add Storage
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Add-on Confirmation Dialog ──────────────────────────────── */}
            <AlertDialog
                open={addonDialogType !== null}
                onOpenChange={(open) => {
                    if (!open && !purchasingAddon) setAddonDialogType(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {addonDialogType === "admin_seat"
                                ? "Add Extra Admin Seat"
                                : "Add Extra Storage"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {addonDialogType === "admin_seat"
                                ? `You will be charged ${ADD_ONS.extraAdminSeat.priceTND} TND/month for 1 additional admin seat. This will be added to your next invoice.`
                                : `You will be charged ${getAddonStoragePrice(currentTier)} TND/month for 100 GB of additional storage. This will be added to your next invoice.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            disabled={purchasingAddon}
                            onClick={() => setAddonDialogType(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={purchasingAddon}
                            onClick={handlePurchaseAddOn}
                        >
                            {purchasingAddon && (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            )}
                            Confirm Purchase
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Section F — Danger Zone ─────────────────────────────────── */}
            <Card className="border-destructive/30">
                <CardHeader>
                    <CardTitle className="text-base text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {sub?.cancelAtPeriodEnd ? (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <p className="font-medium">
                                    Subscription set to cancel
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Access continues until {periodEnd}.
                                    Reactivate to keep your plan.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleReactivate}
                                disabled={reactivating}
                            >
                                {reactivating ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : null}
                                Reactivate Subscription
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <p className="font-medium">
                                    Cancel Subscription
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    You will retain access until the end of the
                                    current billing period. Data is preserved
                                    for 30 days after cancellation.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setCancelDialogOpen(true)}
                            >
                                Cancel Subscription
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Cancellation Retention Dialog ───────────────────────────── */}
            <Dialog
                open={cancelDialogOpen}
                onOpenChange={handleCancelDialogOpenChange}
            >
                <DialogContent className="sm:max-w-lg">
                    {/* Step 1 — What you'll lose */}
                    {cancelStep === 1 && (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    Are you sure you want to cancel?
                                </DialogTitle>
                                <DialogDescription>
                                    Here&apos;s what you&apos;ll lose by leaving
                                    the {currentPlan.name} plan:
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 py-2">
                                {featuresLost.length > 0 ? (
                                    <ul className="space-y-1.5">
                                        {featuresLost.map((f) => (
                                            <li
                                                key={f.feature}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <X className="h-4 w-4 text-destructive shrink-0" />
                                                <span>{f.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        You are on the base plan. Canceling will
                                        remove all access at the end of your
                                        billing period.
                                    </p>
                                )}
                                <Separator className="my-3" />
                                <p className="text-sm text-muted-foreground">
                                    Your access continues until{" "}
                                    <strong>{periodEnd}</strong>. Data is
                                    preserved for 30 days.
                                </p>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setCancelDialogOpen(false)}
                                >
                                    Keep Subscription
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setCancelStep(2)}
                                >
                                    Continue
                                </Button>
                            </DialogFooter>
                        </>
                    )}

                    {/* Step 2 — Select a reason */}
                    {cancelStep === 2 && (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    Why are you canceling?
                                </DialogTitle>
                                <DialogDescription>
                                    Your feedback helps us improve Chabaqa.
                                </DialogDescription>
                            </DialogHeader>
                            <RadioGroup
                                value={cancelReason}
                                onValueChange={(v) =>
                                    setCancelReason(v as CancellationReasonId)
                                }
                                className="space-y-2 py-2"
                            >
                                {CANCELLATION_REASONS.map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex items-center space-x-2"
                                    >
                                        <RadioGroupItem
                                            value={r.id}
                                            id={`reason-${r.id}`}
                                        />
                                        <Label
                                            htmlFor={`reason-${r.id}`}
                                            className="cursor-pointer"
                                        >
                                            {r.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    variant="outline"
                                    onClick={handleCancelBack}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="destructive"
                                    disabled={!cancelReason}
                                    onClick={handleCancelNext}
                                >
                                    Next
                                </Button>
                            </DialogFooter>
                        </>
                    )}

                    {/* Step 3 — Offer alternatives based on reason */}
                    {cancelStep === 3 && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Before you go&hellip;</DialogTitle>
                                <DialogDescription>
                                    {selectedCancelReason?.offer ===
                                        "downgrade" && downgradeTier
                                        ? `You could save by switching to the ${PLANS[downgradeTier].name} plan at ${PLANS[downgradeTier].monthlyPrice} TND/month.`
                                        : selectedCancelReason?.offer ===
                                            "roadmap"
                                          ? "We're constantly improving! Let us know what features you need and we'll prioritize them."
                                          : selectedCancelReason?.offer ===
                                              "pause"
                                            ? "If you're not using your subscription right now, it'll be here when you come back. Your data stays safe."
                                            : "We appreciate your feedback and hope to see you again."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-2">
                                {selectedCancelReason?.offer === "downgrade" &&
                                    downgradeTier && (
                                        <div className="rounded-lg border p-4 space-y-2">
                                            <h4 className="font-medium">
                                                {PLANS[downgradeTier].name} Plan
                                                —{" "}
                                                {
                                                    PLANS[downgradeTier]
                                                        .monthlyPrice
                                                }{" "}
                                                TND/mo
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                Keep access to your core
                                                features at a lower price
                                                instead of losing everything.
                                            </p>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setCancelDialogOpen(false);
                                                    resetCancelFlow();
                                                    router.push(
                                                        "/creator/plan/upgrade",
                                                    );
                                                }}
                                            >
                                                Switch to{" "}
                                                {PLANS[downgradeTier].name}
                                            </Button>
                                        </div>
                                    )}
                                {selectedCancelReason?.offer === "roadmap" && (
                                    <div className="rounded-lg border p-4 space-y-2">
                                        <h4 className="font-medium">
                                            Help shape our roadmap
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Tell us which features you need in
                                            the comment on the next step and
                                            we&apos;ll take it into
                                            consideration.
                                        </p>
                                    </div>
                                )}
                                {selectedCancelReason?.offer === "pause" && (
                                    <div className="rounded-lg border p-4 space-y-2">
                                        <h4 className="font-medium">
                                            Take a break instead?
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Your subscription will keep running,
                                            but your data and settings will be
                                            right here when you&apos;re ready to
                                            come back. No action needed.
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setCancelDialogOpen(false);
                                                resetCancelFlow();
                                            }}
                                        >
                                            Keep Subscription
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    variant="outline"
                                    onClick={handleCancelBack}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setCancelStep(4)}
                                >
                                    Continue Canceling
                                </Button>
                            </DialogFooter>
                        </>
                    )}

                    {/* Step 4 — Final confirmation */}
                    {cancelStep === 4 && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Final Confirmation</DialogTitle>
                                <DialogDescription>
                                    Your {currentPlan.name} plan will remain
                                    active until {periodEnd}. After that, access
                                    to plan features will be removed.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-2">
                                <Label htmlFor="cancel-comment">
                                    Any additional feedback? (optional)
                                </Label>
                                <Textarea
                                    id="cancel-comment"
                                    placeholder="Tell us more..."
                                    value={cancelComment}
                                    onChange={(e) =>
                                        setCancelComment(e.target.value)
                                    }
                                    rows={3}
                                />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    variant="outline"
                                    onClick={handleCancelBack}
                                    disabled={canceling}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="destructive"
                                    disabled={canceling}
                                    onClick={handleCancelConfirm}
                                >
                                    {canceling && (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    )}
                                    Confirm Cancellation
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
