"use client"

import { useEffect, useState } from "react"
import { ProductsHeader } from "./components/products-header"
import { ProductsStatsGrid } from "./components/products-stats-grid"
import { ProductsSearch } from "./components/products-search"
import { ProductsTabs } from "./components/products-tabs"
import { ProductsPerformance } from "./components/products-performance"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"

export default function CreatorProductsPage() {
  const { toast } = useToast()
  const { selectedCommunity, selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState<number | null>(null)

  // Reload when community changes
  useEffect(() => {
    if (communityLoading || !selectedCommunityId) return

    const load = async () => {
      setLoading(true)
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) { setProducts([]); return }

        // Fetch creator products - backend returns { success: true, data: { products, pagination } }
        const productsRes = await api.products.getByCreator(user._id || user.id, { limit: 50 }).catch(() => null as any)
        const rawProducts = productsRes?.data?.products || productsRes?.products || productsRes?.data?.items || productsRes?.items || []
        const normalized = (Array.isArray(rawProducts) ? rawProducts : []).map((p: any) => {
          const price = (p?.pricing?.price ?? p?.price ?? 0)
          const sales = Number(p?.sales ?? p?.salesCount ?? 0)

          return {
            id: p.id || p._id,
            title: p.title || p.name,
            name: p.title || p.name,
            description: p.description || "",
            price: Number(price || 0),
            type: p.type,
            category: p.category,
            communityId: p.communityId,
            isPublished: Boolean(p.isPublished),
            images: Array.isArray(p.images) && p.images.length > 0
              ? p.images
              : (p.thumbnail ? [p.thumbnail] : []),
            variants: Array.isArray(p.variants) ? p.variants : [],
            inventory: typeof p.inventory === 'number' ? p.inventory : 0,
            sales,
            salesCount: sales,
            rating: Number(p.averageRating ?? p.rating ?? 0),
            ratingCount: Number(p.ratingCount ?? 0),
          }
        })
        setProducts(normalized)

        // Fetch analytics revenue (last 30 days)
        const now = new Date()
        const to = now.toISOString()
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
        const prodAgg = await api.creatorAnalytics.getProducts({ from, to }).catch(() => null as any)
        const byProduct = prodAgg?.data?.byProduct || prodAgg?.byProduct || prodAgg?.data?.items || prodAgg?.items || []
        const totalRevenue = (Array.isArray(byProduct) ? byProduct : []).reduce((sum: number, x: any) => sum + Number(x.revenue ?? 0), 0)
        if (!Number.isNaN(totalRevenue)) setRevenue(totalRevenue)
      } catch (e: any) {
        toast({ title: 'Failed to load products', description: e?.message || 'Please try again later.', variant: 'destructive' as any })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCommunityId, selectedCommunity, communityLoading, toast])

  return (
    <div className="space-y-8 p-5">
      <ProductsHeader />
      <ProductsStatsGrid products={products} revenue={revenue} />
      <ProductsSearch />
      <ProductsTabs products={products} communityId={selectedCommunityId} />
      <ProductsPerformance products={products} />
    </div>
  )
}