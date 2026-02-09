import { Target, CheckCircle2, Clock, PlayCircle, TrendingUp, Award, BarChart3 } from "lucide-react"

interface ProgressHeaderProps {
  summary: {
    totalItems: number
    completed: number
    inProgress: number
    notStarted: number
  }
}

export default function ProgressHeader({ summary }: ProgressHeaderProps) {
  const completionRate = summary.totalItems > 0 
    ? Math.round((summary.completed / summary.totalItems) * 100) 
    : 0

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-primary/90 via-primary/80 to-primary/70 rounded-xl p-6 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        {/* Background circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

        {/* Title & subtitle */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2">
            <Target className="h-6 w-6" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              My Progress
              <Award className="h-8 w-8 text-yellow-300 animate-pulse" />
            </h1>
            <p className="text-white/90 text-lg max-w-xl leading-relaxed">
              Track your learning journey, visualize your growth, and celebrate your milestones in one place.
            </p>
          </div>
          
          {/* Quick Stats Bar */}
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
              <BarChart3 className="h-4 w-4 text-blue-200" />
              <span className="text-sm font-normal">{completionRate}% Overall Completion</span>
            </div>
          </div>
        </div>

        {/* Visualization / Large Stat */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="relative h-40 w-40 md:h-48 md:w-48">
            {/* Circular Progress (SVG) */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                className="text-white/20"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
              <circle
                className="text-white transition-all duration-1000 ease-in-out"
                strokeWidth="8"
                strokeDasharray={42 * 2 * Math.PI}
                strokeDashoffset={42 * 2 * Math.PI * (1 - completionRate / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl md:text-5xl font-bold tracking-tighter">{completionRate}%</span>
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-widest text-white/80">Goal Reach</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
