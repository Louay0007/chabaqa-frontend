'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Trash2, Star, Plus, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { paymentMethodApi, SavedPaymentMethod } from '@/lib/api/subscription.api';
import Link from 'next/link';

export default function ManageBillingPage() {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await paymentMethodApi.list();
      setMethods(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load payment methods.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSetDefault = async (pmId: string) => {
    setActionLoading(pmId);
    try {
      await paymentMethodApi.setDefault(pmId);
      toast({ title: 'Default updated' });
      await load();
    } catch {
      toast({ title: 'Error', description: 'Failed to update default card.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (pmId: string) => {
    setActionLoading(pmId);
    try {
      await paymentMethodApi.remove(pmId);
      toast({ title: 'Card removed' });
      await load();
    } catch {
      toast({ title: 'Error', description: 'Failed to remove card.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const brandLabel = (brand?: string) => {
    const b = brand?.toLowerCase();
    if (b === 'visa') return 'VISA';
    if (b === 'mastercard') return 'Mastercard';
    if (b === 'amex') return 'Amex';
    return brand?.toUpperCase() || 'Card';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" /> Payment Methods
          </CardTitle>
          <CardDescription>Manage your saved payment methods for Chabaqa subscription billing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {methods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium">No payment methods saved</p>
              <p className="text-sm text-muted-foreground mt-1">Add a card to enable automatic billing.</p>
              <Button asChild className="mt-4">
                <Link href="/creator/plan/billing/add-card"><Plus className="h-4 w-4 mr-2" /> Add Payment Method</Link>
              </Button>
            </div>
          ) : (
            <>
              {methods.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {brandLabel(m.brand)} •••• {m.last4}
                        {m.isDefault && <Badge variant="default" className="ml-2 text-xs">Default</Badge>}
                      </p>
                      {m.expMonth && m.expYear && (
                        <p className="text-sm text-muted-foreground">
                          Expires {String(m.expMonth).padStart(2, '0')}/{m.expYear}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!m.isDefault && (
                      <Button variant="outline" size="sm" disabled={actionLoading === m.id} onClick={() => handleSetDefault(m.id)}>
                        {actionLoading === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Star className="h-4 w-4 mr-1" /> Set Default</>}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" disabled={actionLoading === m.id} onClick={() => handleRemove(m.id)} className="text-destructive hover:text-destructive">
                      {actionLoading === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full mt-2">
                <Link href="/creator/plan/billing/add-card"><Plus className="h-4 w-4 mr-2" /> Add New Card</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
