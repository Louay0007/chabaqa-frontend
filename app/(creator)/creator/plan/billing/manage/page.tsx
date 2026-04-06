"use client";

import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Trash2, Star, Plus, Loader2, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
    paymentMethodApi,
    SavedPaymentMethod,
} from "@/lib/api/subscription.api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePlan } from "@/hooks/use-plan";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Helper: brand-specific card icon                                   */
/* ------------------------------------------------------------------ */
function getCardBrandIcon(brand?: string): React.ReactNode {
    const b = brand?.toLowerCase();

    if (b === "visa") {
        return (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <span className="text-[10px] font-bold italic tracking-tight">
                    VISA
                </span>
            </div>
        );
    }

    if (b === "mastercard") {
        return (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                <span className="text-[10px] font-bold tracking-tight">MC</span>
            </div>
        );
    }

    if (b === "amex") {
        return (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                <span className="text-[9px] font-bold tracking-tight">
                    AMEX
                </span>
            </div>
        );
    }

    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-400 text-white">
            <CreditCard className="h-5 w-5" />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Helper: expiry badge (expired / expiring soon)                     */
/* ------------------------------------------------------------------ */
function getExpiryBadge(expMonth?: number, expYear?: number): React.ReactNode {
    if (!expMonth || !expYear) return null;

    const now = new Date();
    // Last day of the card's expiry month (day 0 of the next month)
    const expiryDate = new Date(expYear, expMonth, 0);

    if (expiryDate < now) {
        return (
            <Badge variant="destructive" className="ml-2 text-xs">
                Expired
            </Badge>
        );
    }

    const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    if (expiryDate <= thirtyDaysFromNow) {
        return (
            <Badge
                variant="outline"
                className="ml-2 border-amber-500 bg-amber-50 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-400"
            >
                Expiring soon
            </Badge>
        );
    }

    return null;
}

/* ------------------------------------------------------------------ */
/*  Helper: human-readable brand label                                 */
/* ------------------------------------------------------------------ */
function brandLabel(brand?: string): string {
    const b = brand?.toLowerCase();
    if (b === "visa") return "VISA";
    if (b === "mastercard") return "Mastercard";
    if (b === "amex") return "Amex";
    return brand?.toUpperCase() || "Card";
}

/* ================================================================== */
/*  Page component                                                     */
/* ================================================================== */
export default function ManageBillingPage() {
    const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    // Separate loading states so set-default and remove never interfere
    const [settingDefaultId, setSettingDefaultId] = useState<string | null>(
        null,
    );
    const [removingId, setRemovingId] = useState<string | null>(null);

    const { subscription } = usePlan();

    const hasActiveSubscription =
        !!subscription &&
        (subscription.status === "active" ||
            subscription.status === "trialing" ||
            subscription.status === "past_due");

    /* ---- data fetching ---- */
    const load = async () => {
        setLoading(true);
        try {
            const data = await paymentMethodApi.list();
            setMethods(Array.isArray(data) ? data : []);
        } catch {
            toast({
                title: "Error",
                description: "Failed to load payment methods.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---- actions ---- */
    const handleSetDefault = async (pmId: string) => {
        setSettingDefaultId(pmId);
        try {
            await paymentMethodApi.setDefault(pmId);
            toast({ title: "Default updated" });
            await load();
        } catch {
            toast({
                title: "Error",
                description: "Failed to update default card.",
                variant: "destructive",
            });
        } finally {
            setSettingDefaultId(null);
        }
    };

    const handleRemove = async (pmId: string) => {
        setRemovingId(pmId);
        try {
            await paymentMethodApi.remove(pmId);
            toast({ title: "Card removed" });
            await load();
        } catch {
            toast({
                title: "Error",
                description: "Failed to remove card.",
                variant: "destructive",
            });
        } finally {
            setRemovingId(null);
        }
    };

    /* ---- subscription match ---- */
    const isCardUsedForSubscription = (m: SavedPaymentMethod): boolean => {
        if (!subscription) return false;
        return (
            !!m.last4 &&
            !!m.brand &&
            subscription.paymentLast4 === m.last4 &&
            subscription.paymentBrand?.toLowerCase() === m.brand.toLowerCase()
        );
    };

    /* ---- loading skeleton ---- */
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-20 animate-pulse rounded-lg bg-muted" />
                <div className="h-40 animate-pulse rounded-lg bg-muted" />
            </div>
        );
    }

    /* ---- empty state ---- */
    if (methods.length === 0) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="h-5 w-5" /> Payment Methods
                        </CardTitle>
                        <CardDescription>
                            Manage your saved payment methods for Chabaqa
                            subscription billing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <CreditCard className="mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="font-medium">
                                No payment methods saved
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Add a card to enable automatic billing.
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/creator/plan/billing/add-card">
                                    <Plus className="mr-2 h-4 w-4" /> Add
                                    Payment Method
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    /* ---- main list ---- */
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <CreditCard className="h-5 w-5" /> Payment Methods
                    </CardTitle>
                    <CardDescription>
                        Manage your saved payment methods for Chabaqa
                        subscription billing.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {methods.map((m) => {
                        const isOnlyCard = methods.length === 1;
                        const isSettingDefault = settingDefaultId === m.id;
                        const isRemoving = removingId === m.id;
                        const isBusy = isSettingDefault || isRemoving;
                        const usedForSubscription =
                            isCardUsedForSubscription(m);

                        return (
                            <div
                                key={m.id}
                                className="flex items-center justify-between rounded-lg border p-4"
                            >
                                {/* Left side: icon + card info */}
                                <div className="flex items-center gap-3">
                                    {getCardBrandIcon(m.brand)}
                                    <div>
                                        <p className="flex flex-wrap items-center gap-1 font-medium">
                                            {brandLabel(m.brand)} •••• {m.last4}
                                            {m.isDefault && (
                                                <Badge
                                                    variant="default"
                                                    className="ml-1 text-xs"
                                                >
                                                    Default
                                                </Badge>
                                            )}
                                            {usedForSubscription && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-1 text-xs"
                                                >
                                                    Active for billing
                                                </Badge>
                                            )}
                                        </p>
                                        {m.expMonth != null &&
                                            m.expYear != null && (
                                                <p className="flex items-center text-sm text-muted-foreground">
                                                    Expires{" "}
                                                    {String(
                                                        m.expMonth,
                                                    ).padStart(2, "0")}
                                                    /{m.expYear}
                                                    {getExpiryBadge(
                                                        m.expMonth,
                                                        m.expYear,
                                                    )}
                                                </p>
                                            )}
                                    </div>
                                </div>

                                {/* Right side: actions */}
                                <div className="flex items-center gap-2">
                                    {!m.isDefault && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isBusy}
                                            onClick={() =>
                                                handleSetDefault(m.id)
                                            }
                                        >
                                            {isSettingDefault ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Star className="mr-1 h-4 w-4" />{" "}
                                                    Set Default
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {/* Delete with confirmation dialog */}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={isBusy}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                {isRemoving ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Remove Payment Method
                                                </AlertDialogTitle>
                                                <AlertDialogDescription asChild>
                                                    <div className="space-y-2">
                                                        <p>
                                                            Are you sure you
                                                            want to remove{" "}
                                                            {brandLabel(
                                                                m.brand,
                                                            )}{" "}
                                                            •••• {m.last4}?
                                                        </p>
                                                        {isOnlyCard &&
                                                            hasActiveSubscription && (
                                                                <p className="font-medium text-amber-600 dark:text-amber-400">
                                                                    ⚠️ This is
                                                                    your only
                                                                    payment
                                                                    method.
                                                                    Removing it
                                                                    will cause
                                                                    your
                                                                    subscription
                                                                    to fail on
                                                                    the next
                                                                    renewal.
                                                                </p>
                                                            )}
                                                    </div>
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    onClick={() =>
                                                        handleRemove(m.id)
                                                    }
                                                >
                                                    Remove
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        );
                    })}

                    <Button asChild variant="outline" className="mt-2 w-full">
                        <Link href="/creator/plan/billing/add-card">
                            <Plus className="mr-2 h-4 w-4" /> Add New Card
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Info className="h-4 w-4 shrink-0" />
                To update card details, remove the old card and add a new one.
            </p>
        </div>
    );
}
