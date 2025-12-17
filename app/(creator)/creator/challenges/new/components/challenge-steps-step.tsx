"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Target, X, Award, Trash2 } from "lucide-react"
import { ChallengeStepCard } from "./challenge-step-card"

interface ChallengeStepsStepProps {
  formData: any
  setFormData: (data: any) => void
}

export function ChallengeStepsStep({ formData, setFormData }: ChallengeStepsStepProps) {
  const addChallengeStep = () => {
    const newStep = {
      day: formData.steps.length + 1,
      title: "",
      description: "",
      deliverable: "",
      points: 100,
      resources: [],
      instructions: "",
    }
    setFormData((prev: any) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }))
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-challenges-500" />
            Challenge Steps
          </div>
          <Button onClick={addChallengeStep} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
        </CardTitle>
        <CardDescription>Define daily tasks and deliverables for your challenge</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {formData.steps.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No steps added yet</h3>
            <p className="text-muted-foreground mb-4">Add your first challenge step to get started</p>
            <Button onClick={addChallengeStep}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Step
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.steps.map((step: any, index: number) => (
              <ChallengeStepCard
                key={index}
                step={step}
                index={index}
                formData={formData}
                setFormData={setFormData}
              />
            ))}
          </div>
        )}
      </CardContent>
    </EnhancedCard>
  )
}