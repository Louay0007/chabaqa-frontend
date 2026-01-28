import { Target, CheckCircle2, Clock, PlayCircle } from "lucide-react"

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
            <h1 className="text-2xl font-bold">My Progress</h1>
          </div>
          <p className="text-white/90 text-sm md:ml-2">
            Track your learning journey and celebrate your achievements
          </p>
        </div>

        {/* Stats horizontal */}
        <div className="relative z-10 flex space-x-6 mt-4 md:mt-0">
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.totalItems}</div>
            <div className="text-white/80 text-xs">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.completed}</div>
            <div className="text-white/80 text-xs">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.inProgress}</div>
            <div className="text-white/80 text-xs">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="text-white/80 text-xs">Completion</div>
          </div>
        </div>
      </div>
    </div>
  )
}

