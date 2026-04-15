import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { Smartphone, Monitor, Globe, RefreshCw } from "lucide-react"

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6']

interface AnalyticsDevicesSourcesProps {
  isSupplementalLoading: boolean
  devicesData: any[]
  deviceDetails: any[]
  referrersData: any[]
  referrersSummary: any
  getReferrerChannelMeta: (channel?: string) => any
  formatDeviceUserLabel: (row: any) => string
  formatDeviceLastSeen: (val?: string) => string
  formatReferrerLastSeen: (val?: string) => string
}

export function AnalyticsDevicesSources({
  isSupplementalLoading,
  devicesData,
  deviceDetails,
  referrersData,
  referrersSummary,
  getReferrerChannelMeta,
  formatDeviceUserLabel,
  formatDeviceLastSeen,
  formatReferrerLastSeen
}: AnalyticsDevicesSourcesProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
      <Card className="shadow-sm border-slate-200 flex flex-col">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-lg font-semibold text-slate-900">Audience Devices</CardTitle>
          <CardDescription className="text-sm text-slate-500 mt-1">Device mix and tracked user sessions in one view</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex-1 flex flex-col">
          {isSupplementalLoading && devicesData.length === 0 && deviceDetails.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 min-h-[300px]">
              <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100">
                <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
              <p className="text-sm font-medium">Loading device data...</p>
            </div>
          ) : devicesData.length > 0 || deviceDetails.length > 0 ? (
            <div className="flex flex-col h-full">
              {devicesData.length > 0 ? (
                <>
                  <div className="h-[240px] w-full flex items-center justify-center relative mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={devicesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={4}
                        >
                          {devicesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '13px', fontWeight: 500 }}
                          formatter={(value: number) => [value.toLocaleString(), 'Users']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-bold text-slate-900 tracking-tight">
                        {devicesData.reduce((acc, curr) => acc + (curr.value || 0), 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-1">Total Users</span>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                    {[...devicesData].sort((a, b) => b.value - a.value).map((device, index) => {
                      const total = devicesData.reduce((acc, curr) => acc + (curr.value || 0), 0);
                      const percentage = total > 0 ? (device.value / total) * 100 : 0;
                      const color = COLORS[index % COLORS.length];

                      let Icon = Smartphone;
                      if (device.name.toLowerCase().includes('desktop') || device.name.toLowerCase().includes('laptop')) Icon = Monitor;

                      return (
                        <div key={index} className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-slate-700 capitalize">{device.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-slate-900">{device.value.toLocaleString()}</span>
                              <span className="text-slate-500 w-10 text-right font-medium">{Math.round(percentage)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden ml-10.5" style={{ width: 'calc(100% - 42px)', marginLeft: '42px' }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 mb-4 text-xs text-slate-500 text-center">
                  No aggregate device category data was returned for the selected period.
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-900">Tracked Users & Devices</h4>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{deviceDetails.length} records</span>
                </div>

                {deviceDetails.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <div className="max-h-[260px] overflow-y-auto">
                      {deviceDetails.map((entry, index) => {
                        const userLabel = formatDeviceUserLabel(entry)
                        const secondaryIdentity =
                          (entry.userEmail && entry.userEmail !== userLabel)
                          ? entry.userEmail
                          : (entry.userId || "No identifier")
                        const deviceLabel = entry.deviceModel || entry.device || "N/A"
                        const environment = [entry.os || "N/A", entry.browser || "N/A"].join(" / ")

                        return (
                          <div key={`${entry.userId || "unknown"}-${entry.ipAddress || "no-ip"}-${index}`} className="border-b border-slate-100 last:border-b-0 p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between gap-3 mb-2.5">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{userLabel}</p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{secondaryIdentity}</p>
                              </div>
                              <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 border border-slate-200 whitespace-nowrap shadow-sm">
                                {entry.eventsCount.toLocaleString()} events
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px] font-medium">
                              <span className="inline-flex items-center rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5">
                                {deviceLabel}
                              </span>
                              <span className="inline-flex items-center rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5">
                                {environment}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 text-center">
                    No per-user device records found for the selected period.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 min-h-[300px]">
              <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
                <Smartphone className="w-8 h-8 text-slate-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-700">No device data available</p>
                <p className="text-xs text-slate-500">User sessions will appear here</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">Traffic Sources</CardTitle>
          <CardDescription className="text-sm text-slate-500 mt-1">
            Top referrers driving traffic from tracked backend events
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {isSupplementalLoading && referrersData.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-slate-500 space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100">
                <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
              <p className="text-sm font-medium">Loading traffic sources...</p>
            </div>
          ) : referrersData.length > 0 ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Events</p>
                  <p className="text-xl font-bold text-slate-900">{(referrersSummary?.totalEvents || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Sources</p>
                  <p className="text-xl font-bold text-slate-900">{(referrersSummary?.sources || referrersData.length).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Top Channel</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-slate-900">
                      {getReferrerChannelMeta(referrersSummary?.topChannel).label}
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
                {referrersData.map((ref, idx) => {
                  const channelMeta = getReferrerChannelMeta(ref.channel)
                  const SourceIcon = channelMeta.Icon
                  const sourceLabel = ref.source || ref.referrer || "Direct"
                  const safeShare = Number.isFinite(ref.share) ? Math.max(0, Math.min(100, ref.share)) : 0
                  const barWidth = safeShare > 0 ? Math.max(safeShare, 3) : 0

                  return (
                    <div key={`${sourceLabel}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex items-start gap-3.5">
                          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${channelMeta.classes} shadow-sm group-hover:scale-105 transition-transform`}>
                            <SourceIcon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 pt-0.5">
                            <p className="text-sm font-bold text-slate-900 truncate">{sourceLabel}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-medium tracking-wide">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 ${channelMeta.classes} border opacity-90`}>
                                {channelMeta.label.toUpperCase()}
                              </span>
                              {ref.utm_campaign && (
                                <span className="inline-flex items-center rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5">
                                  {ref.utm_campaign}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-base font-bold text-slate-900">{ref.count.toLocaleString()}</p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">{safeShare.toFixed(safeShare >= 10 ? 0 : 1)}%</p>
                        </div>
                      </div>

                      <div className="mt-3.5 w-full rounded-full bg-slate-100 h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${channelMeta.classes.split(' ')[0].replace('bg-', 'bg-').replace('-50', '-500')}`}
                          style={{ width: `${barWidth}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-slate-500 space-y-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
                <Globe className="w-8 h-8 text-slate-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-700">No traffic sources available</p>
                <p className="text-xs text-slate-500">Referral data will appear here once tracked</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
