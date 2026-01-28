
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { PlayCircle, FileText, Code, ExternalLink, BookOpen } from "lucide-react"

interface ChallengeResourceCardProps {
  resource: {
    id: string
    title: string
    type: "video" | "article" | "code" | "tool"
    url: string
    description: string
  }
  resIndex: number
  stepIndex: number
  updateResource: (resourceIndex: number, field: string, value: any) => void
  removeResource: (resourceIndex: number) => void
}

export function ChallengeResourceCard({
  resource,
  resIndex,
  stepIndex,
  updateResource,
  removeResource
}: ChallengeResourceCardProps) {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return PlayCircle
      case "article":
        return FileText
      case "code":
        return Code
      case "tool":
        return ExternalLink
      default:
        return BookOpen
    }
  }

  const IconComponent = getResourceIcon(resource.type)

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <IconComponent className="h-4 w-4 text-primary-500" />
          <Input
            placeholder="Resource Title"
            value={resource.title}
            onChange={(e) => updateResource(resIndex, "title", e.target.value)}
            className="h-8 text-sm w-48"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeResource(resIndex)}
          className="text-red-500 hover:text-red-700 h-8 w-8"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={resource.type}
            onValueChange={(value) => updateResource(resIndex, "type", value)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="article">Article</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="tool">Tool</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">URL</Label>
          <Input
            placeholder="https://example.com/resource"
            value={resource.url}
            onChange={(e) => updateResource(resIndex, "url", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1 mt-3">
        <Label className="text-xs">Description</Label>
        <Textarea
          placeholder="Brief description of resource"
          value={resource.description}
          onChange={(e) => updateResource(resIndex, "description", e.target.value)}
          rows={1}
          className="text-sm"
        />
      </div>
    </div>
  )
}