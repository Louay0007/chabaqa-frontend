'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, Download, Loader2, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { subscriptionApi, Invoice, InvoiceStatus } from '@/lib/api/subscription.api';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  paid: { label: 'Paid', variant: 'default' },
  open: { label: 'Open', variant: 'secondary' },
  draft: { label: 'Draft', variant: 'outline' },
  void: { label: 'Void', variant: 'outline' },
  uncollectible: { label: 'Uncollectible', variant: 'destructive' },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionApi.getInvoices({ page, limit: 20 }) as any;
      // Backend returns { invoices, total, page, limit } — handle both shapes safely
      const list = Array.isArray(res?.invoices)
        ? res.invoices
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setInvoices(list);
      const total = res?.total ?? res?.pagination?.total ?? 0;
      const pages = res?.pagination?.totalPages ?? Math.ceil(total / 20);
      setTotalPages(pages || 1);
    } catch {
      toast({ title: 'Error', description: 'Failed to load invoices.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPaid = invoices
    .filter((inv) => inv.status === InvoiceStatus.PAID)
    .reduce((sum, inv) => sum + inv.total, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid (visible invoices)</p>
              <p className="text-2xl font-bold">{totalPaid.toFixed(2)} TND</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing History</CardTitle>
          <CardDescription>All invoices for your Chabaqa subscription</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium">No invoices yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Invoices will appear here once your first billing cycle completes.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-medium">Invoice</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-right py-3 px-4 font-medium">Amount</th>
                      <th className="text-center py-3 px-4 font-medium">Status</th>
                      <th className="text-right py-3 px-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((inv) => {
                      const status = STATUS_MAP[inv.status] || STATUS_MAP.draft;
                      return (
                        <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">{inv.invoiceNumber || inv.id.slice(0, 12)}</td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(inv.invoiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">{inv.total.toFixed(2)} {inv.currency}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {inv.invoicePdfUrl && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={inv.invoicePdfUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-1" /> PDF
                                </a>
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
