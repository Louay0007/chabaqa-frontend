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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-center h-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-center h-16 text-muted-foreground">
              <p className="text-xs">No data</p>
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
      iconBg: "bg-blue-600",
    },
    {
      name: "Pending",
      value: pending.toLocaleString(),
      icon: Clock,
      iconBg: "bg-amber-500",
    },
    {
      name: "Accepted",
      value: accepted.toLocaleString(),
      icon: UserCheck,
      iconBg: "bg-emerald-600",
      subtitle: total > 0 ? `${conversionRate}% conversion` : undefined,
    },
    {
      name: "Expired / Revoked",
      value: (expired + revoked).toLocaleString(),
      icon: XCircle,
      iconBg: "bg-slate-500",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statItems.map((stat) => (
        <Card
          key={stat.name}
          className="p-4 hover:shadow-md transition-all duration-200 border border-border/60"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">
                {stat.name}
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums leading-tight">{stat.value}</h3>
              {"subtitle" in stat && stat.subtitle && (
                <p className="text-xs text-emerald-600 font-medium mt-0.5">{stat.subtitle}</p>
              )}
            </div>
            <div className={`${stat.iconBg} p-2.5 rounded-lg shrink-0`}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
