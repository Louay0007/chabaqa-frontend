import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { getResourceIcon } from "@/lib/utils"

interface ChallengeResourcesProps {
  resources: any[]
}

export default function ChallengeResources({ resources }: ChallengeResourcesProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Challenge Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {resources.map((resource) => {
          const IconComponent = getResourceIcon(resource.type)
          return (
            <div key={resource.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <IconComponent className="h-4 w-4 text-primary-500" />
              <div className="flex-1">
                <div className="font-medium text-sm">{resource.title}</div>
                <div className="text-xs text-muted-foreground">{resource.description}</div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}