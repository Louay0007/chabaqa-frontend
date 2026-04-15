import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, BarChart2 } from "lucide-react"

interface AnalyticsHeaderProps {
  communities: any[]
  selectedCommunityId: string | null
  setSelectedCommunityId: (id: string) => void
  selectedFeature: string
  setSelectedFeature: (feature: any) => void
  timeRange: string
  setTimeRange: (range: any) => void
  isExporting: boolean
  isSyncing: boolean
  isInitialLoading: boolean
  isRefreshing: boolean
  lastUpdatedAt: string | null
  loadError: string | null
  handleExportCsv: () => void
  handleSyncAnalytics: () => void
}

export function AnalyticsHeader({
  communities,
  selectedCommunityId,
  setSelectedCommunityId,
  selectedFeature,
  setSelectedFeature,
  timeRange,
  setTimeRange,
  isExporting,
  isSyncing,
  isInitialLoading,
  isRefreshing,
  lastUpdatedAt,
  loadError,
  handleExportCsv,
  handleSyncAnalytics
}: AnalyticsHeaderProps) {
  return (
    <div className="mb-8 lg:mb-10 space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1.5 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Analytics</h1>
          </div>
          <p className="text-sm sm:text-base text-slate-500 pl-[3.25rem]">
            Track, analyze and optimize your community's performance
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 items-center">
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={selectedCommunityId || ""} onValueChange={setSelectedCommunityId}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors h-11">
                <SelectValue placeholder="Select Community" />
              </SelectTrigger>
              <SelectContent>
                {communities.map((community: any) => {
                  const id = (community.id || community._id || "").toString()
                  const name = community.name || community.slug || id
                  return (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            <Select value={selectedFeature} onValueChange={setSelectedFeature}>
              <SelectTrigger className="w-full sm:w-[150px] bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors h-11">
                <SelectValue placeholder="Feature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="courses">Courses</SelectItem>
                <SelectItem value="challenges">Challenges</SelectItem>
                <SelectItem value="sessions">Sessions</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="posts">Posts</SelectItem>
                <SelectItem value="products">Products</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[140px] bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors h-11">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="28d">Last 28 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
              onClick={handleExportCsv}
              disabled={isExporting || isInitialLoading}
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </Button>

            <Button
              variant="default"
              className="h-11 px-5 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium transition-all"
              onClick={() => handleSyncAnalytics()}
              disabled={isSyncing || isInitialLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRefreshing || isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          {isRefreshing || isSyncing ? 'Syncing live data...' : 'Live data synced'}
        </div>
        {lastUpdatedAt && (
          <span className="text-slate-400 border-l border-slate-300 pl-4">
            Last updated: {new Date(lastUpdatedAt).toLocaleTimeString()}
          </span>
        )}
        {loadError && (
          <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {loadError}
          </span>
        )}
      </div>
    </div>
  )
}
