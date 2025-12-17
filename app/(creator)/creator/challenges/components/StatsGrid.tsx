"use client"

import { MetricCard } from "@/components/ui/metric-card"
import { Zap, Play, Users, DollarSign } from "lucide-react"

interface StatsGridProps {
  allChallenges: any[]
  revenue?: number | null
}

export default function StatsGrid({ allChallenges, revenue }: StatsGridProps) {
  const participantsTotal = allChallenges.reduce((acc, c) => acc + (Array.isArray(c.participants) ? c.participants.length : (c.participantsCount ?? 0)), 0)
  const revenueFallback = allChallenges.reduce((acc, c) => acc + ((c.depositAmount || 0) * (Array.isArray(c.participants) ? c.participants.length : (c.participantsCount ?? 0))), 0)
  const stats = [
    {
      title: "Total Challenges",
      value: allChallenges.length,
      change: { value: "+1", trend: "up" as const },
      icon: Zap,
      color: "challenges" as const,
    },
    {
      title: "Active Challenges",
      value: allChallenges.filter((c) => {
        const now = new Date()
        return c.startDate <= now && c.endDate >= now
      }).length,
      change: { value: "1", trend: "neutral" as const },
      icon: Play,
      color: "success" as const,
    },
    {
      title: "Total Participants",
      value: participantsTotal,
      change: { value: "+47", trend: "up" as const },
      icon: Users,
      color: "primary" as const,
    },
    {
      title: "Challenge Revenue",
      value: `$${Number((revenue ?? revenueFallback)).toLocaleString()}`,
      change: { value: "+22%", trend: "up" as const },
      icon: DollarSign,
      color: "success" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <MetricCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          change={stat.change.trend === "neutral" ? undefined : stat.change}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </div>
  )
}
