'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, PromoCodeUsageDto } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface PromoCodeUsageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
}

export function PromoCodeUsageDialog({ open, onOpenChange, code }: PromoCodeUsageDialogProps) {
  const { toast } = useToast()
  const [usage, setUsage] = useState<PromoCodeUsageDto[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    if (open && code) {
      setPage(1)
      loadUsage(1)
    } else {
      setUsage([])
    }
  }, [open, code])

  const loadUsage = async (p: number) => {
    setLoading(true)
    try {
      const res = await api.promoCodes.getUsage(code, { page: p, limit })
        .catch(() => null as any)
      const data = res?.data ?? res
      setUsage(Array.isArray(data) ? data : data?.data || [])
      setTotal(res?.total ?? data?.total ?? 0)
      setTotalPages(res?.totalPages ?? data?.totalPages ?? 1)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load usage data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    loadUsage(newPage)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Promo Code Usage</DialogTitle>
          <DialogDescription>
            Users who have used code: <span className="font-mono font-semibold">{code}</span>
            {total > 0 && <span className="ml-2">({total} total)</span>}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : usage.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No usage data available
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Final</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage.map((item) => (
                    <TableRow key={item.orderId}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{item.buyerName}</div>
                          <div className="text-muted-foreground">{item.buyerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm capitalize">{item.contentType}</div>
                      </TableCell>
                      <TableCell>{item.originalAmount.toFixed(2)} DT</TableCell>
                      <TableCell className="text-green-600">
                        -{item.discountAmount.toFixed(2)} DT
                      </TableCell>
                      <TableCell className="font-semibold">
                        {item.finalAmount.toFixed(2)} DT
                      </TableCell>
                      <TableCell>
                        {new Date(item.usedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.orderStatus === 'paid' ? 'default' : 'outline'}>
                          {item.orderStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
