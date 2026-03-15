"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Plus, Upload, Search, RefreshCw, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

type StatusFilter = "all" | InvitationStatus

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
]

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
  const [expiredDismissed, setExpiredDismissed] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- Data fetching ----

  const fetchInvitations = useCallback(
    async (
      page = 1,
      status: StatusFilter = "all",
      search = "",
      options?: { silent?: boolean },
    ) => {
      if (!selectedCommunityId) return
      const isSilent = options?.silent === true
      try {
        if (!isSilent) setInvitationsLoading(true)
        const response = await communityInvitationsApi.getInvitations(selectedCommunityId, {
          page,
          limit: PAGE_LIMIT,
          status: status === "all" ? undefined : status,
          search: search.trim() || undefined,
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
    setStatusFilter("all")
    setSearchQuery("")
    setExpiredDismissed(false)
    fetchInvitations(1, "all", "")
    fetchStats()
  }, [fetchInvitations, fetchStats, selectedCommunityId])

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchInvitations(currentPage, statusFilter, searchQuery),
      fetchStats(),
    ])
  }, [currentPage, statusFilter, searchQuery, fetchInvitations, fetchStats])

  // ---- Debounced search ----

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setCurrentPage(1)
        fetchInvitations(1, statusFilter, value)
      }, 250)
    },
    [statusFilter, fetchInvitations],
  )

  // ---- Status tab change ----

  const handleStatusChange = useCallback(
    (status: StatusFilter) => {
      setStatusFilter(status)
      setCurrentPage(1)
      fetchInvitations(1, status, searchQuery)
    },
    [searchQuery, fetchInvitations],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page)
      fetchInvitations(page, statusFilter, searchQuery)
    },
    [statusFilter, searchQuery, fetchInvitations],
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
      <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-48 text-muted-foreground rounded-lg border border-dashed">
          <p className="text-sm">Please select a community to manage invitations.</p>
        </div>
      </div>
    )
  }

  const expiredCount = Number(stats?.expired ?? 0)

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Contacts & Invitations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Invite external contacts to join your community on Chabaqa.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setIsSingleDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Invite One
          </Button>
          <Button size="sm" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Import Contacts
          </Button>
        </div>
      </div>

      {/* Stats */}
      <InvitationStatsCards stats={stats} loading={statsLoading} error={statsError} />

      {/* Expired callout */}
      {expiredCount > 0 && !expiredDismissed && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            You have <span className="font-semibold">{expiredCount}</span> expired invitation
            {expiredCount !== 1 && "s"}. Resend them to re-engage your contacts.
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100"
              onClick={() => handleStatusChange("expired")}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              View expired
            </Button>
            <button
              type="button"
              onClick={() => setExpiredDismissed(true)}
              className="text-amber-400 hover:text-amber-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Filters: search + status tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            className="pl-9 h-9 text-sm"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-0.5 bg-muted/50 rounded-lg p-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleStatusChange(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                statusFilter === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
