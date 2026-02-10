import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Flag,
  Users,
  CalendarDays,
  ShoppingBag,
  MessageSquare,
  FileText,
  Building2,
  Repeat,
  Sparkles,
  Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProgressionContentType, ProgressionSummary } from "@/lib/api/types"

interface ProgressByTypeProps {
  summary: ProgressionSummary
}

const TYPE_METADATA: Record<string, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
  course: { label: "Courses", icon: BookOpen, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-100" },
  challenge: { label: "Challenges", icon: Flag, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-100" },
  session: { label: "Sessions", icon: Users, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-100" },
  event: { label: "Events", icon: CalendarDays, color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-100" },
  product: { label: "Products", icon: ShoppingBag, color: "text-pink-600", bgColor: "bg-pink-50", borderColor: "border-pink-100" },
  post: { label: "Posts", icon: MessageSquare, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-100" },
  resource: { label: "Resources", icon: FileText, color: "text-slate-600", bgColor: "bg-slate-50", borderColor: "border-slate-100" },
  community: { label: "Communities", icon: Building2, color: "text-cyan-600", bgColor: "bg-cyan-50", borderColor: "border-cyan-100" },
  subscription: { label: "Subscriptions", icon: Repeat, color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-100" },
}

export default function ProgressByType({ summary }: ProgressByTypeProps) {
  const activeTypes = Object.entries(summary.byType || {})
    .filter(([, data]) => (data?.total ?? 0) > 0)
    .sort((a, b) => (b[1]?.total ?? 0) - (a[1]?.total ?? 0))

  if (activeTypes.length === 0) return null

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Category Breakdown</h2>
          <p className="text-sm text-muted-foreground font-medium">Detailed progress by content type</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTypes.map(([type, data]) => {
          const meta = TYPE_METADATA[type] || { 
            label: type, 
            icon: Layers, 
            color: "text-slate-600", 
            bgColor: "bg-slate-50",
            borderColor: "border-slate-100"
          }
          const Icon = meta.icon
          const completionRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
          
          return (
            <Card key={type} className="group overflow-hidden border-2 border-border/40 hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-lg bg-white/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300 shadow-sm", meta.bgColor, meta.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground/80">{meta.label}</h3>
                      <p className="text-sm font-bold text-foreground">{data.total} Items</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("font-bold border-2 px-2.5 py-0.5", 
                    completionRate === 100 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                    completionRate > 0 ? "bg-blue-50 text-blue-700 border-blue-100" : 
                    "bg-slate-50 text-slate-700 border-slate-100"
                  )}>
                    {completionRate}%
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex gap-4 text-foreground/70">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {data.completed} Done
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {data.inProgress} Active
                      </span>
                    </div>
                    <span className="text-muted-foreground/60">{data.total - data.completed - data.inProgress} Left</span>
                  </div>
                  <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-in-out rounded-full z-10"
                      style={{ width: `${(data.completed / data.total) * 100}%` }}
                    />
                    <div 
                      className="absolute top-0 left-0 h-full bg-blue-400 transition-all duration-1000 ease-in-out opacity-40"
                      style={{ width: `${((data.completed + data.inProgress) / data.total) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
