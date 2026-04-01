'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { paymentMethodApi } from '@/lib/api/subscription.api';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Inner form — must be inside <Elements>
// ---------------------------------------------------------------------------
function CardForm({ onSuccess }: { onSuccess: (card: { brand: string; last4: string }) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      // Step 1: get SetupIntent clientSecret from backend
      const { clientSecret, setupIntentId } = await paymentMethodApi.createSetupIntent();

      // Step 2: confirm card setup with Stripe.js (PCI-compliant tokenization)
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) throw new Error(error.message || 'Card setup failed');

      // Step 3: save payment method to our DB
      const result = await paymentMethodApi.confirmPaymentMethod(setupIntent!.id || setupIntentId);

      if (result.success) {
        toast({
          title: 'Card saved!',
          description: `${result.card.brand?.toUpperCase()} •••• ${result.card.last4} has been added.`,
        });
        onSuccess(result.card);
      }
    } catch (err: any) {
      toast({
        title: 'Card setup failed',
        description: err?.message || 'Please check your card details and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe hosted card field */}
      <div className="rounded-md border p-4 bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1a1a1a',
                fontFamily: 'Inter, system-ui, sans-serif',
                '::placeholder': { color: '#9ca3af' },
              },
              invalid: { color: '#ef4444' },
            },
            hidePostalCode: true,
          }}
        />
      </div>

      <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" />
        <p>Your card is secured by Stripe. Chabaqa never stores your full card number.</p>
      </div>

      <Button type="submit" className="w-full" disabled={!stripe || loading}>
        {loading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving card...</>
        ) : (
          <><CreditCard className="h-4 w-4 mr-2" /> Save Card</>
        )}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page — loads Stripe publishable key then mounts Elements
// ---------------------------------------------------------------------------
export default function AddCardPage() {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savedCard, setSavedCard] = useState<{ brand: string; last4: string } | null>(null);

  useEffect(() => {
    paymentMethodApi.getConfig()
      .then(({ publishableKey }) => {
        if (!publishableKey || publishableKey.startsWith('pk_test_REPLACE')) {
          setConfigError('Stripe publishable key is not configured. Set STRIPE_PUBLISHABLE_KEY in backend .env.');
          return;
        }
        setStripePromise(loadStripe(publishableKey));
      })
      .catch(() => setConfigError('Failed to load Stripe configuration.'));
  }, []);

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
                <Button asChild><Link href="/creator/plan">Back to My Plan</Link></Button>
                <Button variant="outline" asChild><Link href="/creator/plan/billing/manage">Manage Cards</Link></Button>
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
        <Link href="/creator/plan"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Plan</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Add Payment Method
          </CardTitle>
          <CardDescription>
            Save a card for automatic subscription billing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configError ? (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-medium mb-1">Stripe not configured</p>
              <p>{configError}</p>
              <p className="mt-2 font-mono text-xs bg-muted p-2 rounded">
                STRIPE_PUBLISHABLE_KEY=pk_test_... in backend/.env
              </p>
            </div>
          ) : !stripePromise ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Elements stripe={stripePromise}>
              <CardForm onSuccess={(card) => { setSavedCard(card); setSuccess(true); }} />
            </Elements>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
