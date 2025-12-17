import { Card, CardContent } from "@/components/ui/card"
import { Layers, CheckCircle2, Timer, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressStatsGridProps {
  summary: {
    totalItems: number
    completed: number
    inProgress: number
    notStarted: number
  }
}

export default function ProgressStatsGrid({ summary }: ProgressStatsGridProps) {
  const stats = [
    {
      label: "Total Items",
      value: summary.totalItems,
      icon: Layers,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Completed",
      value: summary.completed,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: "In Progress",
      value: summary.inProgress,
      icon: Timer,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Not Started",
      value: summary.notStarted,
      icon: PlayCircle,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="border border-border/70 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn("rounded-xl p-3", stat.bgColor, stat.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={cn("mt-1 text-2xl font-semibold", stat.color)}>
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

