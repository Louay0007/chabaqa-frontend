'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tag, CheckCircle, TrendingUp, XCircle } from 'lucide-react'
import { PromoCodeResponseDto } from '@/lib/api'

interface PromoCodesStatsProps {
  promoCodes: PromoCodeResponseDto[]
}

export function PromoCodesStats({ promoCodes }: PromoCodesStatsProps) {
  const totalCodes = promoCodes.length
  const now = new Date()
  const activeCodes = promoCodes.filter(c =>
    c.isActive
    && (!c.endsAt || new Date(c.endsAt) > now)
    && (!c.startsAt || new Date(c.startsAt) <= now)
    && (!c.maxRedemptions || c.redemptionsCount < c.maxRedemptions)
  ).length
  const totalRedemptions = promoCodes.reduce((sum, c) => sum + c.redemptionsCount, 0)
  const expiredCodes = promoCodes.filter(c =>
    (c.endsAt && new Date(c.endsAt) < now)
    || (c.maxRedemptions && c.redemptionsCount >= c.maxRedemptions)
  ).length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCodes}</div>
          <p className="text-xs text-muted-foreground">All promo codes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeCodes}</div>
          <p className="text-xs text-muted-foreground">Currently usable</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRedemptions}</div>
          <p className="text-xs text-muted-foreground">All-time uses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expired / Maxed</CardTitle>
          <XCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiredCodes}</div>
          <p className="text-xs text-muted-foreground">No longer valid</p>
        </CardContent>
      </Card>
    </div>
  )
}
