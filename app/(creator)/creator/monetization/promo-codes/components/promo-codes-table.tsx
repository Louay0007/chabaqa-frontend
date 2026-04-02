'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search, MoreHorizontal, Edit, Trash2, Copy,
  BarChart3, Users, CheckCircle, XCircle, Clock, Loader2,
} from 'lucide-react'
import { PromoCodeResponseDto } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface PromoCodesTableProps {
  promoCodes: PromoCodeResponseDto[]
  loading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  activeTab: string
  onTabChange: (tab: string) => void
  onEdit: (code: PromoCodeResponseDto) => void
  onDelete: (code: PromoCodeResponseDto) => Promise<void>
  onViewStats: (code: PromoCodeResponseDto) => void
  onViewUsage: (code: PromoCodeResponseDto) => void
}

export function PromoCodesTable({
  promoCodes, loading, searchQuery, onSearchChange,
  activeTab, onTabChange, onEdit, onDelete,
  onViewStats, onViewUsage,
}: PromoCodesTableProps) {
  const { toast } = useToast()
  const [deletingCode, setDeletingCode] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PromoCodeResponseDto | null>(null)

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: 'Copied!', description: `Code "${code}" copied to clipboard` })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeletingCode(deleteTarget.id)
    try {
      await onDelete(deleteTarget)
    } finally {
      setDeletingCode(null)
      setDeleteTarget(null)
    }
  }

  const getStatusBadge = (code: PromoCodeResponseDto) => {
    const now = new Date()
    const isExpired = code.endsAt && new Date(code.endsAt) < now
    const isScheduled = code.startsAt && new Date(code.startsAt) > now
    const isMaxedOut = code.maxRedemptions && code.redemptionsCount >= code.maxRedemptions

    if (!code.isActive) {
      return <Badge variant="outline" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Inactive</Badge>
    }
    if (isExpired) {
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Expired</Badge>
    }
    if (isMaxedOut) {
      return <Badge variant="secondary" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Maxed Out</Badge>
    }
    if (isScheduled) {
      return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Scheduled</Badge>
    }
    return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Active</Badge>
  }

  const getDiscountDisplay = (code: PromoCodeResponseDto) => {
    const parts: string[] = []
    if (code.percentOff) parts.push(`${code.percentOff}%`)
    if (code.amountOffDT) parts.push(`${code.amountOffDT} DT`)
    if (parts.length === 0) return 'N/A'
    return parts.join(' + ') + ' off'
  }

  const getAppliesToDisplay = (code: PromoCodeResponseDto) => {
    if (!code.appliesToType) return 'All content'
    if (code.appliesToId) return `Specific ${code.appliesToType}`
    return `All ${code.appliesToType}s`
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Promo Code Management</CardTitle>
          <CardDescription>View and manage your promo codes</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search promo codes..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value={activeTab} className="m-0">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Applies To</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : promoCodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No promo codes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      promoCodes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                          <TableCell>{getDiscountDisplay(code)}</TableCell>
                          <TableCell>{getAppliesToDisplay(code)}</TableCell>
                          <TableCell>
                            {code.redemptionsCount}
                            {code.maxRedemptions != null && ` / ${code.maxRedemptions}`}
                          </TableCell>
                          <TableCell>{getStatusBadge(code)}</TableCell>
                          <TableCell>
                            {code.endsAt
                              ? new Date(code.endsAt).toLocaleDateString()
                              : 'No expiry'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={deletingCode === code.id}>
                                  {deletingCode === code.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => copyToClipboard(code.code)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Code
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onViewStats(code)}>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  View Stats
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onViewUsage(code)}>
                                  <Users className="h-4 w-4 mr-2" />
                                  View Usage
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onEdit(code)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => setDeleteTarget(code)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.code}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
