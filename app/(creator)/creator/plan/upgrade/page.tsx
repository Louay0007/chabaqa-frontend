'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Star, Rocket, Check, ArrowLeft, CreditCard, Loader2,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { subscriptionApi } from '@/lib/api/subscription.api';
import {
  PLANS,
  PLAN_TIERS,
  type PlanTier,
  formatLimit,
} from '@/lib/plans/plan-config';
import { usePlan } from '@/hooks/use-plan';

const PLAN_ICONS: Record<string, typeof Zap> = { starter: Zap, growth: Star, pro: Rocket };

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tier: currentTier, subscription } = usePlan();

  const preselectedPlan = searchParams.get('plan') as PlanTier | null;
  const preselectedBilling = searchParams.get('billing') as 'monthly' | 'yearly' | null;

  const [billing, setBilling] = useState<'monthly' | 'yearly'>(preselectedBilling || 'yearly');
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(preselectedPlan);
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async (tier: PlanTier) => {
    setUpgrading(true);
    try {
      // If has payment method, try direct upgrade
      if (subscription?.hasPaymentMethod) {
        await subscriptionApi.upgradePlan({ tier });
        toast({ title: 'Plan upgraded!', description: `You are now on the ${PLANS[tier].name} plan.` });
        router.push('/creator/plan');
      } else {
        // Redirect to payment
        try {
          const res = await subscriptionApi.initKonnectPayment(tier);
          if (res?.data?.paymentUrl) {
            window.location.href = res.data.paymentUrl;
            return;
          }
        } catch {
          // Fallback to Stripe
        }
        try {
          const res = await subscriptionApi.initStripePayment(tier, billing === 'yearly' ? 'year' : 'month');
          if (res?.data?.url) {
            window.location.href = res.data.url;
            return;
          }
        } catch {
          // fallback
        }
        toast({ title: 'Payment setup required', description: 'Please contact support to set up billing.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Upgrade failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setUpgrading(false);
    }
  };

  const currentIdx = PLAN_TIERS.indexOf(currentTier);

  // Show confirmation view when a plan is selected
  if (selectedTier) {
    const targetPlan = PLANS[selectedTier];
    const price = billing === 'yearly' ? targetPlan.yearlyMonthlyPrice : targetPlan.monthlyPrice;
    const Icon = PLAN_ICONS[selectedTier] || Star;

    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedTier(null)}>
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
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{targetPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Billing</span>
                <span className="font-medium">{billing === 'yearly' ? 'Yearly' : 'Monthly'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{price} TND / month</span>
              </div>
              {billing === 'yearly' && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Annual Total</span>
                  <span className="font-medium">{targetPlan.yearlyTotal} TND / year</span>
                </div>
              )}
              {subscription?.hasPaymentMethod && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="flex items-center gap-1 font-medium">
                    <CreditCard className="h-3.5 w-3.5" />
                    {subscription.paymentBrand?.toUpperCase()} •••• {subscription.paymentLast4}
                  </span>
                </div>
              )}
            </div>

            <Button className="w-full" size="lg" disabled={upgrading} onClick={() => handleUpgrade(selectedTier)}>
              {upgrading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {subscription?.hasPaymentMethod ? 'Confirm Upgrade' : 'Continue to Payment'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex justify-center gap-2">
        <Button size="sm" variant={billing === 'monthly' ? 'default' : 'outline'} onClick={() => setBilling('monthly')}>
          Monthly
        </Button>
        <Button size="sm" variant={billing === 'yearly' ? 'default' : 'outline'} onClick={() => setBilling('yearly')}>
          Yearly
          <Badge variant="secondary" className="ml-2">Save 20%</Badge>
        </Button>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_TIERS.map((t, idx) => {
          const p = PLANS[t];
          const Icon = PLAN_ICONS[t] || Zap;
          const price = billing === 'yearly' ? p.yearlyMonthlyPrice : p.monthlyPrice;
          const isCurrent = t === currentTier;
          const isDowngrade = idx < currentIdx;
          const isHighlighted = p.highlight;

          return (
            <Card
              key={t}
              className={`relative transition-shadow hover:shadow-md ${
                isHighlighted ? 'border-primary ring-2 ring-primary/20' : ''
              } ${isCurrent ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Most Popular</Badge>
                </div>
              )}
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  {isCurrent && <Badge variant="secondary">Current</Badge>}
                </div>

                <div>
                  <span className="text-3xl font-bold">{price}</span>
                  <span className="text-muted-foreground ml-1">TND/mo</span>
                  {billing === 'yearly' && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Billed {p.yearlyTotal} TND/year
                    </p>
                  )}
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" />{formatLimit(p.limits.membersMax)} members</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" />{p.limits.storageGB} GB storage</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" />{p.transactionFee}% transaction fee</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" />{p.limits.adminsMax} admin seats</li>
                  {p.features.challenges && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" />Challenges</li>}
                  {p.features.sessions && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" />1:1 Sessions</li>}
                  {p.features.events && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" />Events</li>}
                  {p.features.branding && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" />Remove Branding</li>}
                  {p.features.gamification && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" />Gamification</li>}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrent ? 'outline' : isHighlighted ? 'default' : 'outline'}
                  disabled={isCurrent || isDowngrade}
                  onClick={() => setSelectedTier(t)}
                >
                  {isCurrent ? 'Current Plan' : isDowngrade ? 'Downgrade N/A' : `Upgrade to ${p.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
