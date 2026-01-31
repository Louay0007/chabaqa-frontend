"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, AlertTriangle, AlertCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { FilterPanel, FilterConfig } from "@/app/(admin)/_components/filter-panel"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { ConfirmDialog } from "@/app/(admin)/_components/confirm-dialog"
import { MetricCard } from "@/app/(admin)/_components/metric-card"
import { adminApi, SecurityEventFilters } from "@/lib/api/admin-api"
import { formatDistanceToNow } from "date-fns"

// Security event interface
interface SecurityEvent {
  _id: string
  eventType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  ipAddress?: string
  userId?: string
  resolved: boolean
  resolvedBy?: {
    _id: string
    name: string
  }
  resolution?: string
  createdAt: string
  resolvedAt?: string
}

// Security metrics interface
interface SecurityMetrics {
  totalEvents: number
  unresolvedEvents: number
  criticalEvents: number
  failedLoginAttempts: number
  suspiciousActivities: number
}

export default function SecurityEventsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // State
  const [events, setEvents] = React.useState<SecurityEvent[]>([])
  const [metrics, setMetrics] = React.useState<SecurityMetrics | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [metricsLoading, setMetricsLoading] = React.useState(true)
  const [resolveDialogOpen, setResolveDialogOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<SecurityEvent | null>(null)
  
  // Pagination state
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [total, setTotal] = React.useState(0)
  
  // Sorting state
  const [sortBy, setSortBy] = React.useState('createdAt')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  
  // Filter state
  const [filterValues, setFilterValues] = React.useState<Record<string, any>>({
    severity: '',
    eventType: '',
    resolved: '',
    dateRange: { from: '', to: '' }
  })

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'severity',
      label: 'Severity',
      type: 'select',
      options: [
        { label: 'All Severities', value: 'all' },
        { label: 'Critical', value: 'critical' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ],
      placeholder: 'Select severity...'
    },
    {
      key: 'eventType',
      label: 'Event Type',
      type: 'select',
      options: [
        { label: 'All Types', value: 'all' },
        { label: 'Failed Login', value: 'FAILED_LOGIN' },
        { label: 'Suspicious Activity', value: 'SUSPICIOUS_ACTIVITY' },
        { label: 'Unauthorized Access', value: 'UNAUTHORIZED_ACCESS' },
        { label: 'Data Breach', value: 'DATA_BREACH' },
        { label: 'System Anomaly', value: 'SYSTEM_ANOMALY' },
      ],
      placeholder: 'Select event type...'
    },
    {
      key: 'resolved',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Unresolved', value: 'false' },
        { label: 'Resolved', value: 'true' },
      ],
      placeholder: 'Select status...'
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'dateRange'
    }
  ]

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'low':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  // Column definitions
  const columns: ColumnDef<SecurityEvent>[] = [
    {
      id: 'severity',
      header: 'Severity',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          {getSeverityIcon(row.severity)}
          <span className="font-medium capitalize">{row.severity}</span>
        </div>
      ),
      width: '120px'
    },
    {
      id: 'eventType',
      header: 'Event Type',
      accessorKey: 'eventType',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">{row.eventType}</div>
      ),
      width: '180px'
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => (
        <div className="max-w-md truncate">{row.description}</div>
      ),
      width: '300px'
    },
    {
      id: 'ipAddress',
      header: 'IP Address',
      accessorKey: 'ipAddress',
      cell: (row) => (
        <div className="font-mono text-xs">{row.ipAddress || 'N/A'}</div>
      ),
      width: '130px'
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <StatusBadge 
          status={row.resolved ? 'Resolved' : 'Unresolved'}
          variant={row.resolved ? 'success' : 'warning'}
        />
      ),
      width: '120px'
    },
    {
      id: 'createdAt',
      header: 'Created',
      sortable: true,
      cell: (row) => (
        <div className="space-y-1">
          <div className="text-sm">
            {new Date(row.createdAt).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
          </div>
        </div>
      ),
      width: '180px'
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        !row.resolved && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleResolveClick(row)
            }}
          >
            Resolve
          </Button>
        )
      ),
      width: '100px'
    }
  ]

  // Fetch security events
  const fetchEvents = React.useCallback(async () => {
    setLoading(true)
    try {
      const filters: SecurityEventFilters = {
        page,
        limit: pageSize,
        severity: filterValues.severity || undefined,
        eventType: filterValues.eventType || undefined,
        resolved: filterValues.resolved ? filterValues.resolved === 'true' : undefined,
        startDate: filterValues.dateRange?.from || undefined,
        endDate: filterValues.dateRange?.to || undefined
      }

      const response = await adminApi.security.getSecurityEvents(filters)
      
      if (response.data) {
        setEvents(response.data.data || [])
        setTotal(response.data.total || 0)
      }
    } catch (error) {
      console.error('[Security Events] Fetch error:', error)
      toast({
        title: "Error",
        description: "Failed to load security events. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filterValues, toast])

  // Fetch security metrics
  const fetchMetrics = React.useCallback(async () => {
    setMetricsLoading(true)
    try {
      const response = await adminApi.security.getSecurityMetrics()
      
      if (response.data) {
        setMetrics(response.data.data || response.data)
      }
    } catch (error) {
      console.error('[Security Metrics] Fetch error:', error)
      // Don't show error toast for metrics, just log it
    } finally {
      setMetricsLoading(false)
    }
  }, [])

  // Load events and metrics on mount and when dependencies change
  React.useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  React.useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }))
  }

  // Handle filter reset
  const handleFilterReset = () => {
    setFilterValues({
      severity: '',
      eventType: '',
      resolved: '',
      dateRange: { from: '', to: '' }
    })
  }

  // Handle filter apply
  const handleFilterApply = () => {
    setPage(1) // Reset to first page
    fetchEvents()
  }

  // Handle sorting
  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page
  }

  // Handle resolve click
  const handleResolveClick = (event: SecurityEvent) => {
    setSelectedEvent(event)
    setResolveDialogOpen(true)
  }

  // Handle resolve confirm
  const handleResolveConfirm = async () => {
    if (!selectedEvent) return

    try {
      // Note: The resolution notes would be captured by the ConfirmDialog's internal input
      // For now, we'll pass an empty string as the API expects it
      await adminApi.security.resolveSecurityEvent(
        selectedEvent._id,
        "Resolved by admin" // Default resolution message
      )

      toast({
        title: "Success",
        description: "Security event resolved successfully"
      })

      // Refresh data
      fetchEvents()
      fetchMetrics()
      setResolveDialogOpen(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error('[Security Events] Resolve error:', error)
      toast({
        title: "Error",
        description: "Failed to resolve security event. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Security Events</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and resolve security-related events
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Total Events"
          value={metrics?.totalEvents || 0}
          icon={AlertCircle}
          color="info"
          loading={metricsLoading}
        />
        <MetricCard
          title="Unresolved"
          value={metrics?.unresolvedEvents || 0}
          icon={AlertTriangle}
          color="warning"
          loading={metricsLoading}
        />
        <MetricCard
          title="Critical"
          value={metrics?.criticalEvents || 0}
          icon={XCircle}
          color="danger"
          loading={metricsLoading}
        />
        <MetricCard
          title="Failed Logins"
          value={metrics?.failedLoginAttempts || 0}
          icon={AlertCircle}
          color="warning"
          loading={metricsLoading}
        />
        <MetricCard
          title="Suspicious Activity"
          value={metrics?.suspiciousActivities || 0}
          icon={AlertTriangle}
          color="danger"
          loading={metricsLoading}
        />
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filterConfigs}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        onApply={handleFilterApply}
        collapsible
      />

      {/* Data Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Security Events</CardTitle>
          <CardDescription>
            {total} event{total === 1 ? '' : 's'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={events}
            loading={loading}
            pagination={{
              page,
              pageSize,
              total,
              onPageChange: handlePageChange,
              onPageSizeChange: handlePageSizeChange
            }}
            sorting={{
              sortBy,
              sortOrder,
              onSortChange: handleSortChange
            }}
            emptyMessage="No security events found"
          />
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <ConfirmDialog
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        title="Resolve Security Event"
        description={`Are you sure you want to resolve this security event? ${selectedEvent?.description || ''}`}
        confirmLabel="Resolve"
        onConfirm={handleResolveConfirm}
        requiresInput
        inputPlaceholder="Enter resolution notes (optional)..."
      />
    </div>
  )
}
