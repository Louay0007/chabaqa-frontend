"use client"

import * as React from "react"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: number | string
  change?: {
    value: string
    trend: 'up' | 'down' | 'neutral'
  }
  icon?: LucideIcon
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  loading?: boolean
  onClick?: () => void
}

const colorVariants = {
  primary: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800'
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950',
    icon: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800'
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    icon: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800'
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-950',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800'
  },
  info: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800'
  }
}

export const MetricCard = React.memo(({
  title,
  value,
  change,
  icon: Icon,
  color = 'primary',
  loading = false,
  onClick
}: MetricCardProps) => {
  const colors = colorVariants[color]
  const isClickable = !!onClick

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-3" role="status" aria-label="Loading metric">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            {change && (
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            )}
            <span className="sr-only">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const content = (
    <CardContent className="p-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          {Icon && (
            <div 
              className={cn(
                "p-2 rounded-lg",
                colors.bg,
                colors.border,
                "border"
              )}
              aria-hidden="true"
            >
              <Icon className={cn("h-5 w-5", colors.icon)} />
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          {change && (
            <div className="flex items-center gap-1">
              {change.trend === 'up' && (
                <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
              )}
              {change.trend === 'down' && (
                <TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />
              )}
              <span 
                className={cn(
                  "text-sm font-medium",
                  change.trend === 'up' && "text-green-600",
                  change.trend === 'down' && "text-red-600",
                  change.trend === 'neutral' && "text-muted-foreground"
                )}
                aria-label={`${change.trend === 'up' ? 'Increased' : change.trend === 'down' ? 'Decreased' : 'No change'} by ${change.value}`}
              >
                {change.value}
              </span>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  )

  if (isClickable) {
    return (
      <Card 
        className={cn(
          "border-0 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick?.()
          }
        }}
        aria-label={`${title}: ${typeof value === 'number' ? value.toLocaleString() : value}${change ? `, ${change.trend === 'up' ? 'increased' : change.trend === 'down' ? 'decreased' : 'no change'} by ${change.value}` : ''}. Click to view details.`}
      >
        {content}
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      {content}
    </Card>
  )
})

MetricCard.displayName = "MetricCard"
