"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    useDashboard,
    DashboardShell,
    DashboardSection,
    DashboardLoading,
    DashboardUnauthorized,
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Zap,
    Star,
    Rocket,
    CreditCard,
    Calendar,
    AlertTriangle,
    Check,
    ArrowUpRight,
    Shield,
    RefreshCw,
    Receipt,
    Loader2,
    Play,
} from "lucide-react";
import Link from "next/link";
import {
    subscriptionApi,
    PlanTier as ApiPlanTier,
    SubscriptionStatus,
    type CreatorSubscription,
    type Invoice,
} from "@/lib/api/subscription.api";
import {
    PLANS,
    PLAN_TIERS,
    TIER_THEMES,
    STATUS_CONFIG,
    type PlanTier,
    formatLimit,
} from "@/lib/plans/plan-config";
import { usePlan } from "@/hooks/use-plan";
import { UsageSummary } from "@/components/plan/usage-indicator";
import { useToast } from "@/components/ui/use-toast";

// ── Page ─────────────────────────────────────────────────────────────

export default function SubscriptionManagementPage() {
    const {
        role,
        can,
        isLoading: dashLoading,
        canAccessDashboard,
        getDashboardPath,
    } = useDashboard();

    const { toast } = useToast();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { plan, tier, enforcementEnabled } = usePlan();
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [selectedUpgradeTier, setSelectedUpgradeTier] =
        useState<PlanTier>("growth");
    const [isStartingTrial, setIsStartingTrial] = useState(false);

    // ── Queries ──────────────────────────────────────────────────────

    const { data: subscription, isLoading: subLoading } = useQuery({
        queryKey: ["my-subscription"],
        queryFn: async () => {
            try {
                const res = await subscriptionApi.getMySubscription();
                return res.data ?? null;
            } catch {
                return null;
            }
        },
        staleTime: 30_000,
    });

    const { data: usageData } = useQuery({
        queryKey: ["my-usage"],
        queryFn: async () => {
            try {
                const res = await subscriptionApi.getUsageSummary();
                return res.data ?? null;
            } catch {
                return null;
            }
        },
        staleTime: 60_000,
    });

    const { data: invoices } = useQuery({
        queryKey: ["my-invoices"],
        queryFn: async () => {
            try {
                const res = await subscriptionApi.getInvoices({ limit: 10 });
                return res.data ?? [];
            } catch {
                return [];
            }
        },
        staleTime: 120_000,
    });

    // ── Mutations ────────────────────────────────────────────────────

    const cancelMutation = useMutation({
        mutationFn: () => subscriptionApi.cancelSubscription(),
        onSuccess: () => {
            toast({
                title: "Subscription scheduled for cancellation",
                description:
                    "Your access continues until the end of the billing period.",
            });
            queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
            setShowCancelDialog(false);
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to cancel subscription. Please try again.",
                variant: "destructive",
            });
        },
    });

    const upgradeMutation = useMutation({
        mutationFn: (newTier: PlanTier) => {
            // If no payment method on file, redirect to add one first
            if (!subscription?.hasPaymentMethod) {
                router.push(
                    `/creator/plan/billing/add-card?then=upgrade&plan=${newTier}`,
                );
                return Promise.resolve(
                    null as unknown as Awaited<
                        ReturnType<typeof subscriptionApi.upgradePlan>
                    >,
                );
            }
            return subscriptionApi.upgradePlan({
                tier: newTier as unknown as ApiPlanTier,
            });
        },
        onSuccess: (_data, newTier) => {
            // If we redirected, no toast needed
            if (!subscription?.hasPaymentMethod) return;
            toast({
                title: "Plan upgraded!",
                description: "Your new plan is now active.",
            });
            queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
            setShowUpgradeDialog(false);
        },
        onError: () => {
            toast({
                title: "Upgrade failed",
                description: "Please try again or contact support.",
                variant: "destructive",
            });
        },
    });

    // ── Render guards ────────────────────────────────────────────────

    if (dashLoading || subLoading) return <DashboardLoading />;
    if (
        !canAccessDashboard ||
        !can(CommunityPermission.COMMUNITY_MANAGE_SETTINGS)
    ) {
        return <DashboardUnauthorized />;
    }

    const sub = subscription as CreatorSubscription | null;
    const currentTier: PlanTier = (sub?.plan as PlanTier) ?? "starter";
    const tierInfo = TIER_THEMES[currentTier] ?? TIER_THEMES.starter;
    const TierIcon = tierInfo.icon;
    const statusInfo =
        STATUS_CONFIG[sub?.status ?? "incomplete"] ?? STATUS_CONFIG.incomplete;

    // ── Start trial handler (for empty-state) ────────────────────────
    const handleStartTrial = async () => {
        setIsStartingTrial(true);
        try {
            await subscriptionApi.startTrial();
            toast({
                title: "Trial started!",
                description: "Your 7-day free trial is now active.",
            });
            queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
        } catch {
            toast({
                title: "Error",
                description: "Failed to start trial. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsStartingTrial(false);
        }
    };

    const currentPeriodEnd = sub?.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd)
        : null;
    const trialEndsAt = sub?.trialEndsAt ? new Date(sub.trialEndsAt) : null;
    const isTrialing = sub?.status === SubscriptionStatus.TRIALING;
    const isCanceled = sub?.cancelAtPeriodEnd;

    return (
        <DashboardShell variant="admin">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href={getDashboardPath("admin")}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">
                        Subscription & Billing
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Manage your plan, billing, and usage
                    </p>
                </div>
            </div>

            {/* No subscription state */}
            {!sub && (
                <Card className="text-center py-12">
                    <CardContent>
                        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                            No Active Subscription
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Choose a plan to start creating and monetizing your
                            community.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Button
                                size="lg"
                                onClick={handleStartTrial}
                                disabled={isStartingTrial}
                            >
                                {isStartingTrial ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Starting…
                                    </>
                                ) : (
                                    <>
                                        <Play className="mr-2 h-4 w-4" />
                                        Start Free Trial
                                    </>
                                )}
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <Link href="/pricing">View Plans</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Active subscription */}
            {sub && (
                <div className="space-y-6">
                    {/* Current Plan Card */}
                    <DashboardSection title="Current Plan">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`p-3 rounded-xl ${tierInfo.bg}`}
                                        >
                                            <TierIcon
                                                className={`h-6 w-6 ${tierInfo.color}`}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold">
                                                    {PLANS[currentTier]?.name ??
                                                        currentTier}{" "}
                                                    Plan
                                                </h3>
                                                <Badge
                                                    variant={statusInfo.variant}
                                                >
                                                    {statusInfo.label}
                                                </Badge>
                                                {isCanceled && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-amber-600 border-amber-300"
                                                    >
                                                        Cancels at period end
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                                {isTrialing && trialEndsAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        Trial ends{" "}
                                                        {trialEndsAt.toLocaleDateString()}
                                                    </span>
                                                )}
                                                {currentPeriodEnd && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {isCanceled
                                                            ? "Access until"
                                                            : "Next billing"}
                                                        :{" "}
                                                        {currentPeriodEnd.toLocaleDateString()}
                                                    </span>
                                                )}
                                                {sub.paymentLast4 && (
                                                    <span className="flex items-center gap-1">
                                                        <CreditCard className="h-3.5 w-3.5" />
                                                        {sub.paymentBrand ??
                                                            "Card"}{" "}
                                                        •••• {sub.paymentLast4}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {currentTier !== "pro" && (
                                            <Button
                                                onClick={() => {
                                                    setSelectedUpgradeTier(
                                                        currentTier ===
                                                            "starter"
                                                            ? "growth"
                                                            : "pro",
                                                    );
                                                    setShowUpgradeDialog(true);
                                                }}
                                            >
                                                <ArrowUpRight className="mr-1 h-4 w-4" />
                                                Upgrade
                                            </Button>
                                        )}
                                        {!isCanceled &&
                                            sub.status !==
                                                SubscriptionStatus.CANCELED && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        setShowCancelDialog(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                    </div>
                                </div>

                                {/* Plan highlights */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t">
                                    <MiniStat
                                        label="Members"
                                        value={formatLimit(
                                            plan.limits.membersMax,
                                        )}
                                    />
                                    <MiniStat
                                        label="Storage"
                                        value={`${plan.limits.storageGB} GB`}
                                    />
                                    <MiniStat
                                        label="Transaction Fee"
                                        value={`${plan.transactionFee}%`}
                                    />
                                    <MiniStat
                                        label="Admin Seats"
                                        value={String(plan.limits.adminsMax)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </DashboardSection>

                    {/* Usage */}
                    {enforcementEnabled && (
                        <DashboardSection title="Usage">
                            <UsageSummary
                                memberCount={usageData?.membersAdded ?? 0}
                                storageUsedGB={usageData?.storageUsedGB ?? 0}
                                adminCount={usageData?.adminsAdded ?? 0}
                                activeCourseCount={
                                    usageData?.coursesActivated ?? 0
                                }
                                emailsSentThisMonth={usageData?.emailsSent ?? 0}
                                sessionBookingsThisMonth={0}
                            />
                        </DashboardSection>
                    )}

                    {/* Plan Comparison (quick) */}
                    {currentTier !== "pro" && (
                        <DashboardSection title="Upgrade Options">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {PLAN_TIERS.filter(
                                    (t) =>
                                        PLAN_TIERS.indexOf(t) >
                                        PLAN_TIERS.indexOf(currentTier),
                                ).map((t) => {
                                    const p = PLANS[t];
                                    const I = TIER_THEMES[t].icon;
                                    return (
                                        <Card
                                            key={t}
                                            className="hover:shadow-md transition-shadow"
                                        >
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <I
                                                        className={`h-5 w-5 ${TIER_THEMES[t].color}`}
                                                    />
                                                    <CardTitle className="text-lg">
                                                        {p.name}
                                                    </CardTitle>
                                                </div>
                                                <CardDescription>
                                                    {p.monthlyPrice} TND/mo ·{" "}
                                                    {p.transactionFee}% fee ·{" "}
                                                    {formatLimit(
                                                        p.limits.membersMax,
                                                    )}{" "}
                                                    members
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-1.5 text-sm mb-4">
                                                    {p.features.challenges &&
                                                        !PLANS[currentTier]
                                                            .features
                                                            .challenges && (
                                                            <li className="flex items-center gap-2">
                                                                <Check className="h-4 w-4 text-green-500" />
                                                                <span>
                                                                    Challenges
                                                                </span>
                                                            </li>
                                                        )}
                                                    {p.features.events &&
                                                        !PLANS[currentTier]
                                                            .features
                                                            .events && (
                                                            <li className="flex items-center gap-2">
                                                                <Check className="h-4 w-4 text-green-500" />
                                                                <span>
                                                                    Events
                                                                </span>
                                                            </li>
                                                        )}
                                                    {p.features.sessions &&
                                                        !PLANS[currentTier]
                                                            .features
                                                            .sessions && (
                                                            <li className="flex items-center gap-2">
                                                                <Check className="h-4 w-4 text-green-500" />
                                                                <span>
                                                                    1:1 Sessions
                                                                </span>
                                                            </li>
                                                        )}
                                                    {p.limits.storageGB >
                                                        PLANS[currentTier]
                                                            .limits
                                                            .storageGB && (
                                                        <li className="flex items-center gap-2">
                                                            <Check className="h-4 w-4 text-green-500" />
                                                            <span>
                                                                {
                                                                    p.limits
                                                                        .storageGB
                                                                }{" "}
                                                                GB storage (up
                                                                from{" "}
                                                                {
                                                                    PLANS[
                                                                        currentTier
                                                                    ].limits
                                                                        .storageGB
                                                                }{" "}
                                                                GB)
                                                            </span>
                                                        </li>
                                                    )}
                                                    {p.features.branding &&
                                                        !PLANS[currentTier]
                                                            .features
                                                            .branding && (
                                                            <li className="flex items-center gap-2">
                                                                <Check className="h-4 w-4 text-green-500" />
                                                                <span>
                                                                    Remove
                                                                    Chabaqa
                                                                    branding
                                                                </span>
                                                            </li>
                                                        )}
                                                </ul>
                                                <Button
                                                    className="w-full"
                                                    onClick={() => {
                                                        setSelectedUpgradeTier(
                                                            t,
                                                        );
                                                        setShowUpgradeDialog(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    Upgrade to {p.name}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </DashboardSection>
                    )}

                    {/* Invoices */}
                    <DashboardSection title="Billing History">
                        {(Array.isArray(invoices) ? invoices : []).length >
                        0 ? (
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-muted-foreground">
                                                    <th className="py-2 px-3 text-left font-medium">
                                                        Invoice
                                                    </th>
                                                    <th className="py-2 px-3 text-left font-medium">
                                                        Date
                                                    </th>
                                                    <th className="py-2 px-3 text-right font-medium">
                                                        Amount
                                                    </th>
                                                    <th className="py-2 px-3 text-center font-medium">
                                                        Status
                                                    </th>
                                                    <th className="py-2 px-3 text-right font-medium">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(Array.isArray(invoices)
                                                    ? (invoices as Invoice[])
                                                    : []
                                                ).map((inv) => (
                                                    <tr
                                                        key={inv.id}
                                                        className="border-b last:border-0"
                                                    >
                                                        <td className="py-2.5 px-3 font-mono text-xs">
                                                            {inv.invoiceNumber ??
                                                                inv.id.slice(
                                                                    -8,
                                                                )}
                                                        </td>
                                                        <td className="py-2.5 px-3">
                                                            {new Date(
                                                                inv.invoiceDate ??
                                                                    inv.createdAt,
                                                            ).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right font-medium">
                                                            {inv.total}{" "}
                                                            {inv.currency}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            <Badge
                                                                variant={
                                                                    inv.status ===
                                                                    "paid"
                                                                        ? "default"
                                                                        : inv.status ===
                                                                            "open"
                                                                          ? "secondary"
                                                                          : "outline"
                                                                }
                                                            >
                                                                {inv.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            {inv.invoicePdfUrl && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    asChild
                                                                >
                                                                    <a
                                                                        href={
                                                                            inv.invoicePdfUrl
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <Receipt className="h-3.5 w-3.5 mr-1" />
                                                                        PDF
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* View full billing link */}
                                    <div className="mt-4 pt-3 border-t text-center">
                                        <Button
                                            variant="link"
                                            asChild
                                            className="text-sm"
                                        >
                                            <Link href="/creator/plan/invoices">
                                                View all invoices →
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="py-8 text-center">
                                <CardContent>
                                    <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">
                                        No invoices yet
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </DashboardSection>
                </div>
            )}

            {/* Cancel Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Cancel Subscription
                        </DialogTitle>
                        <DialogDescription>
                            Your subscription will remain active until the end
                            of the current billing period
                            {currentPeriodEnd && (
                                <> ({currentPeriodEnd.toLocaleDateString()})</>
                            )}
                            . After that, you{"'"}ll lose access to plan
                            features.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowCancelDialog(false)}
                        >
                            Keep Subscription
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => cancelMutation.mutate()}
                            disabled={cancelMutation.isPending}
                        >
                            {cancelMutation.isPending ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                "Confirm Cancellation"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upgrade Dialog */}
            <Dialog
                open={showUpgradeDialog}
                onOpenChange={setShowUpgradeDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Upgrade to {PLANS[selectedUpgradeTier]?.name}
                        </DialogTitle>
                        <DialogDescription>
                            You{"'"}ll be upgraded immediately and charged the
                            prorated difference for the remainder of this
                            billing period.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                New plan
                            </span>
                            <span className="font-medium">
                                {PLANS[selectedUpgradeTier]?.name}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Monthly price
                            </span>
                            <span className="font-medium">
                                {PLANS[selectedUpgradeTier]?.monthlyPrice}{" "}
                                TND/mo
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Transaction fee
                            </span>
                            <span className="font-medium">
                                {PLANS[selectedUpgradeTier]?.transactionFee}%
                            </span>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowUpgradeDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() =>
                                upgradeMutation.mutate(selectedUpgradeTier)
                            }
                            disabled={upgradeMutation.isPending}
                        >
                            {upgradeMutation.isPending ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Upgrading...
                                </>
                            ) : (
                                `Upgrade to ${PLANS[selectedUpgradeTier]?.name}`
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardShell>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
        </div>
    );
}
