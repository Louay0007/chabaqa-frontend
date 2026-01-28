import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, Save } from "lucide-react"

export function CreateProductHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/creator/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text-primary">Create New Product</h1>
          <p className="text-muted-foreground mt-1">Sell digital products to your community</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>
    </div>
  )
}