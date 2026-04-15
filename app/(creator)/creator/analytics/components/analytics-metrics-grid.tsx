import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, ArrowUpRight, TrendingDown } from "lucide-react"

export interface MetricData {
  title: string
  value: string | number
  change?: string
  icon: React.ElementType
  isPositive?: boolean
}

interface AnalyticsMetricsGridProps {
  metrics: MetricData[]
}

export function AnalyticsMetricsGrid({ metrics }: AnalyticsMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon
        const isPositive = typeof metric.change === "string" && metric.change.startsWith("+")
        const hasChange = !!metric.change
        
        return (
          <Card key={metric.title} className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className={`h-1 w-full ${idx % 2 === 0 ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">{metric.title}</p>
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900">{metric.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${idx % 2 === 0 ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'} transition-colors`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-5 flex items-center text-sm">
                {hasChange ? (
                  <div className="flex items-center gap-1.5">
                    <span className={`flex items-center gap-0.5 font-medium px-2 py-0.5 rounded-full text-xs ${
                      isPositive 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {metric.change}
                    </span>
                    <span className="text-slate-400 text-xs">vs last period</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">—</span> 
                    No period comparison
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
