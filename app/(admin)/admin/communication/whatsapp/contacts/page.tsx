"use client"

import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { Button } from "@/components/ui/button"
import { Phone, CheckCircle, XCircle } from "lucide-react"

interface WhatsAppContact {
  _id: string
  phone: string
  name?: string
  optedIn: boolean
  optedInAt: string
  lastMessageAt?: string
}

export default function WhatsAppContactsPage() {
  const columns: ColumnDef<WhatsAppContact>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: (row) => <div className="font-medium">{row.name || "—"}</div>,
    },
    {
      id: "phone",
      header: "Phone",
      accessorKey: "phone",
      cell: (row) => <div className="text-sm">{row.phone}</div>,
    },
    {
      id: "optedIn",
      header: "Opt-in Status",
      accessorKey: "optedIn",
      cell: (row) =>
        row.optedIn ? (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="h-3 w-3" />
            Opted in
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-500 text-sm">
            <XCircle className="h-3 w-3" />
            Opted out
          </span>
        ),
    },
    {
      id: "optedInAt",
      header: "Opted In",
      accessorKey: "optedInAt",
      cell: (row) =>
        row.optedInAt ? new Date(row.optedInAt).toLocaleDateString() : "—",
    },
    {
      id: "lastMessageAt",
      header: "Last Message",
      accessorKey: "lastMessageAt",
      cell: (row) =>
        row.lastMessageAt ? (
          new Date(row.lastMessageAt).toLocaleDateString()
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Phone className="h-8 w-8 text-green-500" />
            WhatsApp Contacts
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage opted-in WhatsApp contacts
          </p>
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
          sortBy: "optedInAt",
          sortOrder: "desc",
          onSortChange: () => {},
        }}
        emptyMessage="No opted-in contacts yet."
      />
    </div>
  )
}
