"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import ProductPageContent from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-page-content"
import { productsApi } from "@/lib/api/products.api"
import { productsCommunityApi, ProductWithDetails, ProductPurchase } from "@/lib/api/products-community.api"

export default function ProductPage() {
  const params = useParams<{ creator: string; feature: string; productId: string }>()
  const creator = params?.creator
  const feature = params?.feature
  const productId = params?.productId

  const [product, setProduct] = useState<ProductWithDetails | null>(null)
  const [purchase, setPurchase] = useState<ProductPurchase | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) return
    let active = true
    
    const load = async () => {
      setLoading(true)
      try {
        // Fetch product details using enhanced API
        const productData = await productsCommunityApi.getProductDetail(String(productId))
        if (!active) return
        setProduct(productData)

        // Check purchase status
        const purchaseData = await productsCommunityApi.getUserPurchaseStatus(String(productId))
        if (!active) return
        setPurchase(purchaseData)
      } catch (error) {
        console.error('Failed to load product:', error)
        if (!active) return
        setProduct(null)
        setPurchase(null)
      } finally {
        if (!active) return
        setLoading(false)
      }
    }
    
    void load()
    return () => {
      active = false
    }
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <ProductPageContent
      creatorSlug={String(creator || '')}
      slug={String(feature || '')}
      product={product}
      purchase={purchase}
    />
  )
}