'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, Users, DollarSign, Percent } from 'lucide-react'
import { api, PromoCodeStatsDto } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface PromoCodeStatsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
}

export function PromoCodeStatsDialog({ open, onOpenChange, code }: PromoCodeStatsDialogProps) {
  const { toast } = useToast()
  const [stats, setStats] = useState<PromoCodeStatsDto | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && code) {
      loadStats()
    } else {
      setStats(null)
    }
  }, [open, code])

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await api.promoCodes.getStats(code).catch(() => null as any)
      setStats(res?.data ?? res ?? null)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load statistics', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Promo Code Statistics</DialogTitle>
          <DialogDescription>
            Performance metrics for code: <span className="font-mono font-semibold">{code}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUses}</div>
                  {stats.maxRedemptions != null && (
                    <p className="text-xs text-muted-foreground">
                      of {stats.maxRedemptions} max
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} DT</div>
                  <p className="text-xs text-muted-foreground">After discounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                  <Percent className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDiscounts.toFixed(2)} DT</div>
                  <p className="text-xs text-muted-foreground">Given to customers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Discount</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageDiscount.toFixed(2)} DT</div>
                  <p className="text-xs text-muted-foreground">Per redemption</p>
                </CardContent>
              </Card>
            </div>

            {stats.remainingUses != null && stats.maxRedemptions != null && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Remaining Uses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    {stats.remainingUses} of {stats.maxRedemptions} remaining
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, (stats.totalUses / stats.maxRedemptions) * 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No statistics available
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
