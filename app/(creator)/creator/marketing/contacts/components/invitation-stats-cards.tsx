"use client"

import { Card } from "@/components/ui/card"
import { Mail, Clock, UserCheck, XCircle, Loader2 } from "lucide-react"
import type { InvitationStats } from "@/lib/api/community-invitations.api"

interface InvitationStatsCardsProps {
  stats: InvitationStats | null
  loading: boolean
  error?: string | null
}

export function InvitationStatsCards({ stats, loading, error }: InvitationStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-center h-24">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-center h-24 text-muted-foreground">
              <p className="text-sm">No data</p>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const total = Number(stats.total ?? 0)
  const pending = Number(stats.pending ?? 0)
  const accepted = Number(stats.accepted ?? 0)
  const expired = Number(stats.expired ?? 0)
  const revoked = Number(stats.revoked ?? 0)
  const conversionRate = Number(stats.conversionRate ?? 0)

  const statItems = [
    {
      name: "Total Sent",
      value: total.toLocaleString(),
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Pending",
      value: pending.toLocaleString(),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      name: "Accepted",
      value: accepted.toLocaleString(),
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
      subtitle: total > 0 ? `${conversionRate}% conversion` : undefined,
    },
    {
      name: "Expired / Revoked",
      value: (expired + revoked).toLocaleString(),
      icon: XCircle,
      color: "text-gray-500",
      bgColor: "bg-gray-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat) => (
        <Card key={stat.name} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">{stat.name}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              {"subtitle" in stat && stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
            </div>
            <div className={`${stat.bgColor} p-3 rounded-full`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
