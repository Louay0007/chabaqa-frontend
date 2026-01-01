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
import { productsApi } from "@/lib/api/products.api"
import { useToast } from "@/components/ui/use-toast"

interface ProductPageContentProps {
  creatorSlug: string
  slug: string
  product: any
  purchase: any
}

export default function ProductPageContent({ creatorSlug, slug, product, purchase }: ProductPageContentProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [downloadProgress, setDownloadProgress] = useState<{[key: string]: number}>({})
  const [localPurchase, setLocalPurchase] = useState<any>(purchase)

  const isPurchased = Boolean(localPurchase)

  const handleDownload = async (fileId: string) => {
    try {
      setDownloadProgress((prev) => ({ ...prev, [fileId]: 10 }))
      const response = await productsApi.download(String(product?.id || product?._id))
      const url = (response as any)?.data?.url || (response as any)?.url
      if (!url) {
        throw new Error('Download URL missing')
      }
      setDownloadProgress((prev) => ({ ...prev, [fileId]: 100 }))
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } catch (error: any) {
      setDownloadProgress((prev) => ({ ...prev, [fileId]: 0 }))
      toast({
        title: 'Download failed',
        description: error?.message || 'Unable to download product',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">
        <ProductHeader 
          creatorSlug={creatorSlug}
          slug={slug}
          product={product}
          isPurchased={isPurchased}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-3 space-y-6">
            <ProductPreview product={product} />
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start gap-1 bg-white border border-gray-200 shadow-sm rounded-lg p-1">
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
              purchase={localPurchase}
              isPurchased={isPurchased}
              onPurchased={(nextPurchase: any) => setLocalPurchase(nextPurchase || { purchasedAt: new Date().toISOString(), downloadCount: 0 })}
            />
            
            <CreatorInfo product={product} />
            
            <ProductDetails product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}