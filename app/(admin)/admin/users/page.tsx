"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, UserFilters } from "@/lib/api/admin-api"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { FilterPanel, FilterConfig } from "@/app/(admin)/_components/filter-panel"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Button } from "@/components/ui/button"
import { Users, UserPlus } from "lucide-react"
import { toast } from "sonner"

interface User {
  _id: string
  username: string
  email: string
  status: 'active' | 'suspended' | 'deleted'
  role: string
  createdAt: string
  lastLogin?: string
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
}

export default function UsersPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, logout } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Filter state
  const [filters, setFilters] = useState<UserFilters>({
    status: undefined,
    role: undefined,
    search: undefined,
    registeredFrom: undefined,
    registeredTo: undefined,
  })

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch users
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await adminApi.users.getUsers({
          page,
          limit: pageSize,
          sortBy,
          sortOrder,
          ...filters,
        })

        const data = response.data as UsersResponse
        setUsers(data.users || [])
        setTotal(data.total || 0)
      } catch (error: any) {
        console.error('[Users] Fetch error:', error)
        if (error?.message?.includes('401')) {
          await logout()
          return
        }
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [isAuthenticated, authLoading, page, pageSize, sortBy, sortOrder, filters])

  // Column definitions
  const columns: ColumnDef<User>[] = [
    {
      id: 'username',
      header: 'Username',
      accessorKey: 'username',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">{row.username}</div>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      sortable: true,
      cell: (row) => (
        <div className="text-sm text-muted-foreground">{row.email}</div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <StatusBadge 
          status={row.status}
          variant={
            row.status === 'active' ? 'success' :
            row.status === 'suspended' ? 'danger' :
            'default'
          }
        />
      ),
    },
    {
      id: 'role',
      header: 'Role',
      accessorKey: 'role',
      sortable: true,
      cell: (row) => (
        <div className="text-sm capitalize">{row.role}</div>
      ),
    },
    {
      id: 'createdAt',
      header: 'Registered',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'lastLogin',
      header: 'Last Login',
      accessorKey: 'lastLogin',
      sortable: true,
      cell: (row) => (
        <div className="text-sm text-muted-foreground">
          {row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : 'Never'}
        </div>
      ),
    },
  ]

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Deleted', value: 'deleted' },
      ],
      placeholder: 'Filter by status',
    },
    {
      key: 'role',
      label: 'Role',
      type: 'text',
      placeholder: 'Filter by role',
    },
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by username or email',
    },
    {
      key: 'dateRange',
      label: 'Registration Date',
      type: 'dateRange',
    },
  ]

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    if (key === 'dateRange') {
      setFilters(prev => ({
        ...prev,
        registeredFrom: value?.from,
        registeredTo: value?.to,
      }))
    } else {
      if (value === 'all') {
        setFilters(prev => ({
          ...prev,
          [key]: undefined,
        }))
        return
      }
      setFilters(prev => ({
        ...prev,
        [key]: value || undefined,
      }))
    }
  }

  // Handle filter reset
  const handleFilterReset = () => {
    setFilters({
      status: undefined,
      role: undefined,
      search: undefined,
      registeredFrom: undefined,
      registeredTo: undefined,
    })
  }

  // Handle filter apply
  const handleFilterApply = () => {
    setPage(1) // Reset to first page when filters change
  }

  // Handle row click
  const handleRowClick = (user: User) => {
    router.push(`/admin/users/${user._id}`)
  }

  // Handle sorting
  const handleSortChange = (column: string, order: 'asc' | 'desc') => {
    setSortBy(column)
    setSortOrder(order)
  }

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
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage platform users and their accounts
          </p>
        </div>
        <Button variant="outline" disabled>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        onApply={handleFilterApply}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        sorting={{
          sortBy,
          sortOrder,
          onSortChange: handleSortChange,
        }}
        onRowClick={handleRowClick}
        emptyMessage="No users found. Try adjusting your filters."
      />
    </div>
  )
}
