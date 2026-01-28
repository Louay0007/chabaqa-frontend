import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp } from "lucide-react"

interface ProductsPerformanceProps {
  products: any[]
}

export function ProductsPerformance({ products }: ProductsPerformanceProps) {
  if (products.length === 0) return null

  return (
    <EnhancedCard variant="glass" className="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
          Product Performance Overview
        </CardTitle>
        <CardDescription>Your top selling products this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products
            .slice()
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 3)
            .map((product, index) => (
              <div key={product.id} className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg">
                <div className="flex-shrink-0">
                  <Badge
                    variant="secondary"
                    className={`w-8 h-8 rounded-full p-0 flex items-center justify-center ${
                      index === 0
                        ? "bg-yellow-100 text-yellow-800"
                        : index === 1
                          ? "bg-gray-100 text-gray-800"
                          : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {index + 1}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{product.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <span>{product.sales} sales</span>
                    <span>${(product.price * product.sales).toLocaleString()} revenue</span>
                    {product.rating && (
                      <div className="flex items-center">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        {product.rating} rating
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    +{Math.floor(Math.random() * 20 + 10)}%
                  </div>
                  <div className="text-xs text-muted-foreground">growth</div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}