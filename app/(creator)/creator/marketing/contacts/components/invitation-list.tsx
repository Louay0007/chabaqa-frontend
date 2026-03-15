"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { CommunityInvitation, InvitationStatus } from "@/lib/api/community-invitations.api"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  RefreshCw,
  Ban,
  Trash2,
  UserPlus,
} from "lucide-react"

interface InvitationListProps {
  invitations: CommunityInvitation[]
  loading: boolean
  actionLoadingId?: string | null
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onResend?: (invitation: CommunityInvitation) => void
  onRevoke?: (invitation: CommunityInvitation) => void
  onDelete?: (invitation: CommunityInvitation) => void
}

const STATUS_CONFIG: Record<InvitationStatus, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  accepted: { label: "Accepted", classes: "bg-green-100 text-green-800 hover:bg-green-100" },
  expired: { label: "Expired", classes: "bg-gray-100 text-gray-600 hover:bg-gray-100" },
  revoked: { label: "Revoked", classes: "bg-red-100 text-red-800 hover:bg-red-100" },
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function canResend(inv: CommunityInvitation): boolean {
  if (inv.status === "accepted" || inv.status === "revoked") return false
  if (inv.lastResentAt) {
    const elapsed = Date.now() - new Date(inv.lastResentAt).getTime()
    if (elapsed < 24 * 60 * 60 * 1000) return false
  }
  return true
}

export function InvitationList({
  invitations,
  loading,
  actionLoadingId,
  pagination,
  onPageChange,
  onResend,
  onRevoke,
  onDelete,
}: InvitationListProps) {
  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading invitations...</span>
        </div>
      </Card>
    )
  }

  if (!invitations.length) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-purple-50 p-4 rounded-full mb-4">
            <Mail className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No invitations yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Start inviting contacts to grow your community. Import a list or invite them one by one.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((inv) => {
            const isLoading = actionLoadingId === inv._id
            const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending

            return (
              <TableRow key={inv._id}>
                {/* Contact */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 uppercase shrink-0">
                      {(inv.name || inv.email)[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{inv.email}</p>
                      {inv.name && (
                        <p className="text-xs text-muted-foreground truncate">{inv.name}</p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge variant="secondary" className={statusCfg.classes}>
                    {statusCfg.label}
                  </Badge>
                  {inv.resendCount > 0 && (
                    <span className="text-xs text-muted-foreground ml-1.5">
                      ×{inv.resendCount + 1}
                    </span>
                  )}
                </TableCell>

                {/* Sent */}
                <TableCell className="text-sm text-muted-foreground">
                  {formatRelativeDate(inv.invitedAt)}
                </TableCell>

                {/* Expires */}
                <TableCell className="text-sm text-muted-foreground">
                  {inv.status === "accepted"
                    ? "—"
                    : inv.status === "revoked"
                      ? "—"
                      : formatDate(inv.expiresAt)}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <TooltipProvider delayDuration={200}>
                    <div className="flex items-center justify-end gap-1">
                      {/* Resend */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={isLoading || !canResend(inv)}
                            onClick={() => onResend?.(inv)}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {canResend(inv) ? "Resend invitation" : "Wait 24h to resend"}
                        </TooltipContent>
                      </Tooltip>

                      {/* Revoke */}
                      {inv.status === "pending" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-orange-500 hover:text-orange-700"
                              disabled={isLoading}
                              onClick={() => onRevoke?.(inv)}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Revoke invitation</TooltipContent>
                        </Tooltip>
                      )}

                      {/* Delete */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            disabled={isLoading}
                            onClick={() => onDelete?.(inv)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete invitation</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
