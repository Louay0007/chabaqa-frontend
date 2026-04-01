'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
} from '@/components/ui/alert-dialog';
import {
  Zap, Star, Rocket, Check, X, CreditCard,
  Calendar, AlertTriangle, RefreshCw, Loader2, Crown,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  subscriptionApi,
  CreatorSubscription,
  SubscriptionStatus,
  StorageUsageData,
  UsageSummary,
} from '@/lib/api/subscription.api';
import {
  PLANS,
  PLAN_TIERS,
  type PlanTier,
  type PlanFeatures,
  formatLimit,
  ADD_ONS,
} from '@/lib/plans/plan-config';
import { usePlan } from '@/hooks/use-plan';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  active: { label: 'Active', variant: 'default' },
  trialing: { label: 'Trial', variant: 'secondary', className: 'bg-blue-100 text-blue-700' },
  past_due: { label: 'Past Due', variant: 'destructive' },
  canceled: { label: 'Canceled', variant: 'outline', className: 'border-orange-400 text-orange-600' },
  incomplete: { label: 'Incomplete', variant: 'outline', className: 'border-yellow-400 text-yellow-600' },
};

const PLAN_ICONS: Record<string, typeof Zap> = { starter: Zap, growth: Star, pro: Rocket };

const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  courses: 'Courses',
  products: 'Digital Products',
  challenges: 'Challenges',
  sessions: '1:1 Sessions',
  events: 'Events',
  branding: 'Remove Chabaqa Branding',
  gamification: 'Gamification (Points & Badges)',
  verifiedBadge: 'Verified Badge',
  featuredBadge: 'Featured Badge',
};

function UsageBar({ label, current, max, suffix = '' }: { label: string; current: number; max: number; suffix?: string }) {
  const isUnlimited = max >= 999;
  const percent = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
  const isNear = percent >= 80;
  const isAt = percent >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={isAt ? 'text-destructive font-medium' : isNear ? 'text-amber-600 font-medium' : ''}>
          {isUnlimited
            ? `${current.toLocaleString()}${suffix} / Unlimited`
            : `${current.toLocaleString()}${suffix} / ${formatLimit(max)}${suffix}`}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percent}
          className={isAt ? '[&>div]:bg-destructive' : isNear ? '[&>div]:bg-amber-500' : ''}
        />
      )}
      {isUnlimited && (
        <div className="h-2 rounded-full bg-green-100" />
      )}
    </div>
  );
}

export default function MyPlanPage() {
  const router = useRouter();
  const { plan, tier, enforcementEnabled } = usePlan();
  const [sub, setSub] = useState<CreatorSubscription | null>(null);
  const [storage, setStorage] = useState<StorageUsageData | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, storageRes, usageRes] = await Promise.allSettled([
        subscriptionApi.getMySubscription(),
        subscriptionApi.getStorageUsage(),
        subscriptionApi.getUsageSummary(),
      ]);
      if (subRes.status === 'fulfilled') setSub(subRes.value.data);
      if (storageRes.status === 'fulfilled') setStorage(storageRes.value.data);
      if (usageRes.status === 'fulfilled') setUsage(usageRes.value.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await subscriptionApi.cancelSubscription();
      toast({ title: 'Subscription canceled', description: 'Your subscription will end at the current period.' });
      load();
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel subscription.', variant: 'destructive' });
    } finally {
      setCanceling(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      await subscriptionApi.reactivateSubscription();
      toast({ title: 'Subscription reactivated', description: 'Your subscription will continue.' });
      load();
    } catch {
      toast({ title: 'Error', description: 'Failed to reactivate.', variant: 'destructive' });
    } finally {
      setReactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const currentTier = (sub?.plan as PlanTier) || tier;
  const currentPlan = PLANS[currentTier] || PLANS.starter;
  const PlanIcon = PLAN_ICONS[currentTier] || Zap;
  const statusCfg = STATUS_CONFIG[sub?.status || 'active'] || STATUS_CONFIG.active;

  const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      {/* Section A — Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <PlanIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{currentPlan.name} Plan</h2>
                  <Badge variant={statusCfg.variant} className={statusCfg.className}>
                    {statusCfg.label}
                  </Badge>
                  {sub?.cancelAtPeriodEnd && (
                    <Badge variant="outline" className="border-orange-400 text-orange-600">Cancels {periodEnd}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                  {sub?.status === 'trialing' && sub.trialEndsAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Trial ends {new Date(sub.trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {sub?.status === 'active' && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Renews {periodEnd}
                    </span>
                  )}
                  {sub?.hasPaymentMethod && (
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5" />
                      {sub.paymentBrand?.toUpperCase()} •••• {sub.paymentLast4}
                    </span>
                  )}
                  <span>{currentPlan.transactionFee}% transaction fee</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={load}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
              <Button size="sm" onClick={() => router.push('/creator/plan/upgrade')}>
                <Crown className="h-4 w-4 mr-1" /> Upgrade
              </Button>
            </div>
          </div>

          {sub?.status === 'past_due' && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Payment failed — please update your billing method to restore full access.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section B — Usage Gauges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan Usage — {currentPlan.name}</CardTitle>
          <CardDescription>Your current resource consumption vs. plan limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageBar label="Members" current={usage?.membersAdded ?? 0} max={currentPlan.limits.membersMax} />
          <UsageBar label="Storage" current={storage?.usedGB ?? 0} max={currentPlan.limits.storageGB} suffix=" GB" />
          <UsageBar label="Active Courses" current={usage?.coursesActivated ?? 0} max={currentPlan.limits.coursesActivationMax} />
          <UsageBar label="Admin Seats" current={usage?.adminsAdded ?? 0} max={currentPlan.limits.adminsMax} />
          {currentPlan.limits.emailCampaignRecipientsPerMonth > 0 && (
            <UsageBar label="Email Recipients / mo" current={usage?.emailsSent ?? 0} max={currentPlan.limits.emailCampaignRecipientsPerMonth} />
          )}
          {currentPlan.limits.sessionBookingsPerMonth > 0 && (
            <UsageBar label="Session Bookings / mo" current={0} max={currentPlan.limits.sessionBookingsPerMonth} />
          )}
        </CardContent>
      </Card>

      {/* Section C — Features Included */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {(Object.keys(FEATURE_LABELS) as (keyof PlanFeatures)[]).map((key) => {
              const included = currentPlan.features[key];
              return (
                <div key={key} className="flex items-center gap-2 text-sm py-1">
                  {included ? (
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  )}
                  <span className={!included ? 'text-muted-foreground' : ''}>
                    {FEATURE_LABELS[key]}
                  </span>
                  {!included && (
                    <Badge variant="outline" className="text-xs ml-auto">
                      {PLAN_TIERS.find((t) => PLANS[t].features[key]) || 'pro'}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section D — Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compare Plans</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Feature</th>
                {PLAN_TIERS.map((t) => (
                  <th key={t} className={`text-center py-2 px-3 font-medium ${t === currentTier ? 'text-primary' : ''}`}>
                    {PLANS[t].name}
                    {t === currentTier && <div className="text-xs text-primary">Current</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="py-2 pr-4">Monthly Price</td>{PLAN_TIERS.map((t) => <td key={t} className="text-center py-2 px-3">{PLANS[t].monthlyPrice} TND</td>)}</tr>
              <tr><td className="py-2 pr-4">Members</td>{PLAN_TIERS.map((t) => <td key={t} className="text-center py-2 px-3">{formatLimit(PLANS[t].limits.membersMax)}</td>)}</tr>
              <tr><td className="py-2 pr-4">Storage</td>{PLAN_TIERS.map((t) => <td key={t} className="text-center py-2 px-3">{PLANS[t].limits.storageGB} GB</td>)}</tr>
              <tr><td className="py-2 pr-4">Active Courses</td>{PLAN_TIERS.map((t) => <td key={t} className="text-center py-2 px-3">{formatLimit(PLANS[t].limits.coursesActivationMax)}</td>)}</tr>
              <tr><td className="py-2 pr-4">Admin Seats</td>{PLAN_TIERS.map((t) => <td key={t} className="text-center py-2 px-3">{PLANS[t].limits.adminsMax}</td>)}</tr>
              <tr><td className="py-2 pr-4">Transaction Fee</td>{PLAN_TIERS.map((t) => <td key={t} className="text-center py-2 px-3">{PLANS[t].transactionFee}%</td>)}</tr>
              <tr><td className="py-2 pr-4">Challenges</td>{PLAN_TIERS.map((t) => <td key={t} className="text-center py-2 px-3">{PLANS[t].features.challenges ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />}</td>)}</tr>
              <tr><td className="py-2 pr-4">Sessions</td>{PLAN_TIERS.map((t) => <td key={t} className="text-center py-2 px-3">{PLANS[t].features.sessions ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />}</td>)}</tr>
              <tr><td className="py-2 pr-4">Events</td>{PLAN_TIERS.map((t) => <td key={t} className="text-center py-2 px-3">{PLANS[t].features.events ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />}</td>)}</tr>
              <tr><td className="py-2 pr-4">Branding</td>{PLAN_TIERS.map((t) => <td key={t} className="text-center py-2 px-3">{PLANS[t].features.branding ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />}</td>)}</tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Section E — Add-ons */}
      {currentTier !== 'pro' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Add-ons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-medium">Extra Admin Seat</h4>
                <p className="text-sm text-muted-foreground mt-1">+{ADD_ONS.extraAdminSeat.priceTND} TND/month per seat</p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-medium">Extra Storage</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  +{ADD_ONS.extraStorage[currentTier as keyof typeof ADD_ONS.extraStorage]?.priceTND ?? 12} TND per 100 GB/month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section F — Danger Zone */}
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
                <p className="font-medium">Subscription set to cancel</p>
                <p className="text-sm text-muted-foreground">
                  Access continues until {periodEnd}. Reactivate to keep your plan.
                </p>
              </div>
              <Button variant="outline" onClick={handleReactivate} disabled={reactivating}>
                {reactivating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Reactivate Subscription
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium">Cancel Subscription</p>
                <p className="text-sm text-muted-foreground">
                  You will retain access until the end of the current billing period. Data is preserved for 30 days after cancellation.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">Cancel Subscription</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your {currentPlan.name} plan will remain active until {periodEnd}. After that, you will lose access to plan features.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} disabled={canceling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {canceling ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
