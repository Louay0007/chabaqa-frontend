import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface PurchaseCardProps {
  product: any
  purchase: any
  isPurchased: boolean
}

export default function PurchaseCard({ product, purchase, isPurchased }: PurchaseCardProps) {
  const totalDownloads = purchase?.downloadCount || 0

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-primary-50 to-blue-50 sticky top-4">
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
            <Button className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium bg-primary hover:bg-primary/90">
              {product.price === 0 ? 'Download Now' : 'Purchase Now'}
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
  )
}