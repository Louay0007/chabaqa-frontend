
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

const categories = [
  "Code Review",
  "Career Mentorship",
  "Technical Interview",
  "Architecture Review",
  "Portfolio Review",
  "Skill Assessment",
  "Project Planning",
  "Learning Path",
]

interface BasicInfoStepProps {
  formData: {
    title: string
    description: string
    category: string
    targetAudience: string
    requirements: string
  }
  handleInputChange: (field: string, value: any) => void
  validationErrors?: Record<string, string>
}

export function BasicInfoStep({ formData, handleInputChange, validationErrors = {} }: BasicInfoStepProps) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-sessions-500" />
          Basic Session Information
        </CardTitle>
        <CardDescription>Start with the fundamentals of your session</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Session Title *</Label>
          <Input
            id="title"
            placeholder="e.g., 1-on-1 Code Review Session"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className={validationErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {validationErrors.title && (
            <p className="text-sm text-red-500">{validationErrors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Session Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe what participants will get from this session..."
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className={validationErrors.description ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {validationErrors.description && (
            <p className="text-sm text-red-500">{validationErrors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category">Session Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger className={validationErrors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.category && (
              <p className="text-sm text-red-500">{validationErrors.category}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              placeholder="e.g., Beginner developers, Career changers"
              value={formData.targetAudience}
              onChange={(e) => handleInputChange("targetAudience", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="requirements">Prerequisites/Requirements</Label>
          <Textarea
            id="requirements"
            placeholder="What should participants prepare or know beforehand?"
            rows={3}
            value={formData.requirements}
            onChange={(e) => handleInputChange("requirements", e.target.value)}
          />
        </div>
      </CardContent>
    </EnhancedCard>
  )
}