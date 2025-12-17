import Image from "next/image"
import { Card } from "@/components/ui/card"

interface ProductPreviewProps {
  product: any
}

export default function ProductPreview({ product }: ProductPreviewProps) {
  return (
    <Card className="border-0 shadow-sm">
      <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
        <Image
          src={product.images[0] || "/placeholder.svg?height=400&width=600&query=digital-product"}
          alt={product.title}
          width={600}
          height={400}
          className="object-contain max-h-full max-w-full"
        />
      </div>
    </Card>
  )
}