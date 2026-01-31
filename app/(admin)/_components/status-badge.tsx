"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        success: "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        warning: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        danger: "border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        secondary: "border-transparent bg-secondary text-secondary-foreground"
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-sm",
        lg: "px-3 py-1 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: string
}

// Map common status values to appropriate color variants
const statusVariantMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  // Active/Success states
  'active': 'success',
  'approved': 'success',
  'completed': 'success',
  'published': 'success',
  'verified': 'success',
  'delivered': 'success',
  'sent': 'success',
  
  // Pending/Warning states
  'pending': 'warning',
  'scheduled': 'warning',
  'processing': 'warning',
  'sending': 'warning',
  'in_review': 'warning',
  'flagged': 'warning',
  
  // Error/Danger states
  'suspended': 'danger',
  'rejected': 'danger',
  'failed': 'danger',
  'cancelled': 'danger',
  'deleted': 'danger',
  'blocked': 'danger',
  'bounced': 'danger',
  
  // Info states
  'draft': 'info',
  'inactive': 'info',
  'archived': 'info',
  
  // Secondary/Neutral states
  'unknown': 'secondary',
  'other': 'secondary'
}

function getVariantFromStatus(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_')
  return statusVariantMap[normalizedStatus] || 'default'
}

export const StatusBadge = React.memo(({ 
  status, 
  variant, 
  size = 'md',
  className, 
  ...props 
}: StatusBadgeProps) => {
  // Use provided variant or auto-detect from status
  const badgeVariant = variant || getVariantFromStatus(status)
  
  return (
    <div 
      className={cn(statusBadgeVariants({ variant: badgeVariant, size }), className)} 
      {...props}
    >
      {status}
    </div>
  )
})

StatusBadge.displayName = "StatusBadge"

export { statusBadgeVariants }
