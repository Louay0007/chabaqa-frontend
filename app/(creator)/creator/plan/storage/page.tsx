'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HardDrive, AlertTriangle, ArrowUpCircle, Lightbulb, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { subscriptionApi, StorageUsageData } from '@/lib/api/subscription.api';
import { usePlan } from '@/hooks/use-plan';
import { ADD_ONS, type PlanTier } from '@/lib/plans/plan-config';

export default function StoragePage() {
  const router = useRouter();
  const { plan, tier } = usePlan();
  const [storage, setStorage] = useState<StorageUsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionApi.getStorageUsage();
      setStorage(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load storage data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const usedGB = storage?.usedGB ?? 0;
  const limitGB = storage?.limitGB ?? plan.limits.storageGB;
  const percentUsed = storage?.percentUsed ?? 0;
  const remainingGB = storage?.remainingGB ?? limitGB;
  const isNear = percentUsed >= 80;
  const isAt = percentUsed >= 100;

  const addonPrice = ADD_ONS.extraStorage[tier as keyof typeof ADD_ONS.extraStorage]?.priceTND ?? 12;

  return (
    <div className="space-y-6">
      {/* Main Storage Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Storage Usage</CardTitle>
              <CardDescription>{plan.name} Plan — {limitGB} GB included</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress
            value={percentUsed}
            className={`h-4 ${isAt ? '[&>div]:bg-destructive' : isNear ? '[&>div]:bg-amber-500' : ''}`}
          />
          <div className="flex justify-between text-sm">
            <span className={isAt ? 'text-destructive font-medium' : isNear ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
              {usedGB.toFixed(2)} GB used
            </span>
            <span className="text-muted-foreground">
              {remainingGB.toFixed(2)} GB remaining ({(100 - percentUsed).toFixed(1)}% free)
            </span>
          </div>

          {tier !== 'pro' && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/creator/plan/upgrade')}>
                <ArrowUpCircle className="h-4 w-4 mr-1" />
                Upgrade to {tier === 'starter' ? 'Growth (50 GB)' : 'Pro (300 GB)'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{usedGB.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">GB Used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{limitGB}</p>
            <p className="text-sm text-muted-foreground">GB Limit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className={`text-3xl font-bold ${isAt ? 'text-destructive' : isNear ? 'text-amber-600' : 'text-green-600'}`}>
              {percentUsed.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Near / At Limit Warning */}
      {isNear && (
        <Card className={isAt ? 'border-destructive/50 bg-destructive/5' : 'border-amber-400/50 bg-amber-50'}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${isAt ? 'text-destructive' : 'text-amber-600'}`} />
              <div>
                <h4 className="font-medium">{isAt ? 'Storage limit reached!' : 'Running low on storage'}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAt
                    ? 'You cannot upload new files until you free up space or expand your storage.'
                    : `You've used ${percentUsed.toFixed(0)}% of your storage. Consider expanding before you reach the limit.`}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant={isAt ? 'default' : 'outline'}>
                    Add 100 GB for {addonPrice} TND/mo
                  </Button>
                  {tier !== 'pro' && (
                    <Button size="sm" variant="outline" onClick={() => router.push('/creator/plan/upgrade')}>
                      Upgrade Plan Instead
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Save Storage Space
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Compress videos before upload — target 1080p max with HandBrake or similar tools</li>
            <li>• Use YouTube or Vimeo embeds for video lessons instead of direct uploads</li>
            <li>• Archive or delete unused course content to free up space</li>
            <li>• Optimize images with TinyPNG before uploading thumbnails and banners</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
