import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer } from "recharts"
import { TrendingUp, MessageSquare } from "lucide-react"

interface AnalyticsChartsProps {
  membershipData: any[]
  engagementData: any[]
  handleSyncAnalytics: () => void
}

export function AnalyticsCharts({ membershipData, engagementData, handleSyncAnalytics }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Performance Trend</CardTitle>
              <CardDescription className="text-sm text-slate-500 mt-1">Views and completions over time</CardDescription>
            </div>
            {membershipData.length > 0 && (
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></div>
                  <span className="text-slate-600">Views</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></div>
                  <span className="text-slate-600">Completions</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {membershipData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={membershipData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                  labelStyle={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}
                  cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorViews)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                />
                <Area
                  type="monotone"
                  dataKey="completes"
                  name="Completions"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCompletions)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex flex-col items-center justify-center text-slate-500 space-y-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
                <TrendingUp className="w-8 h-8 text-slate-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-700">No trend data available</p>
                <p className="text-xs text-slate-500">Wait for more activity or try syncing</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleSyncAnalytics()} className="text-xs mt-2 bg-white">
                Sync data now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Engagement Activity</CardTitle>
              <CardDescription className="text-sm text-slate-500 mt-1">Starts vs Completions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {engagementData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                  labelStyle={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-sm font-medium text-slate-600 ml-1.5">{value}</span>}
                  wrapperStyle={{ paddingBottom: '10px' }}
                />
                <Bar
                  dataKey="starts"
                  name="Starts"
                  fill="#818cf8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="completes"
                  name="Completions"
                  fill="#34d399"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex flex-col items-center justify-center text-slate-500 space-y-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-700">No activity data available</p>
                <p className="text-xs text-slate-500">Starts and completions will appear here</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
