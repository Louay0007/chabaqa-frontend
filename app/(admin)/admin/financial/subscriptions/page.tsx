"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, SubscriptionFilters } from "@/lib/api/admin-api"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { FilterPanel, FilterConfig } from "@/app/(admin)/_components/filter-panel"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface Subscription {
  _id: string
  user: {
    _id: string
    username: string
    email: string
  }
  community: {
    _id: string
    name: string
  }
  creator: {
    _id: string
    username: string
  }
  planTier: string
  status: 'active' | 'cancelled' | 'expired'
  amount: number
  currency: string
  startDate: string
  endDate?: string
  nextBillingDate?: string
  createdAt: string
}

interface SubscriptionsResponse {
  subscriptions: Subscription[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function SubscriptionsListPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  })
  const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [filters, setFilters] = useState<SubscriptionFilters>({
    page: 1,
    limit: 20
  })

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch subscriptions
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchSubscriptions = async () => {
      setLoading(true)
      try {
        const response = await adminApi.financial.getSubscriptions({
          ...filters,
          page: pagination.page,
          limit: pagination.pageSize,
          sortBy: sorting.sortBy,
          sortOrder: sorting.sortOrder
        })

        const data: SubscriptionsResponse = response?.data || response
        setSubscriptions(data?.subscriptions || [])
        setPagination(prev => ({
          ...prev,
          total: data?.total || 0
        }))
      } catch (error) {
        console.error('[Subscriptions] Error:', error)
        toast.error('Failed to load subscriptions')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [isAuthenticated, authLoading, pagination.page, pagination.pageSize, sorting, filters])

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Expired', value: 'expired' }
      ]
    },
    {
      key: 'planTier',
      label: 'Plan Tier',
      type: 'text',
      placeholder: 'Filter by plan tier...'
    },
    {
      key: 'creatorId',
      label: 'Creator ID',
      type: 'text',
      placeholder: 'Filter by creator ID...'
    },
    {
      key: 'startDate',
      label: 'Start Date',
      type: 'date'
    },
    {
      key: 'endDate',
      label: 'End Date',
      type: 'date'
    }
  ]

  const columns: ColumnDef<Subscription>[] = [
    {
      id: 'user',
      header: 'User',
      accessorKey: 'user',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.user?.username || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">{row.user?.email || ''}</div>
        </div>
      )
    },
    {
      id: 'community',
      header: 'Community',
      accessorKey: 'community',
      cell: (row) => row.community?.name || 'N/A'
    },
    {
      id: 'creator',
      header: 'Creator',
      accessorKey: 'creator',
      cell: (row) => row.creator?.username || 'N/A'
    },
    {
      id: 'planTier',
      header: 'Plan Tier',
      accessorKey: 'planTier',
      sortable: true
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      id: 'amount',
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => {
        const amount = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: row.currency || 'USD'
        }).format(row.amount || 0)
        return <span className="font-medium">{amount}</span>
      }
    },
    {
      id: 'nextBillingDate',
      header: 'Next Billing',
      accessorKey: 'nextBillingDate',
      cell: (row) => {
        if (!row.nextBillingDate) return <span className="text-muted-foreground">-</span>
        return new Date(row.nextBillingDate).toLocaleDateString()
      }
    },
    {
      id: 'createdAt',
      header: 'Created',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => new Date(row.createdAt).toLocaleDateString()
    }
  ]

  const handleFilterChange = (key: string, value: any) => {
    if (value === 'all') {
      setFilters(prev => ({
        ...prev,
        [key]: undefined
      }))
      return
    }
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleFilterReset = () => {
    setFilters({
      page: 1,
      limit: 20
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterApply = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handlePageSizeChange = (size: number) => {
    setPagination(prev => ({ ...prev, pageSize: size, page: 1 }))
  }

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSorting({ sortBy, sortOrder })
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/financial')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor platform subscriptions
          </p>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        onApply={handleFilterApply}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={subscriptions}
        loading={loading}
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange
        }}
        sorting={{
          sortBy: sorting.sortBy,
          sortOrder: sorting.sortOrder,
          onSortChange: handleSortChange
        }}
        emptyMessage="No subscriptions found"
      />
    </div>
  )
}
