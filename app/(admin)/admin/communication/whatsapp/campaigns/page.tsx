"use client"

import { useRouter } from "next/navigation"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Button } from "@/components/ui/button"
import { Plus, Send, MessageCircle } from "lucide-react"

interface WhatsAppCampaign {
  _id: string
  name: string
  status: "draft" | "scheduled" | "sending" | "sent" | "failed"
  audienceSize: number
  message: string
  scheduledAt?: string
  sentAt?: string
  deliveredCount: number
  readCount: number
  clickedCount: number
}

export default function WhatsAppCampaignsPage() {
  const router = useRouter()

  const columns: ColumnDef<WhatsAppCampaign>[] = [
    {
      id: "name",
      header: "Campaign",
      accessorKey: "name",
      sortable: true,
      cell: (row) => <div className="font-medium">{row.name}</div>,
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
        if (!row.deliveredCount)
          return <span className="text-muted-foreground">—</span>
        const rate =
          row.audienceSize > 0
            ? ((row.deliveredCount / row.audienceSize) * 100).toFixed(1)
            : "0"
        return (
          <div className="text-sm">
            <div>{row.deliveredCount} delivered</div>
            <div className="text-muted-foreground">{rate}% rate</div>
          </div>
        )
      },
    },
    {
      id: "sentAt",
      header: "Sent",
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
            <MessageCircle className="h-8 w-8 text-green-500" />
            WhatsApp Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage WhatsApp broadcast campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/communication/whatsapp")}
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
        emptyMessage="No WhatsApp campaigns yet. Create your first campaign to reach opted-in users."
      />
    </div>
  )
}
