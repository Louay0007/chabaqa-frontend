"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import ProductPageContent from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-page-content"
import { productsApi } from "@/lib/api/products.api"
import { apiClient } from "@/lib/api/client"

export default function ProductPage() {
  const params = useParams<{ creator: string; feature: string; productId: string }>()
  const creator = params?.creator
  const feature = params?.feature
  const productId = params?.productId

  const [product, setProduct] = useState<any | null>(null)
  const [purchase, setPurchase] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) return
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const productRes = await productsApi.getById(String(productId))
        const productPayload = (productRes as any)?.data?.data ?? (productRes as any)?.data ?? productRes
        if (!active) return
        setProduct(productPayload)

        // Purchases: backend used elsewhere as GET /products/my-purchases
        const purchasesRes = await apiClient.get<any>('/products/my-purchases').catch(() => null)
        const purchaseList = (purchasesRes as any)?.products || (purchasesRes as any)?.data?.products || (purchasesRes as any)?.data || []
        const match = Array.isArray(purchaseList)
          ? purchaseList.find((p: any) => String(p?.productId || p?.product?.id || p?.product?._id) === String(productId))
          : null
        setPurchase(match || null)
      } catch {
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
    return <div className="min-h-screen bg-gray-50" />
  }

  if (!product) {
    return <div>Product not found</div>
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