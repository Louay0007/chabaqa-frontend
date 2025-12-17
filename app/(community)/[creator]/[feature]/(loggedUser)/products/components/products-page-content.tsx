"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Community } from "@/lib/models"
import { ProductWithDetails, ProductPurchase } from "@/lib/api/products-community.api"
import HeaderSection from "./header-section"
import ProductsTabs from "./products-tabs"

interface ProductsPageContentProps {
  creatorSlug: string
  slug: string
  community: Community
  allProducts: ProductWithDetails[]
  userPurchases: ProductPurchase[]
}

export default function ProductsPageContent({
  creatorSlug,
  slug,
  community,
  allProducts,
  userPurchases
}: ProductsPageContentProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)

  const filteredProducts = (allProducts || []).filter((product) => {
    const matchesSearch =
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const isPurchased = (userPurchases || []).some((p) => p.productId === product.id)

    // Filter by published status
    if (!product.isPublished) {
      return false
    }

    if (activeTab === "purchased") {
      return matchesSearch && isPurchased
    }
    if (activeTab === "available") {
      return matchesSearch && !isPurchased
    }
    if (activeTab === "templates") {
      return matchesSearch && product.category === "Templates"
    }
    if (activeTab === "courses") {
      return matchesSearch && product.category === "Courses"
    }
    if (activeTab === "assets") {
      return matchesSearch && product.category === "Assets"
    }
    if (activeTab === "free") {
      return matchesSearch && (product.price || 0) === 0
    }
    if (activeTab === "paid") {
      return matchesSearch && (product.price || 0) > 0
    }
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <HeaderSection allProducts={allProducts} userPurchases={userPurchases} />
        
        <ProductsTabs
          creatorSlug={creatorSlug}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          allProducts={allProducts}
          filteredProducts={filteredProducts}
          userPurchases={userPurchases}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          slug={slug}
        />
      </div>
    </div>
  )
}