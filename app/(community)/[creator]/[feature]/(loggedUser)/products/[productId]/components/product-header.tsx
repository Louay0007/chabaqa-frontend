import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, Star } from "lucide-react"

interface ProductHeaderProps {
  creatorSlug: string
  slug: string
  product: any
  isPurchased: boolean
}

export default function ProductHeader({ creatorSlug, slug, product, isPurchased }: ProductHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
      {/* Back Button and Title Section */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <Button variant="ghost" size="icon" asChild className="shrink-0 h-9 w-9 sm:h-10 sm:w-10">
          <Link href={`/${creatorSlug}/${slug}/products`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight truncate sm:truncate-none">
            {product.title}
          </h1>
          
          {/* Product Meta Info - Responsive Layout */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            <span className="shrink-0">{product.category}</span>
            <span className="hidden sm:inline">•</span>
            <span className="shrink-0">{product.files?.length || 0} files</span>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center shrink-0">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 mr-1" />
              <span className="whitespace-nowrap">
                {product.rating || "4.8"} ({product.sales} sales)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Status - Mobile: Below title, Desktop: Right side */}
      {isPurchased && (
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground sm:shrink-0 ml-12 sm:ml-0">
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 sm:mr-2" />
          <span className="font-medium">Purchased</span>
        </div>
      )}
    </div>
  )
}