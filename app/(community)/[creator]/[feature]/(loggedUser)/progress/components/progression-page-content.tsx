"use client"

import { useCallback, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { progressionApi } from "@/lib/api/progression.api"
import type {
  Community,
  ProgressionContentType,
  ProgressionItem,
  ProgressionOverview,
} from "@/lib/api/types"
import ProgressHeader from "./progress-header"
import ProgressStatsGrid from "./progress-stats-grid"
import ProgressByType from "./progress-by-type"
import ProgressTabs from "./progress-tabs"
import ProgressItemCard from "./progress-item-card"

type TypeFilter = "all" | ProgressionContentType

const DEFAULT_LIMIT = 12

interface ProgressionPageContentProps {
  slug: string
  community: Community
  initialData: ProgressionOverview
}

export default function ProgressionPageContent({
  slug,
  community,
  initialData,
}: ProgressionPageContentProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<ProgressionItem[]>(initialData.items || [])
  const [summary, setSummary] = useState(initialData.summary)
  const [pagination, setPagination] = useState(initialData.pagination)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const activeLimit = pagination?.limit || DEFAULT_LIMIT

  const filteredItems = useMemo(() => {
    let result = [...items]
    if (typeFilter !== "all") {
      result = result.filter((item) => item.contentType === typeFilter)
    }
    if (searchQuery.trim().length > 0) {
      const term = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          (item.meta &&
            Object.values(item.meta).some((value) =>
              String(value).toLowerCase().includes(term),
            )),
      )
    }
    return result
  }, [items, typeFilter, searchQuery])

  const hasMore =
    (pagination?.page || 1) < (pagination?.totalPages || 1) &&
    !isLoading &&
    !isLoadingMore

  const fetchProgress = useCallback(
    async (options?: { page?: number; append?: boolean }) => {
      const pageToFetch = options?.page ?? 1
      const append = options?.append ?? false
      const params = {
        communitySlug: slug,
        page: pageToFetch,
        limit: activeLimit,
        contentTypes:
          typeFilter === "all" ? undefined : ([typeFilter] as ProgressionContentType[]),
      }

      const response = await progressionApi.getOverview(params)

      setSummary(response.summary)
      setPagination(response.pagination)

      setItems((prev) => {
        if (!append) {
          return response.items
        }
        const existingKeys = new Set(
          prev.map((item) => `${item.contentType}-${item.contentId}`),
        )
        const merged = [...prev]
        response.items.forEach((item) => {
          const key = `${item.contentType}-${item.contentId}`
          if (!existingKeys.has(key)) {
            merged.push(item)
          }
        })
        return merged
      })
    },
    [slug, typeFilter, activeLimit],
  )

  const handleTypeChange = useCallback(
    async (value: string) => {
      setTypeFilter(value as TypeFilter)
      setIsLoading(true)
      try {
        await fetchProgress({ page: 1, append: false })
      } catch (error) {
        console.error(error)
        toast({
          variant: "destructive",
          title: "Unable to load data",
          description: "Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchProgress, toast],
  )

  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetchProgress({ page: 1, append: false })
      toast({
        title: "Progress updated",
        description: "Latest progression stats have been loaded.",
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "We couldn't refresh your progress. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [fetchProgress, toast])

  const handleLoadMore = useCallback(async () => {
    if (!hasMore) return
    setIsLoadingMore(true)
    try {
      await fetchProgress({ page: (pagination?.page || 1) + 1, append: true })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Unable to load more",
        description: "Please try again.",
      })
    } finally {
      setIsLoadingMore(false)
    }
  }, [fetchProgress, hasMore, pagination?.page, toast])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ProgressHeader summary={summary} />
        
        <ProgressStatsGrid summary={summary} />

        <ProgressByType summary={summary} />

        <ProgressTabs
          typeFilter={typeFilter}
          onTypeChange={handleTypeChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          summary={summary}
        />

        <div className="space-y-4">
          {isLoading ? (
            <Card className="border border-dashed">
              <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Updating your progress...
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card className="border border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-lg font-semibold">No progress to display yet</p>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground mx-auto">
                  Start a course, join a challenge, or register for an event to see your
                  activity here. We'll keep this space updated as you make progress.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4">
                {filteredItems.map((item) => (
                  <ProgressItemCard
                    key={`${item.contentType}-${item.contentId}`}
                    item={item}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="min-w-[180px]"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading more
                      </>
                    ) : (
                      "Load more items"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

