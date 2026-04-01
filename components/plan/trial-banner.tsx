'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { X, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subscriptionApi } from '@/lib/api/subscription.api';
import { PLAN_ENFORCEMENT_MODE } from '@/lib/plans/plan-config';

export function TrialBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data: trial } = useQuery({
    queryKey: ['trial-remaining'],
    queryFn: async () => {
      try {
        const res = await subscriptionApi.getTrialRemaining();
        return res.data;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled: PLAN_ENFORCEMENT_MODE,
  });

  const { data: sub } = useQuery({
    queryKey: ['my-subscription-banner'],
    queryFn: () => subscriptionApi.getMySubscription(),
    staleTime: 60_000,
    enabled: PLAN_ENFORCEMENT_MODE,
  });

  if (!PLAN_ENFORCEMENT_MODE || dismissed || !trial?.isTrialing) return null;

  const hasPayment = sub?.hasPaymentMethod;
  const isUrgent = trial.remaining.days === 0;
  const timeText = trial.remaining.days > 0
    ? `${trial.remaining.days} day${trial.remaining.days !== 1 ? 's' : ''}`
    : `${trial.remaining.hours}h ${trial.remaining.minutes}m`;

  // Card already saved — show reassuring message
  if (hasPayment) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm bg-green-50 text-green-800 border-b border-green-200">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Your trial ends in {timeText}. You&apos;re all set — billing starts automatically.</span>
        </div>
        <button onClick={() => setDismissed(true)} className="p-1 rounded hover:bg-black/10 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
        isUrgent
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-blue-50 text-blue-800 border-b border-blue-200'
      }`}
    >
      <div className="flex items-center gap-2">
        {isUrgent ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Clock className="h-4 w-4 shrink-0" />}
        <span>
          {isUrgent
            ? `Your trial expires in ${timeText}!`
            : `Your free trial ends in ${timeText}.`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant={isUrgent ? 'secondary' : 'default'} asChild>
          <Link href={isUrgent ? '/creator/plan/upgrade' : '/creator/plan/billing/add-card'}>
            {isUrgent ? 'Upgrade Now' : 'Add Payment Method'}
          </Link>
        </Button>
        <button onClick={() => setDismissed(true)} className="p-1 rounded hover:bg-black/10 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
