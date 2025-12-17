"use client"

import { Button } from "@/components/ui/button"

interface NavigationButtonsProps {
  currentStep: number
  stepsLength: number
  setCurrentStep: (step: number) => void
  handleSubmit: () => void
  formData: {
    isPublished: boolean
  }
}

export function NavigationButtons({
  currentStep,
  stepsLength,
  setCurrentStep,
  handleSubmit,
  formData,
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
        disabled={currentStep === 1}
      >
        Previous
      </Button>

      <div className="flex items-center space-x-2">
        {currentStep < stepsLength ? (
          <Button
            onClick={() => setCurrentStep(Math.min(stepsLength, currentStep + 1))}
            className="bg-courses-500 hover:bg-courses-600"
          >
            Next Step
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="bg-courses-500 hover:bg-courses-600">
            {formData.isPublished ? "Create & Publish Course" : "Save as Draft"}
          </Button>
        )}
      </div>
    </div>
  )
}