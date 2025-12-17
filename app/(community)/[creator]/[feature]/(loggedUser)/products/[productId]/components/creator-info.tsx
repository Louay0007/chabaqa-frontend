import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Star, User, Award, Calendar } from "lucide-react"

interface CreatorInfoProps {
  product: any
}

export default function CreatorInfo({ product }: CreatorInfoProps) {
  const creatorStats = {
    rating: product.creator.rating || 4.9,
    totalProducts: product.creator.totalProducts || 12,
    totalSales: product.creator.totalSales || 2847,
    joinDate: product.creator.joinDate || "2022-01-15"
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <CardTitle className="text-base sm:text-lg">Creator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4 sm:space-y-6">
        {/* Creator Profile */}
        <div className="flex items-start gap-3 sm:gap-4">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 shrink-0">
            <AvatarImage 
              src={product.creator.avatar || "/placeholder.svg"} 
              className="object-cover"
            />
            <AvatarFallback className="text-sm sm:text-base font-medium">
              {product.creator.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
            <div>
              <h3 className="font-semibold text-sm sm:text-base truncate">
                {product.creator.name}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {product.category} Specialist
              </p>
            </div>
            
            {/* Creator Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs h-5 px-2">
                <Award className="h-2.5 w-2.5 mr-1" />
                Pro Creator
              </Badge>
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.floor(creatorStats.rating)
                        ? "text-yellow-500 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-1">
                {creatorStats.rating} rating
              </span>
            </div>
          </div>
        </div>

        {/* Creator Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50/50 rounded-lg">
          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold text-primary">
              {creatorStats.totalProducts}
            </div>
            <div className="text-xs text-muted-foreground">Products</div>
          </div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold text-primary">
              {creatorStats.totalSales.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Sales</div>
          </div>
          <div className="text-center col-span-2 sm:col-span-1">
            <div className="text-base sm:text-lg font-semibold text-primary">
              {new Date(creatorStats.joinDate).getFullYear()}
            </div>
            <div className="text-xs text-muted-foreground">Joined</div>
          </div>
        </div>

        {/* Creator Description */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {product.creator.bio || 
             `Experienced ${product.category.toLowerCase()} creator with a passion for quality design and user experience. Committed to delivering premium digital products.`
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            className="flex-1 h-9 sm:h-10 text-xs sm:text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Message Creator
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm"
          >
            View Profile
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-4 pt-2 text-center">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Verified Creator</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Active seller</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}