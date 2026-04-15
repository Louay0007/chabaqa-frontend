import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { RefreshCw, Play, Star, Users, CheckCircle2, ChevronRight, BarChart2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { AnalyticsAiInsights } from "./analytics-ai-insights"

interface AnalyticsDetailedProps {
  detailsTab: "overview" | "details"
  setDetailsTab: (tab: "overview" | "details") => void
  selectedFeature: string
  topItems: any[]
  selectedItemId: string | null
  setSelectedItemId: (id: string | null) => void
  setSelectedItemTitle: (title: string | null) => void
  setFunnelData: (data: any) => void
  setStepFunnelData: (data: any) => void
  setFocusStepId: (id: string | null) => void
  setAiInsights: (data: any) => void
  setAiInsightsMeta: (meta: any) => void
  setAiTab: (tab: any) => void
  setFunnelError: (error: string | null) => void
  overview: any
  toNumber: (val: any) => number
  selectedItemTitle: string | null
  isFunnelLoading: boolean
  funnelError: string | null
  funnelData: any
  selectedContentType: string
  focusStepId: string | null
  stepFunnelData: any
  aiInsights: any
  aiInsightsMeta: any
  aiTab: any
  isInsightsLoading: boolean
  focusStepTitle: string | null
  handleGenerateInsights: () => void
  loadSelectedFunnel: () => Promise<void>
  copyToClipboard: (text: string, msg: string) => Promise<void>
  tryParseJsonObject: (input: any) => any
  toHumanParagraph: (input: any) => string
}

export function AnalyticsDetailed({
  detailsTab,
  setDetailsTab,
  selectedFeature,
  topItems,
  selectedItemId,
  setSelectedItemId,
  setSelectedItemTitle,
  setFunnelData,
  setStepFunnelData,
  setFocusStepId,
  setAiInsights,
  setAiInsightsMeta,
  setAiTab,
  setFunnelError,
  overview,
  toNumber,
  selectedItemTitle,
  isFunnelLoading,
  funnelError,
  funnelData,
  selectedContentType,
  focusStepId,
  stepFunnelData,
  aiInsights,
  aiInsightsMeta,
  aiTab,
  isInsightsLoading,
  focusStepTitle,
  handleGenerateInsights,
  loadSelectedFunnel,
  copyToClipboard,
  tryParseJsonObject,
  toHumanParagraph
}: AnalyticsDetailedProps) {
  const router = useRouter()

  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden">
      <Tabs value={detailsTab} onValueChange={(value) => setDetailsTab(value as "overview" | "details")} className="w-full">
        <CardHeader className="p-0 border-b border-slate-100 bg-slate-50/50">
          <TabsList className="w-full justify-start h-14 bg-transparent p-0 rounded-none">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none px-6 text-sm font-semibold h-full transition-all text-slate-500 data-[state=active]:text-indigo-700"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none px-6 text-sm font-semibold h-full transition-all text-slate-500 data-[state=active]:text-indigo-700"
            >
              Detailed Breakdown
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <TabsContent value="overview" className="m-0 p-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              Top {selectedFeature.charAt(0).toUpperCase() + selectedFeature.slice(1)}
            </h3>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="flex-1">Title</div>
                <div className="w-24 text-right">Views</div>
                <div className="w-24 text-right">Starts</div>
                <div className="w-24 text-right">Completes</div>
                {selectedFeature === "courses" && (
                  <div className="w-32 text-right">Ch. Completes</div>
                )}
                <div className="w-24 text-right pr-2">Conv. Rate</div>
              </div>
              
              <div className="divide-y divide-slate-100">
                {topItems.length > 0 ? (
                  topItems.map((item, index) => {
                    const rowId = String(item.contentId || item.id || "").trim()
                    const rowTitle = String(item.title || item.name || `Item ${index + 1}`)
                    const isSelected = Boolean(rowId && selectedItemId && rowId === selectedItemId)

                    return (
                      <div
                        key={rowId || item.id || index}
                        className={`flex items-center px-5 py-4 transition-all duration-200 cursor-pointer ${
                          isSelected 
                            ? "bg-indigo-50/50 border-l-2 border-l-indigo-500 pl-[18px]" 
                            : "hover:bg-slate-50 border-l-2 border-l-transparent pl-5"
                        }`}
                        onClick={() => {
                          if (!rowId) return
                          setSelectedItemId(rowId)
                          setSelectedItemTitle(rowTitle)
                          setFunnelData(null)
                          setStepFunnelData(null)
                          setFocusStepId(null)
                          setAiInsights(null)
                          setFunnelError(null)
                          setDetailsTab("details")
                        }}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                            {rowTitle}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 font-mono bg-slate-100 px-1.5 py-0.5 rounded w-max">
                            {item.contentId || item.id || 'N/A'}
                          </p>
                        </div>
                        <div className="w-24 text-right text-sm font-medium text-slate-600">{item.views?.toLocaleString() || 0}</div>
                        <div className="w-24 text-right text-sm font-medium text-slate-600">{item.starts?.toLocaleString() || 0}</div>
                        <div className="w-24 text-right text-sm font-medium text-slate-600">{item.completes?.toLocaleString() || 0}</div>
                        {selectedFeature === "courses" && (
                          <div className="w-32 text-right text-sm font-medium text-slate-600">{item.chapterCompletes?.toLocaleString() || 0}</div>
                        )}
                        <div className="w-24 text-right pr-2 flex items-center justify-end">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold ${
                            item.completionRate > 50 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : item.completionRate > 20
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.completionRate ? `${Math.round(item.completionRate)}%` : '0%'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-16 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <BarChart2 className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No top {selectedFeature} found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your time range</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="m-0 p-6 pt-5 bg-slate-50/30">
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedFeature === 'courses' && (
              <>
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Completion Rate
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {overview?.completionRate || overview?.courseCompletionRate || '0'}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Play className="w-4 h-4 text-indigo-500" />
                      Chapter Completes
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {toNumber(overview?.chapterCompletes).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <RefreshCw className="w-4 h-4 text-amber-500" />
                      Avg. Duration
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {overview?.avgDuration || overview?.averageDuration || '0'} mins
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
            {selectedFeature === 'challenges' && (
              <>
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Completion Rate
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {overview?.challengeCompletionRate || overview?.completionRate || '0'}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Users className="w-4 h-4 text-indigo-500" />
                      Avg. Submissions
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {overview?.avgSubmissions || (overview?.submissions && topItems.length > 0 ? Math.round(overview.submissions / topItems.length) : 0) || '0'}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
            {selectedFeature === 'events' && (
              <>
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Users className="w-4 h-4 text-indigo-500" />
                      Attendance Rate
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {overview?.attendanceRate || '0'}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <RefreshCw className="w-4 h-4 text-amber-500" />
                      Avg. Duration
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {overview?.avgDurationHours || overview?.averageDuration || '0'}h
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
            {selectedFeature === 'products' && (
              <>
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Star className="w-4 h-4 text-yellow-400" />
                      Average Rating
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {overview?.avgRating || overview?.averageRating || '0'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Customer Satisfaction
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {overview?.customerSatisfaction || '0'}%
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="max-w-md">
                <h4 className="text-lg font-bold text-slate-900">Drop-off & Conversion Insights</h4>
                <p className="text-sm text-slate-500 mt-1">Select an item below to view detailed funnel steps, drop-off rates, and generate AI insights for optimization.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                <Select
                  value={selectedItemId || ""}
                  onValueChange={(value) => {
                    const nextId = String(value || "").trim()
                    if (!nextId) return
                    const row = topItems.find((it) => String(it.contentId || it.id || "").trim() === nextId)
                    setSelectedItemId(nextId)
                    setSelectedItemTitle(row ? String(row.title || row.name || "").trim() : null)
                    setFunnelData(null)
                    setStepFunnelData(null)
                    setFocusStepId(null)
                    setAiInsights(null)
                    setFunnelError(null)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[280px] h-11 bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select item to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {topItems
                      .map((item, idx) => ({
                        id: String(item.contentId || item.id || "").trim(),
                        label: String(item.title || item.name || `Item ${idx + 1}`),
                      }))
                      .filter((row) => Boolean(row.id))
                      .map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleGenerateInsights} 
                  disabled={!selectedItemId || isInsightsLoading} 
                  className="gap-2 h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${isInsightsLoading ? "animate-spin" : ""}`} />
                  {isInsightsLoading ? "Generating..." : "Generate AI Insights"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                  <CardTitle className="text-base font-bold text-slate-900">
                    Funnel Overview
                    {selectedItemTitle && <span className="font-normal text-slate-500 ml-1 block text-sm mt-0.5">{selectedItemTitle}</span>}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadSelectedFunnel()}
                    disabled={!selectedItemId || isFunnelLoading}
                    className="gap-2 h-9 text-xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isFunnelLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent className="p-5">
                  {funnelError ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-start gap-3">
                      <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                      {funnelError}
                    </div>
                  ) : isFunnelLoading ? (
                    <div className="h-[280px] flex flex-col items-center justify-center text-slate-500 space-y-3">
                      <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" /> 
                      <span className="font-medium text-sm">Loading funnel data...</span>
                    </div>
                  ) : funnelData ? (
                    <>
                      <div className="h-[240px] mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={(funnelData.funnel || []).map((step: any) => ({
                              name: step.stepLabel,
                              users: Number(step.uniqueUsers ?? 0),
                            }))}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={8} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                            />
                            <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-2.5">
                        {(funnelData.funnel || []).map((step: any, index: number) => {
                          const isRevenue = step.stepKey === "revenue"
                          const primaryValue = isRevenue
                            ? `${Number(step.events || 0).toLocaleString()} ${funnelData.contentMeta?.currency || "TND"}`
                            : Number(step.uniqueUsers ?? 0).toLocaleString()
                          
                          const rateNum = step.rateFromPrev
                          const rate = rateNum == null ? null : `${Math.round(rateNum * 100)}%`
                          
                          return (
                            <div key={step.stepKey} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                                  {index + 1}
                                </span>
                                <span className="font-semibold text-slate-700 text-sm">{step.stepLabel}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-bold text-slate-900">{primaryValue}</span>
                                <div className="w-16 text-right">
                                  {rate ? (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                      rateNum > 0.7 ? 'bg-emerald-100 text-emerald-700' :
                                      rateNum > 0.4 ? 'bg-amber-100 text-amber-700' :
                                      'bg-rose-100 text-rose-700'
                                    }`}>
                                      {rate}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-medium">—</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {Array.isArray(funnelData.warnings) && funnelData.warnings.length > 0 ? (
                        <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Warnings</p>
                          {funnelData.warnings.slice(0, 3).map((w: string) => (
                            <p key={w} className="text-xs text-amber-700 flex items-start gap-2">
                              <span className="mt-1 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                              {w}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <BarChart2 className="h-8 w-8" />
                      </div>
                      <span className="font-medium text-sm">Select an item above to load funnel</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                  <CardTitle className="text-base font-bold text-slate-900">Step Drop-off Analysis</CardTitle>
                  {selectedContentType === "course" && focusStepId ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/creator/courses/${encodeURIComponent(String(selectedItemId || ""))}/manage?tab=content&chapterId=${encodeURIComponent(String(focusStepId))}`)}
                      className="h-8 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      Edit Content <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent className="p-5">
                  {selectedContentType === "course" || selectedContentType === "challenge" ? (
                    stepFunnelData && Array.isArray((stepFunnelData as any).items) ? (
                      <>
                        {(() => {
                          const items = (stepFunnelData as any).items
                            .filter((it: any) => Number(it.uniqueStarts || 0) > 0)
                            .sort((a: any, b: any) => Number(b.dropOffRate || 0) - Number(a.dropOffRate || 0))
                            .slice(0, 6)

                          if (items.length === 0) {
                            return (
                              <div className="py-12 text-center text-sm font-medium text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                No step-level drop-off data available yet.
                              </div>
                            )
                          }

                          return (
                            <div className="space-y-3">
                              {items.map((it: any) => {
                                const isFocused = focusStepId && String(focusStepId) === String(it.stepId)
                                const dropRate = Number(it.dropOffRate || 0)
                                const percent = Math.round(dropRate * 100)
                                
                                return (
                                  <div
                                    key={it.stepId}
                                    className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all duration-200 group ${
                                      isFocused 
                                        ? "border-indigo-300 bg-indigo-50/50 shadow-sm" 
                                        : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                                    }`}
                                    onClick={() => {
                                      setFocusStepId(String(it.stepId))
                                      setAiInsights(null)
                                      setAiInsightsMeta(null)
                                      setAiTab("summary")
                                    }}
                                  >
                                    <div className="min-w-0 pr-4 flex-1">
                                      <p className={`font-bold truncate ${isFocused ? 'text-indigo-900' : 'text-slate-900 group-hover:text-indigo-700 transition-colors'}`} dir="auto">
                                        {it.stepTitle}
                                      </p>
                                      <div className="flex gap-4 mt-2">
                                        <div className="text-[11px] font-medium text-slate-500 flex flex-col">
                                          <span className="uppercase text-[9px] tracking-wider text-slate-400 mb-0.5">Starts</span>
                                          <span className="text-slate-700">{Number(it.uniqueStarts || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-500 flex flex-col">
                                          <span className="uppercase text-[9px] tracking-wider text-slate-400 mb-0.5">Completes</span>
                                          <span className="text-slate-700">{Number(it.uniqueCompletes || 0).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                      <div className={`text-lg font-black ${
                                        percent > 50 ? 'text-rose-600' :
                                        percent > 25 ? 'text-amber-600' :
                                        'text-emerald-600'
                                      }`}>
                                        {percent}%
                                      </div>
                                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Drop-off</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}

                        {Array.isArray((stepFunnelData as any).warnings) && (stepFunnelData as any).warnings.length > 0 ? (
                          <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                            {(stepFunnelData as any).warnings.slice(0, 3).map((w: string) => (
                              <p key={w} className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                {w}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 space-y-3">
                        <div className="p-4 bg-slate-50 rounded-full">
                          <BarChart2 className="h-8 w-8" />
                        </div>
                        <span className="font-medium text-sm">Select an item above to analyze drop-off</span>
                      </div>
                    )
                  ) : (
                    <div className="py-12 text-center text-sm font-medium text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Step-by-step drop-off analysis is only available for Courses and Challenges.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {aiInsights && (
              <AnalyticsAiInsights
                aiInsights={aiInsights}
                aiInsightsMeta={aiInsightsMeta}
                aiTab={aiTab}
                setAiTab={setAiTab}
                selectedItemTitle={selectedItemTitle}
                selectedItemId={selectedItemId}
                focusStepId={focusStepId}
                focusStepTitle={focusStepTitle}
                copyToClipboard={copyToClipboard}
                setAiInsights={setAiInsights}
                setAiInsightsMeta={setAiInsightsMeta}
                tryParseJsonObject={tryParseJsonObject}
                toHumanParagraph={toHumanParagraph}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
