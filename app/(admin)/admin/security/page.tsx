"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { FilterPanel, FilterConfig } from "@/app/(admin)/_components/filter-panel"
import { ExportDialog } from "@/app/(admin)/_components/export-dialog"
import { adminApi, AuditLogFilters } from "@/lib/api/admin-api"
import { formatDistanceToNow } from "date-fns"

// Audit log interface
interface AuditLog {
  _id: string
  action: string
  entityType: string
  entityId: string
  adminUser: {
    _id: string
    name: string
  }
  ipAddress: string
  userAgent: string
  changes?: any
  timestamp: string
  status?: string
}

export default function AuditLogsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // State
  const [logs, setLogs] = React.useState<AuditLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false)
  
  // Pagination state
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [total, setTotal] = React.useState(0)
  
  // Sorting state
  const [sortBy, setSortBy] = React.useState('timestamp')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  
  // Filter state
  const [filterValues, setFilterValues] = React.useState<Record<string, any>>({
    action: '',
    entityType: '',
    adminUserId: '',
    ipAddress: '',
    dateRange: { from: '', to: '' }
  })

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'action',
      label: 'Action',
      type: 'select',
      options: [
        { label: 'All Actions', value: 'all' },
        { label: 'User Management', value: 'USER_MANAGEMENT' },
        { label: 'Community Management', value: 'COMMUNITY_MANAGEMENT' },
        { label: 'Content Moderation', value: 'CONTENT_MODERATION' },
        { label: 'Financial Management', value: 'FINANCIAL_MANAGEMENT' },
        { label: 'System Configuration', value: 'SYSTEM_CONFIGURATION' },
        { label: 'Audit Log View', value: 'AUDIT_LOG_VIEW' },
        { label: 'Audit Log Export', value: 'AUDIT_LOG_EXPORT' },
      ],
      placeholder: 'Select action...'
    },
    {
      key: 'entityType',
      label: 'Entity Type',
      type: 'select',
      options: [
        { label: 'All Types', value: 'all' },
        { label: 'User', value: 'User' },
        { label: 'Community', value: 'Community' },
        { label: 'Content', value: 'Content' },
        { label: 'Payout', value: 'Payout' },
        { label: 'Campaign', value: 'Campaign' },
        { label: 'Security Config', value: 'SecurityConfig' },
      ],
      placeholder: 'Select entity type...'
    },
    {
      key: 'adminUserId',
      label: 'Admin User',
      type: 'text',
      placeholder: 'Enter admin user ID...'
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      type: 'text',
      placeholder: 'Enter IP address...'
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'dateRange'
    }
  ]

  // Column definitions
  const columns: ColumnDef<AuditLog>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      cell: (row) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">
            {new Date(row.timestamp).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(row.timestamp), { addSuffix: true })}
          </div>
        </div>
      ),
      width: '200px'
    },
    {
      id: 'action',
      header: 'Action',
      accessorKey: 'action',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">{row.action}</div>
      ),
      width: '180px'
    },
    {
      id: 'adminUser',
      header: 'Admin User',
      cell: (row) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">{row.adminUser.name}</div>
          <div className="text-xs text-muted-foreground">{row.adminUser._id}</div>
        </div>
      ),
      width: '180px'
    },
    {
      id: 'entityType',
      header: 'Entity Type',
      accessorKey: 'entityType',
      sortable: true,
      width: '120px'
    },
    {
      id: 'entityId',
      header: 'Entity ID',
      accessorKey: 'entityId',
      cell: (row) => (
        <div className="font-mono text-xs">{row.entityId}</div>
      ),
      width: '150px'
    },
    {
      id: 'ipAddress',
      header: 'IP Address',
      accessorKey: 'ipAddress',
      cell: (row) => (
        <div className="font-mono text-xs">{row.ipAddress}</div>
      ),
      width: '130px'
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleViewDetails(row)
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      ),
      width: '100px'
    }
  ]

  // Fetch audit logs
  const fetchLogs = React.useCallback(async () => {
    setLoading(true)
    try {
      const filters: AuditLogFilters = {
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
        action: filterValues.action || undefined,
        entityType: filterValues.entityType || undefined,
        adminUserId: filterValues.adminUserId || undefined,
        ipAddress: filterValues.ipAddress || undefined,
        startDate: filterValues.dateRange?.from || undefined,
        endDate: filterValues.dateRange?.to || undefined
      }

      const response = await adminApi.security.getAuditLogs(filters)
      
      if (response.data) {
        setLogs(response.data.data || [])
        setTotal(response.data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('[Audit Logs] Fetch error:', error)
      toast({
        title: "Error",
        description: "Failed to load audit logs. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortBy, sortOrder, filterValues, toast])

  // Load logs on mount and when dependencies change
  React.useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }))
  }

  // Handle filter reset
  const handleFilterReset = () => {
    setFilterValues({
      action: '',
      entityType: '',
      adminUserId: '',
      ipAddress: '',
      dateRange: { from: '', to: '' }
    })
  }

  // Handle filter apply
  const handleFilterApply = () => {
    setPage(1) // Reset to first page
    fetchLogs()
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

  // Handle view details
  const handleViewDetails = (log: AuditLog) => {
    // For now, show a toast with details
    // In a full implementation, this could open a modal or navigate to a details page
    toast({
      title: "Audit Log Details",
      description: (
        <div className="space-y-2 text-sm">
          <div><strong>Action:</strong> {log.action}</div>
          <div><strong>Entity:</strong> {log.entityType} ({log.entityId})</div>
          <div><strong>Admin:</strong> {log.adminUser.name}</div>
          <div><strong>IP:</strong> {log.ipAddress}</div>
          {log.changes && (
            <div><strong>Changes:</strong> {JSON.stringify(log.changes, null, 2)}</div>
          )}
        </div>
      )
    })
  }

  // Handle export
  const handleExport = async (format: 'csv' | 'json' | 'pdf', options: any) => {
    try {
      const filters: AuditLogFilters = {
        action: filterValues.action || undefined,
        entityType: filterValues.entityType || undefined,
        adminUserId: filterValues.adminUserId || undefined,
        ipAddress: filterValues.ipAddress || undefined,
        startDate: options.startDate || filterValues.dateRange?.from || undefined,
        endDate: options.endDate || filterValues.dateRange?.to || undefined
      }

      const response = await adminApi.security.exportAuditLogs(filters, format)
      
      // Create download link
      const blob = new Blob([response.data.content || response.data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Audit logs exported successfully"
      })
      
      setExportDialogOpen(false)
    } catch (error) {
      console.error('[Audit Logs] Export error:', error)
      toast({
        title: "Error",
        description: "Failed to export audit logs. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            View and export administrative action logs
          </p>
        </div>
        <Button onClick={() => setExportDialogOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
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
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            {total} log {total === 1 ? 'entry' : 'entries'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={logs}
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
            emptyMessage="No audit logs found"
          />
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
        availableFormats={['csv', 'json']}
        dateRangeRequired={false}
      />
    </div>
  )
}
