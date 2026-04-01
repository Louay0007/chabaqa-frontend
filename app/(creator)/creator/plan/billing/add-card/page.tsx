'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { paymentMethodApi } from '@/lib/api/subscription.api';
import Link from 'next/link';

/**
 * Add Card Page — collects payment info.
 *
 * When Stripe is fully configured with @stripe/react-stripe-js,
 * replace the placeholder div with <CardElement />.
 * The flow: createSetupIntent → Stripe.js confirmCardSetup → confirmPaymentMethod.
 */
export default function AddCardPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedCard, setSavedCard] = useState<{ brand: string; last4: string } | null>(null);

  const handleStripeSetup = async () => {
    setLoading(true);
    try {
      const { setupIntentId } = await paymentMethodApi.createSetupIntent();
      // In production with Stripe Elements:
      // const { error } = await stripe.confirmCardSetup(clientSecret, { payment_method: { card: cardElement } });
      // if (error) throw new Error(error.message);
      const result = await paymentMethodApi.confirmPaymentMethod(setupIntentId);
      if (result.success) {
        setSavedCard(result.card);
        setSuccess(true);
        toast({ title: 'Card saved!', description: `${result.card.brand?.toUpperCase()} •••• ${result.card.last4} has been added.` });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to save card.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (success && savedCard) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Card Saved Successfully</h2>
              <p className="text-muted-foreground mb-1">
                {savedCard.brand?.toUpperCase()} •••• {savedCard.last4}
              </p>
              <p className="text-sm text-muted-foreground">
                This card will be used for your subscription billing.
              </p>
              <div className="flex gap-3 mt-6">
                <Button asChild>
                  <Link href="/creator/plan">Back to My Plan</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/creator/plan/billing/manage">Manage Cards</Link>
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
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link href="/creator/plan">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Plan
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment Method
          </CardTitle>
          <CardDescription>
            Save a card for automatic subscription billing. Your card details are secured by Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
            <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Stripe Card Element</p>
            <p className="text-xs text-muted-foreground mt-1">
              Install <code className="bg-muted px-1 rounded">@stripe/react-stripe-js</code> to enable the hosted card form.
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Your card is secured by Stripe. Chabaqa never stores your full card number.</p>
          </div>

          <Button className="w-full" onClick={handleStripeSetup} disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting up...</>
            ) : (
              'Save Card via Stripe'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
