'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard, ArrowRight } from 'lucide-react';
import { subscriptionApi } from '@/lib/api/subscription.api';
import { PLAN_ENFORCEMENT_MODE } from '@/lib/plans/plan-config';
import Link from 'next/link';

/**
 * Full-page overlay shown when a creator's trial has expired
 * and they have no payment method on file.
 * Rendered in the creator dashboard layout.
 */
export function SubscriptionPaywall() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!PLAN_ENFORCEMENT_MODE) return;

    const check = async () => {
      try {
        const sub = await subscriptionApi.getMySubscription();
        const s = sub?.status;
        const hasPM = sub?.hasPaymentMethod;

        // Show paywall for incomplete (expired trial) or past_due without payment
        if (s === 'incomplete' || (s === 'past_due' && !hasPM)) {
          setStatus(s);
          setShow(true);
        }
      } catch {
        // Not authenticated or no subscription — don't block
      }
    };

    check();
  }, []);

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
          {status === 'incomplete' ? 'Your Trial Has Ended' : 'Payment Required'}
        </h2>

        <p className="text-muted-foreground mb-6">
          {status === 'incomplete'
            ? 'Your free trial has expired. Add a payment method to continue using all Chabaqa features.'
            : 'Your subscription payment is overdue. Please update your payment method to restore full access.'}
        </p>

        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/creator/plan/billing/add-card">
              <CreditCard className="h-4 w-4 mr-2" />
              Add Payment Method
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
          Your data is preserved. Once you add a payment method, everything will be restored.
        </p>
      </div>
    </div>
  );
}
