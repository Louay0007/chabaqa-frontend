'use client'

import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'

interface PromoCodesHeaderProps {
  onCreateClick: () => void
  onRefresh: () => void
}

export function PromoCodesHeader({ onCreateClick, onRefresh }: PromoCodesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Promo Codes</h1>
        <p className="text-gray-600 mt-1">
          Create and manage discount codes for your content
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button size="sm" onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Create Promo Code
        </Button>
      </div>
    </div>
  )
}
