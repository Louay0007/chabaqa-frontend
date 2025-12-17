"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProductHeader from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-header"
import ProductPreview from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-preview"
import ProductOverview from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-overview"
import ProductFiles from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-files"
import ProductLicense from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-license"
import ProductCommunity from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-community"
import PurchaseCard from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/purchase-card"
import CreatorInfo from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/creator-info"
import ProductDetails from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-details"

interface ProductPageContentProps {
  slug: string
  product: any
  purchase: any
}

export default function ProductPageContent({ slug, product, purchase }: ProductPageContentProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [downloadProgress, setDownloadProgress] = useState<{[key: string]: number}>({})

  const isPurchased = !!purchase

  const handleDownload = (fileId: string) => {
    setDownloadProgress(prev => ({...prev, [fileId]: 0}))
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        const newProgress = (prev[fileId] || 0) + 10
        if (newProgress >= 100) {
          clearInterval(interval)
          return {...prev, [fileId]: 100}
        }
        return {...prev, [fileId]: newProgress}
      })
    }, 200)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <ProductHeader 
          slug={slug}
          product={product}
          isPurchased={isPurchased}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <ProductPreview product={product} />
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="license">License</TabsTrigger>
                <TabsTrigger value="community">Community</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <ProductOverview product={product} />
              </TabsContent>

              <TabsContent value="files" className="mt-6">
                <ProductFiles 
                  product={product}
                  isPurchased={isPurchased}
                  downloadProgress={downloadProgress}
                  onDownload={handleDownload}
                />
              </TabsContent>

              <TabsContent value="license" className="mt-6">
                <ProductLicense product={product} />
              </TabsContent>

              <TabsContent value="community" className="mt-6">
                <ProductCommunity />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <PurchaseCard 
              product={product}
              purchase={purchase}
              isPurchased={isPurchased}
            />
            
            <CreatorInfo product={product} />
            
            <ProductDetails product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}