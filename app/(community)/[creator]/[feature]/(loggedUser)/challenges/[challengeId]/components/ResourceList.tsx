import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { getResourceIcon } from "@/lib/utils"

interface ResourceListProps {
  resources: any[]
}

export default function ResourceList({ resources }: ResourceListProps) {
  return (
    <div className="space-y-3">
      {resources.map((resource) => {
        const IconComponent = getResourceIcon(resource.type)
        return (
          <div
            key={resource.id}
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <IconComponent className="h-5 w-5 text-primary-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium">{resource.title}</div>
              <div className="text-sm text-muted-foreground">{resource.description}</div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )
      })}
    </div>
  )
}