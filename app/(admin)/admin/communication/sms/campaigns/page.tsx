"use client"

import { useRouter } from "next/navigation"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare, Send } from "lucide-react"

interface SmsCampaign {
  _id: string
  name: string
  status: "draft" | "scheduled" | "sending" | "sent" | "failed"
  message: string
  audienceSize: number
  scheduledAt?: string
  sentAt?: string
  deliveredCount: number
  failedCount: number
}

export default function SmsCampaignsPage() {
  const router = useRouter()

  const columns: ColumnDef<SmsCampaign>[] = [
    {
      id: "name",
      header: "Campaign",
      accessorKey: "name",
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-muted-foreground truncate max-w-xs">
            {row.message?.slice(0, 60)}
            {row.message?.length > 60 ? "..." : ""}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "audienceSize",
      header: "Audience",
      accessorKey: "audienceSize",
      cell: (row) => <div>{row.audienceSize?.toLocaleString() ?? "—"}</div>,
    },
    {
      id: "delivery",
      header: "Delivery",
      cell: (row) => {
        if (!row.sentAt)
          return <span className="text-muted-foreground">—</span>
        return (
          <div className="text-sm">
            <div className="text-green-600">{row.deliveredCount} delivered</div>
            {row.failedCount > 0 && (
              <div className="text-red-500">{row.failedCount} failed</div>
            )}
          </div>
        )
      },
    },
    {
      id: "sentAt",
      header: "Sent At",
      accessorKey: "sentAt",
      cell: (row) =>
        row.sentAt ? (
          new Date(row.sentAt).toLocaleString()
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            View
          </Button>
          {(row.status === "draft" || row.status === "scheduled") && (
            <Button variant="default" size="sm">
              <Send className="h-3 w-3 mr-1" />
              Send
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-blue-500" />
            SMS Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage SMS broadcast campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/communication/sms")}
          >
            Overview
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={[]}
        loading={false}
        pagination={{
          page: 1,
          pageSize: 20,
          total: 0,
          onPageChange: () => {},
          onPageSizeChange: () => {},
        }}
        sorting={{
          sortBy: "createdAt",
          sortOrder: "desc",
          onSortChange: () => {},
        }}
        emptyMessage="No SMS campaigns yet. Create your first campaign to reach your users via SMS."
      />
    </div>
  )
}
