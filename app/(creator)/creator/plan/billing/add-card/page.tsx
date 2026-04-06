"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CreditCard,
    Lock,
    Loader2,
    CheckCircle,
    ArrowLeft,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { paymentMethodApi } from "@/lib/api/subscription.api";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Stripe Elements card form (used when publishable key is available)
// ---------------------------------------------------------------------------
function CardElementForm({
    onSuccess,
}: {
    onSuccess: (card: { brand: string; last4: string }) => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setLoading(true);
        try {
            const { clientSecret, setupIntentId } =
                await paymentMethodApi.createSetupIntent();
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) throw new Error("Card element not mounted");
            const { error, setupIntent } = await stripe.confirmCardSetup(
                clientSecret,
                {
                    payment_method: { card: cardElement },
                },
            );
            if (error) {
                if (error.type === "card_error") {
                    throw new Error(
                        error.message ||
                            "Your card was declined. Please check your details and try again.",
                    );
                } else if (
                    error.code === "setup_intent_authentication_failure" ||
                    error.message?.toLowerCase().includes("authentication")
                ) {
                    throw new Error(
                        "Your bank requires additional verification. Please try again.",
                    );
                }
                throw new Error(error.message || "Card setup failed");
            }
            const result = await paymentMethodApi.confirmPaymentMethod(
                setupIntent!.id || setupIntentId,
            );
            if (result.success) {
                toast({
                    title: "Card saved!",
                    description: `${result.card.brand?.toUpperCase()} •••• ${result.card.last4}`,
                });
                onSuccess(result.card);
            }
        } catch (err: any) {
            toast({
                title: "Card setup failed",
                description: err?.message || "Try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-md border p-4 bg-white">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: "16px",
                                color: "#1a1a1a",
                                "::placeholder": { color: "#9ca3af" },
                            },
                            invalid: { color: "#ef4444" },
                        },
                        hidePostalCode: true,
                    }}
                />
            </div>
            <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                    Your card is secured by Stripe. Chabaqa never stores your
                    full card number.
                </p>
            </div>
            <Button
                type="submit"
                className="w-full"
                disabled={!stripe || loading}
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Save Card
                    </>
                )}
            </Button>
        </form>
    );
}

// ---------------------------------------------------------------------------
// Redirect-based form (no publishable key needed — uses Stripe Checkout)
// ---------------------------------------------------------------------------
function RedirectForm() {
    const [loading, setLoading] = useState(false);

    const handleRedirect = async () => {
        setLoading(true);
        try {
            const { url } = await paymentMethodApi.createSetupSession();
            window.location.href = url;
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.message || "Failed to start card setup.",
                variant: "destructive",
            });
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                    You&apos;ll be redirected to a secure Stripe page to enter
                    your card details. Chabaqa never stores your full card
                    number.
                </p>
            </div>
            <Button
                className="w-full"
                onClick={handleRedirect}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Redirecting...
                    </>
                ) : (
                    <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Add Card via Stripe
                    </>
                )}
            </Button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Success state after redirect back
// ---------------------------------------------------------------------------
function SetupSuccessHandler({
    onSuccess,
    onProcessing,
}: {
    onSuccess: (card: { brand: string; last4: string }) => void;
    onProcessing?: (processing: boolean) => void;
}) {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const setupParam = searchParams.get("setup");
    const isProcessing = !!(sessionId && setupParam === "success");

    useEffect(() => {
        onProcessing?.(isProcessing);
    }, [isProcessing, onProcessing]);

    useEffect(() => {
        if (setupParam === "success" && sessionId) {
            paymentMethodApi
                .completeSetupSession(sessionId)
                .then((result) => {
                    if (result.success) onSuccess(result.card);
                })
                .catch(() =>
                    toast({
                        title: "Error",
                        description: "Failed to finalize card.",
                        variant: "destructive",
                    }),
                );
        }
    }, [sessionId, setupParam, onSuccess]);

    if (isProcessing) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground font-medium">
                            Finalizing your card setup...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AddCardPage() {
    const [stripePromise, setStripePromise] =
        useState<Promise<Stripe | null> | null>(null);
    const [hasPublishableKey, setHasPublishableKey] = useState<boolean | null>(
        null,
    );
    const [success, setSuccess] = useState(false);
    const [processingRedirect, setProcessingRedirect] = useState(false);
    const [savedCard, setSavedCard] = useState<{
        brand: string;
        last4: string;
    } | null>(null);

    const handleSuccess = (card: { brand: string; last4: string }) => {
        setSavedCard(card);
        setSuccess(true);
    };

    useEffect(() => {
        paymentMethodApi
            .getConfig()
            .then(({ publishableKey }) => {
                if (
                    publishableKey &&
                    !publishableKey.startsWith("pk_test_REPLACE")
                ) {
                    setHasPublishableKey(true);
                    setStripePromise(loadStripe(publishableKey));
                } else {
                    setHasPublishableKey(false);
                }
            })
            .catch(() => setHasPublishableKey(false));
    }, []);

    if (success && savedCard) {
        return (
            <div className="max-w-md mx-auto space-y-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center py-6">
                            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">
                                Card Saved Successfully
                            </h2>
                            <p className="text-muted-foreground mb-1">
                                {savedCard.brand?.toUpperCase()} ••••{" "}
                                {savedCard.last4}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                This card will be used for your subscription
                                billing.
                            </p>
                            <div className="flex gap-3 mt-6">
                                <Button asChild>
                                    <Link href="/creator/plan">
                                        Back to My Plan
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/creator/plan/billing/manage">
                                        Manage Cards
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto space-y-6">
            <Suspense fallback={null}>
                <SetupSuccessHandler
                    onSuccess={handleSuccess}
                    onProcessing={setProcessingRedirect}
                />
            </Suspense>

            {!processingRedirect && (
                <>
                    <Button variant="ghost" size="sm" asChild className="mb-2">
                        <Link href="/creator/plan">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Plan
                        </Link>
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Add Payment Method
                            </CardTitle>
                            <CardDescription>
                                Your card will be securely saved for automatic
                                monthly billing. You&apos;ll be charged based on
                                your selected plan at the end of each billing
                                period.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {hasPublishableKey === null ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : hasPublishableKey && stripePromise ? (
                                <Elements stripe={stripePromise}>
                                    <CardElementForm
                                        onSuccess={handleSuccess}
                                    />
                                </Elements>
                            ) : (
                                <RedirectForm />
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <span>We accept</span>
                        <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 font-medium">
                            Visa
                        </span>
                        <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 font-medium">
                            Mastercard
                        </span>
                        <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 font-medium">
                            Amex
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}
