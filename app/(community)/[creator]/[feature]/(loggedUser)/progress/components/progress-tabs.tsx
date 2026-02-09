import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, RefreshCw, Loader2, Filter, ListFilter } from "lucide-react"
import type { ProgressionContentType, ProgressionSummary } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const TYPE_CONFIG: Record<
  ProgressionContentType,
  { label: string }
> = {
  course: { label: "Courses" },
  challenge: { label: "Challenges" },
  session: { label: "Sessions" },
  event: { label: "Events" },
  product: { label: "Products" },
  post: { label: "Posts" },
  resource: { label: "Resources" },
  community: { label: "Communities" },
  subscription: { label: "Subscriptions" },
}

interface ProgressTabsProps {
  typeFilter: string
  onTypeChange: (value: string) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
  isLoading: boolean
  summary: ProgressionSummary
}

export default function ProgressTabs({
  typeFilter,
  onTypeChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  summary,
}: ProgressTabsProps) {
  const activeTypes = Object.entries(summary.byType || {})
    .filter(([, data]) => (data?.total ?? 0) > 0)
    .map(([key]) => key as ProgressionContentType)

  return (
    <div className="space-y-6 mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between bg-white p-6 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
            <ListFilter className="h-4 w-4" />
            Activity Filter
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Your Learning Timeline</h2>
          <p className="text-muted-foreground font-medium">
            Jump back into your active projects and track your history
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search your activity..."
              className="pl-10 h-11 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-xl font-medium"
            />
          </div>
          <Button
            variant="outline"
            size="lg"
            className="h-11 px-5 rounded-xl border-2 hover:bg-slate-50 hover:text-primary hover:border-primary/20 transition-all font-bold gap-2 shrink-0 w-full sm:w-auto"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync Progress
          </Button>
        </div>
      </div>

      <Tabs value={typeFilter} onValueChange={onTypeChange} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-slate-100/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-x-auto scrollbar-none flex-nowrap">
          <TabsTrigger 
            value="all" 
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md",
              "hover:text-primary/80"
            )}
          >
            All <span className="ml-2 px-2 py-0.5 rounded-md bg-slate-200/50 text-[10px] uppercase font-bold">{summary.totalItems ?? 0}</span>
          </TabsTrigger>
          {activeTypes.map((type) => (
            <TabsTrigger 
              key={type} 
              value={type} 
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md capitalize whitespace-nowrap",
                "hover:text-primary/80"
              )}
            >
              {TYPE_CONFIG[type]?.label ?? type}
              <span className="ml-2 px-2 py-0.5 rounded-md bg-slate-200/50 text-[10px] uppercase font-bold">
                {summary.byType?.[type]?.total ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

