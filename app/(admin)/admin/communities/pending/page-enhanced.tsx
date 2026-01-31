"use client"

/**
 * Enhanced Pending Communities Page with Bulk Operation Progress
 * 
 * This is an example implementation showing how to integrate the enhanced
 * bulk operation features into an existing page.
 * 
 * Key enhancements:
 * 1. Progress tracking during bulk approval
 * 2. Detailed error reporting for failed approvals
 * 3. Ability to cancel bulk operations
 * 4. Retry failed approvals
 * 5. Operation summary after completion
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, CommunityFilters, ApproveCommunityDto } from "@/lib/api/admin-api"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { BulkActionBar, BulkAction } from "@/app/(admin)/_components/bulk-action-bar"
import { BulkOperationProgress } from "@/app/(admin)/_components/bulk-operation-progress"
import { useBulkOperation } from "@/app/(admin)/_hooks/use-bulk-operation"
import { ConfirmDialog } from "@/app/(admin)/_components/confirm-dialog"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Building2, Check, X, CheckCheck } from "lucide-react"
import { toast } from "sonner"

interface Community {
  _id: string
  name: string
  description: string
  creator: {
    _id: string
    username: string
  }
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'
  memberCount: number
  contentCount: number
  createdAt: string
}

interface CommunitiesResponse {
  communities: Community[]
  total: number
  page: number
  limit: number
}

export default function PendingApprovalsPageEnhanced() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [communities, setCommunities] = useState<Community[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  
  // Bulk operation state
  const [showBulkProgress, setShowBulkProgress] = useState(false)
  const [bulkApproveNotes, setBulkApproveNotes] = useState('')
  const [showBulkApproveDialog, setShowBulkApproveDialog] = useState(false)
  
  // Single action dialog states
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean
    communityId: string | null
    notes: string
  }>({
    open: false,
    communityId: null,
    notes: ''
  })

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    communityId: string | null
    reason: string
  }>({
    open: false,
    communityId: null,
    reason: ''
  })

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch pending communities
  const fetchPendingCommunities = async () => {
    setLoading(true)
    try {
      const response = await adminApi.communities.getPendingApprovals({
        page,
        limit: pageSize,
        status: 'pending',
      })

      const data = response.data as CommunitiesResponse
      setCommunities(data.communities || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('[Pending Communities] Fetch error:', error)
      toast.error('Failed to load pending communities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    fetchPendingCommunities()
  }, [isAuthenticated, authLoading, page, pageSize])

  // Get selected communities
  const selectedCommunities = communities.filter(c => selectedRows.includes(c._id))

  // Configure bulk approval operation
  const bulkApprovalOperation = useBulkOperation({
    items: selectedCommunities,
    operation: async (community) => {
      const dto: ApproveCommunityDto = {
        notes: bulkApproveNotes || undefined
      }
      await adminApi.communities.approveCommunity(community._id, dto)
    },
    getItemId: (community) => community._id,
    getItemLabel: (community) => community.name,
    batchSize: 3, // Process 3 communities at a time
    delayBetweenBatches: 500, // 500ms delay between batches
    onComplete: (result) => {
      if (result.failed === 0) {
        toast.success(`Successfully approved ${result.successful} ${result.successful === 1 ? 'community' : 'communities'}`)
      } else if (result.successful === 0) {
        toast.error(`Failed to approve all ${result.total} ${result.total === 1 ? 'community' : 'communities'}`)
      } else {
        toast.warning(
          `Approved ${result.successful} ${result.successful === 1 ? 'community' : 'communities'}, ` +
          `${result.failed} failed. Click retry to process failed items.`
        )
      }
      // Refresh the list
      fetchPendingCommunities()
    },
    onProgress: (progress) => {
      console.log(`[Bulk Approval] Progress: ${progress.percentage.toFixed(0)}%`)
    }
  })

  // Handle single approve
  const handleApproveSingle = (communityId: string) => {
    setApproveDialog({
      open: true,
      communityId,
      notes: ''
    })
  }

  const confirmApproveSingle = async () => {
    if (!approveDialog.communityId) return

    try {
      const dto: ApproveCommunityDto = {
        notes: approveDialog.notes || undefined
      }
      await adminApi.communities.approveCommunity(approveDialog.communityId, dto)
      toast.success('Community approved successfully')
      setApproveDialog({ open: false, communityId: null, notes: '' })
      await fetchPendingCommunities()
    } catch (error) {
      console.error('[Approve] Error:', error)
      toast.error('Failed to approve community')
    }
  }

  // Handle single reject
  const handleRejectSingle = (communityId: string) => {
    setRejectDialog({
      open: true,
      communityId,
      reason: ''
    })
  }

  const confirmRejectSingle = async () => {
    if (!rejectDialog.communityId || !rejectDialog.reason.trim()) {
      toast.error('Rejection reason is required')
      return
    }

    try {
      await adminApi.communities.rejectCommunity(rejectDialog.communityId, {
        reason: rejectDialog.reason
      })
      toast.success('Community rejected')
      setRejectDialog({ open: false, communityId: null, reason: '' })
      await fetchPendingCommunities()
    } catch (error) {
      console.error('[Reject] Error:', error)
      toast.error('Failed to reject community')
    }
  }

  // Handle bulk approve - show confirmation dialog first
  const handleBulkApprove = () => {
    setShowBulkApproveDialog(true)
  }

  // Confirm and execute bulk approval
  const confirmBulkApprove = async () => {
    setShowBulkApproveDialog(false)
    setShowBulkProgress(true)
    await bulkApprovalOperation.execute()
  }

  // Column definitions
  const columns: ColumnDef<Community>[] = [
    {
      id: 'name',
      header: 'Community Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {row.description}
          </div>
        </div>
      ),
    },
    {
      id: 'creator',
      header: 'Creator',
      cell: (row) => (
        <div className="text-sm">{row.creator?.username || 'Unknown'}</div>
      ),
    },
    {
      id: 'createdAt',
      header: 'Submitted',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="default"
            onClick={() => handleApproveSingle(row._id)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleRejectSingle(row._id)}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      ),
    },
  ]

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      label: 'Approve Selected',
      icon: CheckCheck,
      onClick: handleBulkApprove,
      variant: 'default',
      requiresConfirmation: false, // We handle confirmation separately
      showProgress: true
    },
  ]

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Pending Community Approvals (Enhanced)
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and approve community creation requests with enhanced bulk operations
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/communities')}>
          View All Communities
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Queue</CardTitle>
          <CardDescription>
            {total} {total === 1 ? 'community' : 'communities'} awaiting approval
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={communities}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        selection={{
          selectedRows,
          onSelectionChange: setSelectedRows,
        }}
        emptyMessage="No pending communities. All caught up!"
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedRows.length}
        actions={bulkActions}
        onClearSelection={() => setSelectedRows([])}
        totalCount={total}
        disabled={bulkApprovalOperation.isRunning}
      />

      {/* Bulk Approve Confirmation Dialog */}
      <ConfirmDialog
        open={showBulkApproveDialog}
        onOpenChange={setShowBulkApproveDialog}
        title="Bulk Approve Communities"
        description={`You are about to approve ${selectedRows.length} ${selectedRows.length === 1 ? 'community' : 'communities'}. This action will activate them and notify the creators.`}
        confirmLabel="Start Approval"
        onConfirm={confirmBulkApprove}
      >
        <div className="space-y-2 mt-4">
          <Label htmlFor="bulk-notes">Approval Notes (Optional)</Label>
          <Textarea
            id="bulk-notes"
            placeholder="Add notes for all approvals..."
            value={bulkApproveNotes}
            onChange={(e) => setBulkApproveNotes(e.target.value)}
            rows={3}
          />
        </div>
      </ConfirmDialog>

      {/* Bulk Operation Progress Dialog */}
      <BulkOperationProgress
        open={showBulkProgress}
        onOpenChange={(open) => {
          if (!open && !bulkApprovalOperation.isRunning) {
            setShowBulkProgress(false)
            bulkApprovalOperation.reset()
            setSelectedRows([])
            setBulkApproveNotes('')
          }
        }}
        title="Approving Communities"
        items={bulkApprovalOperation.items}
        onCancel={bulkApprovalOperation.cancel}
        onRetryFailed={async () => {
          await bulkApprovalOperation.retryFailed()
        }}
        canCancel={bulkApprovalOperation.isRunning}
      />

      {/* Single Approve Dialog */}
      <ConfirmDialog
        open={approveDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setApproveDialog({ open: false, communityId: null, notes: '' })
          }
        }}
        title="Approve Community"
        description="This will activate the community and notify the creator."
        confirmLabel="Approve"
        onConfirm={confirmApproveSingle}
      >
        <div className="space-y-2 mt-4">
          <Label htmlFor="approve-notes">Approval Notes (Optional)</Label>
          <Textarea
            id="approve-notes"
            placeholder="Add notes for this approval..."
            value={approveDialog.notes}
            onChange={(e) => setApproveDialog({ ...approveDialog, notes: e.target.value })}
            rows={3}
          />
        </div>
      </ConfirmDialog>

      {/* Single Reject Dialog */}
      <ConfirmDialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, communityId: null, reason: '' })
          }
        }}
        title="Reject Community"
        description="This will reject the community and notify the creator with your reason."
        confirmLabel="Reject"
        variant="destructive"
        onConfirm={confirmRejectSingle}
      >
        <div className="space-y-2 mt-4">
          <Label htmlFor="reject-reason">Rejection Reason (Required)</Label>
          <Textarea
            id="reject-reason"
            placeholder="Explain why this community is being rejected..."
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
            rows={3}
            required
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
