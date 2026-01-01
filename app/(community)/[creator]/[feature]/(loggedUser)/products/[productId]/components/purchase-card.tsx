"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { tokenStorage } from "@/lib/token-storage"
import { Download } from "lucide-react"
import { productsApi } from "@/lib/api/products.api"

interface PurchaseCardProps {
  product: any
  purchase: any
  isPurchased: boolean
  onPurchased?: (purchase: any) => void
}

export default function PurchaseCard({ product, purchase, isPurchased, onPurchased }: PurchaseCardProps) {
  const { toast } = useToast()
  const totalDownloads = purchase?.downloadCount || 0

  const [open, setOpen] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPendingVerification, setIsPendingVerification] = useState(false)

  const isPaidProduct = useMemo(() => Number(product?.price ?? 0) > 0, [product])

  const handleClaimFree = async () => {
    if (!product) return
    setIsSubmitting(true)
    try {
      await productsApi.purchase(String(product.id || product._id))
      toast({
        title: 'Added to your library',
        description: 'You can now download the files.',
      })
      onPurchased?.({ purchasedAt: new Date().toISOString(), downloadCount: 0 })
      if (typeof window !== 'undefined') {
        document.getElementById('files')?.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (error: any) {
      toast({
        title: 'Unable to get product',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitProof = async () => {
    if (!product) return
    setIsSubmitting(true)
    try {
      const accessToken = tokenStorage.getAccessToken()
      if (!accessToken) {
        toast({
          title: "Authentication required",
          description: "Please sign in to purchase this product.",
          variant: "destructive",
        })
        return
      }

      if (!paymentProof) {
        toast({
          title: "Payment proof required",
          description: "Please upload a payment proof to submit your request.",
          variant: "destructive",
        })
        return
      }

      const promoQuery = promoCode.trim()
        ? `?promoCode=${encodeURIComponent(promoCode.trim())}`
        : ""

      const formData = new FormData()
      formData.append('productId', String(product.id || product._id))
      formData.append('proof', paymentProof)

      const initResponse = await fetch(`/api/payments/manual/init/product${promoQuery}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: formData,
      })

      const initData = await initResponse.json().catch(() => null)
      if (!initResponse.ok) {
        const message = initData?.message || initData?.error || 'Failed to submit payment proof'
        throw new Error(message)
      }

      toast({
        title: 'Payment submitted',
        description: initData?.message || 'Your payment proof was submitted. Please wait for creator verification.',
      })

      setIsPendingVerification(true)

      setOpen(false)
      setPromoCode("")
      setPaymentProof(null)
    } catch (error: any) {
      toast({
        title: "Payment submission failed",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card className="border-0 shadow-sm bg-gradient-to-br from-primary-50 to-blue-50 overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-semibold">
            {isPurchased ? 'Your Purchase' : 'Get This Product'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3 sm:space-y-4">
          {isPurchased ? (
            <>
              {/* Purchase Details */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs sm:text-sm text-muted-foreground">Purchased on:</span>
                  <span className="text-xs sm:text-sm font-medium text-right">
                    {new Date(purchase.purchasedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs sm:text-sm text-muted-foreground">Downloads:</span>
                  <span className="text-xs sm:text-sm font-medium">
                    {totalDownloads} time{totalDownloads !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Download Button */}
              <Button className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium" asChild>
                <Link href="#files">
                  <Download className="h-4 w-4 mr-2 shrink-0" />
                  <span>Download Files</span>
                </Link>
              </Button>
            </>
          ) : (
            <>
              {/* Price Display */}
              <div className="flex items-center justify-between py-2 border-b border-primary-100/50">
                <span className="text-sm sm:text-base text-muted-foreground font-medium">Price:</span>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-bold text-foreground">
                    {product.price === 0 ? 'Free' : `$${product.price}`}
                  </span>
                  {product.price > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      One-time purchase
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase Button */}
              <Button
                className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium bg-primary hover:bg-primary/90"
                onClick={() => {
                  if (isPaidProduct) setOpen(true)
                  else void handleClaimFree()
                }}
                disabled={isSubmitting || isPendingVerification}
              >
                {isPendingVerification
                  ? 'Pending verification'
                  : product.price === 0
                    ? (isSubmitting ? 'Processing...' : 'Get Free & Unlock Downloads')
                    : 'Submit payment proof'}
              </Button>

              {/* Money Back Guarantee */}
              {product.price > 0 && (
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-muted-foreground bg-white/50 rounded-md px-3 py-2 border border-primary-100/30">
                    <span className="font-medium">30-day</span> money back guarantee
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{product?.title || 'Purchase product'}</DialogTitle>
            <DialogDescription>
              Upload a payment proof to submit your manual payment request. Access will be granted after creator verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promoCode">Promo code (optional)</Label>
              <Input
                id="promoCode"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="e.g. WELCOME10"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentProof">Payment proof</Label>
              <Input
                id="paymentProof"
                type="file"
                accept="image/*"
                onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmitProof} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit payment proof'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}