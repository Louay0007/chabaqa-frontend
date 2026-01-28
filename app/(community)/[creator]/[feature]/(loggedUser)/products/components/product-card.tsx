import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Users, Download, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ProductWithDetails, ProductPurchase } from "@/lib/api/products-community.api"
import { getFileTypeIcon } from "@/lib/utilsmedia"

interface ProductCardProps {
  creatorSlug: string
  product: ProductWithDetails | ProductPurchase
  isPurchased: boolean
  isSelected: boolean
  onSelect: () => void
  slug: string
}

function isProductPurchase(product: ProductWithDetails | ProductPurchase): product is ProductPurchase {
  return (product as ProductPurchase).product !== undefined;
}

export default function ProductCard({
  creatorSlug,
  product,
  isPurchased,
  isSelected,
  onSelect,
  slug
}: ProductCardProps) {
  const productDetails = isProductPurchase(product) ? product.product : product;
  const fileTypes = [...new Set((productDetails.files || []).map((f: any) => f.type))]

  return (
    <Card
      className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isSelected ? "ring-2 ring-primary-500" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative md:w-64">
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
            <Image
              src={(productDetails.images && productDetails.images[0]) || "/placeholder.svg?height=200&width=256&query=digital-product"}
              alt={productDetails.title}
              width={256}
              height={200}
              className="w-full h-48 md:h-full object-contain p-4 rounded-t-lg md:rounded-l-lg md:rounded-t-none"
            />
          </div>
          <div className="absolute top-3 right-3">
            {isPurchased ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Owned
              </Badge>
            ) : (product.price || 0) === 0 ? (
              <Badge className="bg-blue-500 text-white">Free</Badge>
            ) : (
              <Badge variant="secondary" className="bg-white/90">
                ${product.price || 0}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-semibold mb-2">{productDetails.title}</h3>
              <p className="text-muted-foreground line-clamp-2">{productDetails.description}</p>
            </div>
            <div className="flex items-center text-sm text-muted-foreground ml-4">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span>{productDetails.rating || "4.8"} ({productDetails.sales || 0})</span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground mb-4">
            <Badge variant="outline" className="text-xs">
              {productDetails.category}
            </Badge>
            {fileTypes.map((type, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {type}
              </Badge>
            ))}
            <div className="flex items-center ml-auto">
              <Users className="h-4 w-4 mr-1" />
              {productDetails.sales || 0} downloads
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={productDetails.creator?.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {(productDetails.creator?.name || 'Creator')
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{productDetails.creator?.name || 'Creator'}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="text-primary-600 hover:text-primary-800"
              >
                <Link href={`/${creatorSlug}/${slug}/products/${productDetails.id}`}>
                  View Details
                </Link>
              </Button>
              
              {isPurchased ? (
                <Button size="sm" asChild>
                  <Link href={`/${creatorSlug}/${slug}/products/${productDetails.id}/download`}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Link>
                </Button>
              ) : (product.price || 0) === 0 ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/${creatorSlug}/${slug}/products/${productDetails.id}`}>
                    Get Free
                  </Link>
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <Link href={`/${creatorSlug}/${slug}/products/${productDetails.id}`}>
                    Buy - ${product.price || 0}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}