"use client"

import { useRouter } from "next/navigation"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MessageSquare } from "lucide-react"

interface WhatsAppTemplate {
  _id: string
  name: string
  category: "marketing" | "transactional" | "otpc"
  language: string
  status: "approved" | "pending" | "rejected"
  body: string
}

export default function WhatsAppTemplatesPage() {
  const router = useRouter()

  const columns: ColumnDef<WhatsAppTemplate>[] = [
    {
      id: "name",
      header: "Template Name",
      accessorKey: "name",
      sortable: true,
      cell: (row) => <div className="font-medium">{row.name}</div>,
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.category}
        </Badge>
      ),
    },
    {
      id: "language",
      header: "Language",
      accessorKey: "language",
      cell: (row) => <div>{row.language}</div>,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: () => <Button variant="ghost" size="sm">View</Button>,
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-green-500" />
            WhatsApp Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage approved WhatsApp message templates
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
            New Template
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
          sortBy: "name",
          sortOrder: "asc",
          onSortChange: () => {},
        }}
        emptyMessage="No templates yet. Create approved templates to use in campaigns."
      />
    </div>
  )
}
