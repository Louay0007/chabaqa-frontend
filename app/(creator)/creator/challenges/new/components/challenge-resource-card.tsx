
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { getResourceIcon } from "@/lib/utils"

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
  getError?: (field: "title" | "type" | "url") => string | undefined
}

export function ChallengeResourceCard({
  resource,
  resIndex,
  stepIndex,
  updateResource,
  removeResource,
  getError
}: ChallengeResourceCardProps) {
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
            className={`h-8 text-sm w-48 ${getError?.("title") ? "border-red-500 focus-visible:ring-red-500" : ""}`}
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
            <SelectTrigger className={`h-8 text-sm ${getError?.("type") ? "border-red-500" : ""}`}>
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
            className={`h-8 text-sm ${getError?.("url") ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
        </div>
      </div>
      {(getError?.("title") || getError?.("type") || getError?.("url")) && (
        <p className="mt-2 text-xs text-red-500">
          {getError?.("title") || getError?.("type") || getError?.("url")}
        </p>
      )}
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
