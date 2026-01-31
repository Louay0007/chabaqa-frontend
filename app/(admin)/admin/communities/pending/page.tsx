"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, CommunityFilters, ApproveCommunityDto, RejectCommunityDto } from "@/lib/api/admin-api"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { BulkActionBar, BulkAction } from "@/app/(admin)/_components/bulk-action-bar"
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

export default function PendingApprovalsPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [communities, setCommunities] = useState<Community[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  
  // Dialog states
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

  const [bulkApproveDialog, setBulkApproveDialog] = useState(false)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch pending communities
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

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

    fetchPendingCommunities()
  }, [isAuthenticated, authLoading, page, pageSize])

  // Refresh data
  const refreshData = async () => {
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
      setSelectedRows([])
    } catch (error) {
      console.error('[Pending Communities] Refresh error:', error)
      toast.error('Failed to refresh communities')
    } finally {
      setLoading(false)
    }
  }

  // Handle approve single community
  const handleApproveSingle = (communityId: string) => {
    setApproveDialog({
      open: true,
      communityId,
      notes: ''
    })
  }

  // Handle reject single community
  const handleRejectSingle = (communityId: string) => {
    setRejectDialog({
      open: true,
      communityId,
      reason: ''
    })
  }

  // Confirm approve
  const confirmApprove = async () => {
    if (!approveDialog.communityId) return

    try {
      const data: ApproveCommunityDto = {
        approvalNotes: approveDialog.notes || undefined,
      }

      await adminApi.communities.approveCommunity(approveDialog.communityId, data)
      toast.success('Community approved successfully')
      setApproveDialog({ open: false, communityId: null, notes: '' })
      await refreshData()
    } catch (error) {
      console.error('[Approve Community] Error:', error)
      toast.error('Failed to approve community')
    }
  }

  // Confirm reject
  const confirmReject = async () => {
    if (!rejectDialog.communityId || !rejectDialog.reason.trim()) {
      toast.error('Rejection reason is required')
      return
    }

    try {
      const data: RejectCommunityDto = {
        rejectionReason: rejectDialog.reason,
        notifyCreator: true,
      }

      await adminApi.communities.rejectCommunity(rejectDialog.communityId, data)
      toast.success('Community rejected')
      setRejectDialog({ open: false, communityId: null, reason: '' })
      await refreshData()
    } catch (error) {
      console.error('[Reject Community] Error:', error)
      toast.error('Failed to reject community')
    }
  }

  // Handle bulk approval
  const handleBulkApprove = async () => {
    if (selectedRows.length === 0) return

    try {
      await adminApi.communities.bulkApproval({
        communityIds: selectedRows,
        action: 'approve',
      })
      toast.success(`${selectedRows.length} communities approved successfully`)
      setBulkApproveDialog(false)
      await refreshData()
    } catch (error) {
      console.error('[Bulk Approve] Error:', error)
      toast.error('Failed to approve communities')
    }
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
      onClick: () => setBulkApproveDialog(true),
      variant: 'default',
      requiresConfirmation: false,
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
            Pending Community Approvals
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and approve community creation requests
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
      />

      {/* Approve Dialog */}
      <ConfirmDialog
        open={approveDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setApproveDialog({ open: false, communityId: null, notes: '' })
          }
        }}
        title="Approve Community"
        description="Are you sure you want to approve this community? The creator will be notified."
        confirmLabel="Approve"
        variant="default"
        onConfirm={confirmApprove}
      >
        <div className="space-y-2 mt-4">
          <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
          <Textarea
            id="approval-notes"
            placeholder="Add any notes for the creator..."
            value={approveDialog.notes}
            onChange={(e) => setApproveDialog(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>
      </ConfirmDialog>

      {/* Reject Dialog */}
      <ConfirmDialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, communityId: null, reason: '' })
          }
        }}
        title="Reject Community"
        description="Please provide a reason for rejecting this community. The creator will be notified."
        confirmLabel="Reject"
        variant="destructive"
        onConfirm={confirmReject}
        requiresInput={true}
      >
        <div className="space-y-2 mt-4">
          <Label htmlFor="rejection-reason">Rejection Reason *</Label>
          <Textarea
            id="rejection-reason"
            placeholder="Explain why this community is being rejected..."
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
            rows={4}
            required
          />
        </div>
      </ConfirmDialog>

      {/* Bulk Approve Dialog */}
      <ConfirmDialog
        open={bulkApproveDialog}
        onOpenChange={setBulkApproveDialog}
        title="Bulk Approve Communities"
        description={`Are you sure you want to approve ${selectedRows.length} ${selectedRows.length === 1 ? 'community' : 'communities'}? All creators will be notified.`}
        confirmLabel={`Approve ${selectedRows.length} ${selectedRows.length === 1 ? 'Community' : 'Communities'}`}
        variant="default"
        onConfirm={handleBulkApprove}
      />
    </div>
  )
}
