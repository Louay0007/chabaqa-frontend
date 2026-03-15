"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, Upload, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { InvitationStatsCards } from "./components/invitation-stats-cards"
import { InvitationList } from "./components/invitation-list"
import { ImportContactsDialog } from "./components/import-contacts-dialog"
import { SingleInviteDialog } from "./components/single-invite-dialog"
import {
  communityInvitationsApi,
  type CommunityInvitation,
  type InvitationStats,
  type InvitationStatus,
} from "@/lib/api/community-invitations.api"

const PAGE_LIMIT = 20

type FilterState = {
  status: "all" | InvitationStatus
  search: string
}

const DEFAULT_FILTERS: FilterState = { status: "all", search: "" }

export default function ContactsPage() {
  const { selectedCommunity, selectedCommunityId } = useCreatorCommunity()
  const { toast } = useToast()

  // Dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isSingleDialogOpen, setIsSingleDialogOpen] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Invitations list state
  const [invitations, setInvitations] = useState<CommunityInvitation[]>([])
  const [invitationsLoading, setInvitationsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalInvitations, setTotalInvitations] = useState(0)

  // Stats state
  const [stats, setStats] = useState<InvitationStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Filters
  const [pendingFilters, setPendingFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [activeFilters, setActiveFilters] = useState<FilterState>(DEFAULT_FILTERS)

  // ---- Data fetching ----

  const fetchInvitations = useCallback(
    async (page = 1, filters: FilterState, options?: { silent?: boolean }) => {
      if (!selectedCommunityId) return
      const isSilent = options?.silent === true
      try {
        if (!isSilent) setInvitationsLoading(true)
        const response = await communityInvitationsApi.getInvitations(selectedCommunityId, {
          page,
          limit: PAGE_LIMIT,
          status: filters.status === "all" ? undefined : filters.status,
          search: filters.search.trim() || undefined,
        })
        setInvitations(response.invitations || [])
        setCurrentPage(response.page || page)
        setTotalInvitations(response.total || 0)
        setTotalPages(response.totalPages || 1)
      } catch {
        setInvitations([])
      } finally {
        if (!isSilent) setInvitationsLoading(false)
      }
    },
    [selectedCommunityId],
  )

  const fetchStats = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!selectedCommunityId) return
      const isSilent = options?.silent === true
      try {
        if (!isSilent) setStatsLoading(true)
        setStatsError(null)
        const response = await communityInvitationsApi.getStats(selectedCommunityId)
        setStats(response)
      } catch (error: any) {
        setStatsError(error?.message || "Failed to load statistics")
        setStats(null)
      } finally {
        if (!isSilent) setStatsLoading(false)
      }
    },
    [selectedCommunityId],
  )

  // Reset + load when community changes
  useEffect(() => {
    if (!selectedCommunityId) return
    setActiveFilters(DEFAULT_FILTERS)
    setPendingFilters(DEFAULT_FILTERS)
    fetchInvitations(1, DEFAULT_FILTERS)
    fetchStats()
  }, [fetchInvitations, fetchStats, selectedCommunityId])

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchInvitations(currentPage, activeFilters), fetchStats()])
  }, [currentPage, activeFilters, fetchInvitations, fetchStats])

  // ---- Filter handlers ----

  const applyFilters = useCallback(() => {
    setActiveFilters(pendingFilters)
    setCurrentPage(1)
    fetchInvitations(1, pendingFilters)
  }, [pendingFilters, fetchInvitations])

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page)
      fetchInvitations(page, activeFilters)
    },
    [activeFilters, fetchInvitations],
  )

  // ---- Action handlers ----

  const handleResend = useCallback(
    async (inv: CommunityInvitation) => {
      try {
        setActionLoadingId(inv._id)
        await communityInvitationsApi.resendInvitation(inv._id)
        toast({ title: "Invitation resent", description: `Resent to ${inv.email}` })
        await refreshAll()
      } catch (error: any) {
        toast({
          title: "Failed to resend",
          description: error?.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setActionLoadingId(null)
      }
    },
    [toast, refreshAll],
  )

  const handleRevoke = useCallback(
    async (inv: CommunityInvitation) => {
      try {
        setActionLoadingId(inv._id)
        await communityInvitationsApi.revokeInvitation(inv._id)
        toast({ title: "Invitation revoked", description: `Revoked invitation for ${inv.email}` })
        await refreshAll()
      } catch (error: any) {
        toast({
          title: "Failed to revoke",
          description: error?.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setActionLoadingId(null)
      }
    },
    [toast, refreshAll],
  )

  const handleDelete = useCallback(
    async (inv: CommunityInvitation) => {
      try {
        setActionLoadingId(inv._id)
        await communityInvitationsApi.deleteInvitation(inv._id)
        toast({ title: "Invitation deleted", description: `Deleted invitation for ${inv.email}` })
        await refreshAll()
      } catch (error: any) {
        toast({
          title: "Failed to delete",
          description: error?.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setActionLoadingId(null)
      }
    },
    [toast, refreshAll],
  )

  // ---- Render ----

  if (!selectedCommunityId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Please select a community to manage invitations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contacts & Invitations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invite external contacts to join your community on Chabaqa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsSingleDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invite One
          </Button>
          <Button onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Contacts
          </Button>
        </div>
      </div>

      {/* Stats */}
      <InvitationStatsCards stats={stats} loading={statsLoading} error={statsError} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            className="pl-9"
            value={pendingFilters.search}
            onChange={(e) =>
              setPendingFilters((f) => ({ ...f, search: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters()
            }}
          />
        </div>
        <Select
          value={pendingFilters.status}
          onValueChange={(v) =>
            setPendingFilters((f) => ({ ...f, status: v as any }))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={applyFilters}>
          Apply
        </Button>
      </div>

      {/* List */}
      <InvitationList
        invitations={invitations}
        loading={invitationsLoading}
        actionLoadingId={actionLoadingId}
        pagination={{
          page: currentPage,
          limit: PAGE_LIMIT,
          total: totalInvitations,
          totalPages,
        }}
        onPageChange={handlePageChange}
        onResend={handleResend}
        onRevoke={handleRevoke}
        onDelete={handleDelete}
      />

      {/* Dialogs */}
      <ImportContactsDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        communityId={selectedCommunityId}
        onSuccess={refreshAll}
      />
      <SingleInviteDialog
        open={isSingleDialogOpen}
        onOpenChange={setIsSingleDialogOpen}
        communityId={selectedCommunityId}
        onSuccess={refreshAll}
      />
    </div>
  )
}
