import { getProductById, getUserPurchases } from "@/lib/mock-data"
import { use } from "react"
import ProductPageContent from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-page-content"

type Props = {
  params: Promise<{ feature: string, productId: string }>
}

export default function ProductPage({ params }: Props) {
  const { feature, productId } = use(params)
  const product = getProductById(productId)
  const userPurchases = getUserPurchases("2") // Mock user ID
  const purchase = userPurchases.find((p) => p.productId === productId)

  if (!product) {
    return <div>Product not found</div>
  }

  return (
    <ProductPageContent 
      slug={feature}
      product={product}
      purchase={purchase}
    />
  )
}