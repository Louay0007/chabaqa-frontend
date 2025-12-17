"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, RefreshCw, Loader2 } from "lucide-react"
import type { ProgressionContentType, ProgressionSummary } from "@/lib/api/types"

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
  community: { label: "Community" },
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
    <div className="space-y-4 mb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-1">Your Learning Timeline</h2>
          <p className="text-sm text-muted-foreground">
            Track everything you've started and jump back in where you left off
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="w-full sm:max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by title, topic, or status"
                className="pl-9"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={typeFilter} onValueChange={onTypeChange}>
        <TabsList className="w-full justify-start overflow-x-auto rounded-full bg-muted/50 p-1">
          <TabsTrigger value="all" className="px-4">
            All ({summary.totalItems ?? 0})
          </TabsTrigger>
          {activeTypes.map((type) => (
            <TabsTrigger key={type} value={type} className="px-4 capitalize">
              {TYPE_CONFIG[type]?.label ?? type}
              <span className="ml-1 text-xs text-muted-foreground">
                ({summary.byType?.[type]?.total ?? 0})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

