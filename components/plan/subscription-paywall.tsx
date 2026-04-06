"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    AlertCircle,
    CreditCard,
    ArrowRight,
    RefreshCw,
    Mail,
} from "lucide-react";
import { subscriptionApi } from "@/lib/api/subscription.api";
import Link from "next/link";

/**
 * Full-page overlay shown when a creator's trial has expired
 * and they have no payment method on file, or when payment is past due.
 * Rendered in the creator dashboard layout.
 */
export function SubscriptionPaywall() {
    const [show, setShow] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [retrying, setRetrying] = useState(false);
    const [retryResult, setRetryResult] = useState<string | null>(null);

    useEffect(() => {
        const check = async () => {
            try {
                const sub = await subscriptionApi.getMySubscription();
                const s = sub?.data?.status;
                const hasPM = sub?.data?.hasPaymentMethod;

                // Show paywall for incomplete (expired trial) or past_due without payment
                if (s === "incomplete" || (s === "past_due" && !hasPM)) {
                    setStatus(s);
                    setShow(true);
                }
            } catch {
                // Not authenticated or no subscription — don't block
            }
        };

        check();
    }, []);

    const handleRetryPayment = async () => {
        setRetrying(true);
        setRetryResult(null);
        try {
            const res = await subscriptionApi.retryPayment();
            if (res?.data?.success) {
                setRetryResult("success");
                // Brief delay then hide paywall
                setTimeout(() => setShow(false), 2000);
            } else {
                setRetryResult(
                    res?.data?.error ??
                        "Payment retry failed. Please update your payment method.",
                );
            }
        } catch {
            setRetryResult(
                "Payment retry failed. Please try again or update your payment method.",
            );
        } finally {
            setRetrying(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="mx-auto max-w-md rounded-xl border bg-card p-8 shadow-2xl text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                        <AlertCircle className="h-7 w-7 text-amber-600" />
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-2">
                    {status === "incomplete"
                        ? "Your Trial Has Ended"
                        : "Payment Required"}
                </h2>

                <p className="text-muted-foreground mb-4">
                    {status === "incomplete"
                        ? "Your free trial has expired. Add a payment method to continue using all Chabaqa features."
                        : "Your subscription payment is overdue. Please update your payment method to restore full access."}
                </p>

                {status === "past_due" && (
                    <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                        You have a grace period to update your payment method
                        before access is restricted.
                    </p>
                )}

                {retryResult === "success" && (
                    <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mb-4">
                        Payment succeeded! Restoring access…
                    </p>
                )}
                {retryResult && retryResult !== "success" && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-4">
                        {retryResult}
                    </p>
                )}

                <div className="space-y-3">
                    {status === "past_due" && (
                        <Button
                            className="w-full"
                            size="lg"
                            variant="default"
                            onClick={handleRetryPayment}
                            disabled={retrying}
                        >
                            <RefreshCw
                                className={`h-4 w-4 mr-2 ${retrying ? "animate-spin" : ""}`}
                            />
                            {retrying
                                ? "Retrying Payment…"
                                : "Retry Payment Now"}
                        </Button>
                    )}
                    <Button
                        asChild
                        className="w-full"
                        size="lg"
                        variant={status === "past_due" ? "outline" : "default"}
                    >
                        <Link href="/creator/plan/billing/add-card">
                            <CreditCard className="h-4 w-4 mr-2" />
                            {status === "past_due"
                                ? "Update Payment Method"
                                : "Add Payment Method"}
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/creator/plan/upgrade">
                            Choose a Plan
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                    Your data is preserved. Once you add a payment method,
                    everything will be restored.
                </p>

                <div className="mt-3 border-t pt-3">
                    <a
                        href="mailto:support@chabaqa.io"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Mail className="h-3.5 w-3.5" />
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
}
