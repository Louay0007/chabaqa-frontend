import {
  CheckCircle2,
  PlayCircle,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react"

interface ProgressHeaderProps {
  summary: {
    totalItems: number
    completed: number
    inProgress: number
    notStarted: number
  }
  communityName?: string
}

export default function ProgressHeader({
  summary,
  communityName,
}: ProgressHeaderProps) {
  const completionRate =
    summary.totalItems > 0
      ? Math.round((summary.completed / summary.totalItems) * 100)
      : 0

  return (
    <section className="mb-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 via-primary/85 to-primary/80 p-6 text-white shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-10 -bottom-12 h-32 w-32 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
              <Target className="h-3.5 w-3.5" />
              Progress Overview
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">
              My Progress
            </h1>
            <p className="max-w-2xl text-sm text-white/90 md:text-base">
              {communityName
                ? `Track your learning journey across ${communityName}.`
                : "Track your learning journey across courses, challenges, sessions, and events."}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 lg:w-auto lg:min-w-[360px]">
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-white/80">
                <TrendingUp className="h-3.5 w-3.5" />
                Overall
              </div>
              <p className="text-xl font-bold">{completionRate}%</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-white/80">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
              </div>
              <p className="text-xl font-bold">{summary.completed}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-white/80">
                <Timer className="h-3.5 w-3.5" />
                In Progress
              </div>
              <p className="text-xl font-bold">{summary.inProgress}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-white/80">
                <PlayCircle className="h-3.5 w-3.5" />
                Remaining
              </div>
              <p className="text-xl font-bold">{summary.notStarted}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
