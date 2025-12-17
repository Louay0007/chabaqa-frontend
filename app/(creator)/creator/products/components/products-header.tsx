import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Filter, Plus } from "lucide-react"

export function ProductsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-4xl font-bold gradient-text-primary">Product Manager</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Sell and manage your digital and physical products
        </p>
      </div>
      <div className="flex items-center space-x-3 mt-4 sm:mt-0">
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button size="sm" className="bg-primary-500 hover:bg-primary-600" asChild>
          <Link href="/creator/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>
    </div>
  )
}