import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { X, Award, Plus, BookOpen } from "lucide-react"
import { ChallengeResourceCard } from "./challenge-resource-card"

interface ChallengeStepCardProps {
  step: {
    day: number
    title: string
    description: string
    deliverable: string
    points: number
    resources: Array<{
      id: string
      title: string
      type: "video" | "article" | "code" | "tool"
      url: string
      description: string
    }>
    instructions: string
  }
  index: number
  formData: any
  setFormData: (data: any) => void
  validationErrors?: Record<string, boolean>
}

export function ChallengeStepCard({ step, index, formData, setFormData, validationErrors = {} }: ChallengeStepCardProps) {
  const updateChallengeStep = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      steps: prev.steps.map((s: any, i: number) => (i === index ? { ...s, [field]: value } : s)),
    }))
  }

  const removeChallengeStep = () => {
    setFormData((prev: any) => ({
      ...prev,
      steps: prev.steps.filter((_: any, i: number) => i !== index).map((s: any, i: number) => ({ ...s, day: i + 1 })),
    }))
  }

  const addResourceToStep = () => {
    const newResource = {
      id: `res-${Date.now()}`,
      title: "",
      type: "article",
      url: "",
      description: "",
    }
    setFormData((prev: any) => ({
      ...prev,
      steps: prev.steps.map((s: any, i: number) =>
        i === index ? { ...s, resources: [...s.resources, newResource] } : s
      ),
    }))
  }

  const updateResource = (resourceIndex: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      steps: prev.steps.map((s: any, i: number) =>
        i === index
          ? {
              ...s,
              resources: s.resources.map((r: any, j: number) =>
                j === resourceIndex ? { ...r, [field]: value } : r
              ),
            }
          : s
      ),
    }))
  }

  const removeResource = (resourceIndex: number) => {
    setFormData((prev: any) => ({
      ...prev,
      steps: prev.steps.map((s: any, i: number) =>
        i === index ? { ...s, resources: s.resources.filter((_: any, j: number) => j !== resourceIndex) } : s
      ),
    }))
  }

  return (
    <Card key={index} className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Day {step.day}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Step Title *</Label>
            <Input
              placeholder="e.g., HTML Basics"
              value={step.title}
              onChange={(e) => updateChallengeStep("title", e.target.value)}
              className={validationErrors[`step_${index}_title`] ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {validationErrors[`step_${index}_title`] && (
              <p className="text-sm text-red-500">Title must be at least 3 characters</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Points</Label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="100"
                className="pl-10"
                value={step.points}
                onChange={(e) => updateChallengeStep("points", Number.parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description *</Label>
          <Textarea
            placeholder="Describe what participants will learn or do..."
            rows={2}
            value={step.description}
            onChange={(e) => updateChallengeStep("description", e.target.value)}
            className={validationErrors[`step_${index}_description`] ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {validationErrors[`step_${index}_description`] && (
            <p className="text-sm text-red-500">Description must be at least 10 characters</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Deliverable *</Label>
          <Textarea
            placeholder="What should participants submit or complete?"
            rows={2}
            value={step.deliverable}
            onChange={(e) => updateChallengeStep("deliverable", e.target.value)}
            className={validationErrors[`step_${index}_deliverable`] ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {validationErrors[`step_${index}_deliverable`] && (
            <p className="text-sm text-red-500">Deliverable must be at least 5 characters</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Detailed Instructions (Markdown)</Label>
          <Textarea
            placeholder="Provide detailed instructions using Markdown..."
            rows={5}
            value={step.instructions}
            onChange={(e) => updateChallengeStep("instructions", e.target.value)}
          />
        </div>

        {/* Resources for this step */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Resources</Label>
            <Button type="button" variant="outline" size="sm" onClick={addResourceToStep}>
              <Plus className="h-4 w-4 mr-1" />
              Add Resource
            </Button>
          </div>
          {step.resources.length === 0 ? (
            <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg bg-gray-50">
              <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-muted-foreground">No resources added for this step</p>
            </div>
          ) : (
            <div className="space-y-3">
              {step.resources.map((resource, resIndex) => (
                <ChallengeResourceCard
                  key={resource.id}
                  resource={resource}
                  resIndex={resIndex}
                  stepIndex={index}
                  updateResource={updateResource}
                  removeResource={removeResource}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}