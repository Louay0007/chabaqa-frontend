import { Card, CardContent } from "@/components/ui/card"
import { Layers, CheckCircle2, Timer, PlayCircle, ArrowUpRight } from "lucide-react"
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
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
      description: "Across all categories"
    },
    {
      label: "Completed",
      value: summary.completed,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      description: "Successfully finished"
    },
    {
      label: "In Progress",
      value: summary.inProgress,
      icon: Timer,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      description: "Currently learning"
    },
    {
      label: "Not Started",
      value: summary.notStarted,
      icon: PlayCircle,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-100",
      description: "Waiting for you"
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className={cn(
            "group relative overflow-hidden border-2 transition-all duration-300",
            "hover:shadow-xl hover:-translate-y-1",
            stat.borderColor
          )}>
            <div className={cn("absolute top-0 right-0 w-24 h-24 -translate-y-12 translate-x-12 rounded-full opacity-10 transition-transform group-hover:scale-150", stat.bgColor)}></div>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className={cn("rounded-2xl p-3 transition-colors duration-300", stat.bgColor, stat.color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className={cn("text-3xl font-bold tracking-tight", stat.color)}>
                      {stat.value}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground mt-1 tracking-tight">{stat.label}</p>
                  <p className="text-[11px] text-muted-foreground/70 uppercase font-bold tracking-widest mt-0.5">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

