"use client"

import { useRouter } from "next/navigation"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MessageSquare } from "lucide-react"

interface SmsTemplate {
  _id: string
  name: string
  message: string
  category: string
  characterCount: number
}

export default function SmsTemplatesPage() {
  const router = useRouter()

  const columns: ColumnDef<SmsTemplate>[] = [
    {
      id: "name",
      header: "Template",
      accessorKey: "name",
      sortable: true,
      cell: (row) => <div className="font-medium">{row.name}</div>,
    },
    {
      id: "message",
      header: "Message Preview",
      accessorKey: "message",
      cell: (row) => (
        <div className="text-sm text-muted-foreground truncate max-w-sm">
          {row.message?.slice(0, 80)}
          {row.message?.length > 80 ? "..." : ""}
        </div>
      ),
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
      id: "characterCount",
      header: "Characters",
      accessorKey: "characterCount",
      cell: (row) => (
        <div className="text-sm">
          <span
            className={
              row.characterCount > 160 ? "text-yellow-600" : "text-muted-foreground"
            }
          >
            {row.characterCount}/160
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: () => <Button variant="ghost" size="sm">Edit</Button>,
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-blue-500" />
            SMS Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage reusable SMS message templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/communication/sms")}
          >
            Back to SMS
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
        emptyMessage="No SMS templates yet."
      />
    </div>
  )
}
