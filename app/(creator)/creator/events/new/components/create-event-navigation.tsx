"use client"

import { Button } from "@/components/ui/button"

interface CreateEventNavigationProps {
  currentStep: number
  steps: any[]
  setCurrentStep: (step: number) => void
  handleSubmit: () => void
  onNextStep?: () => void
}

export function CreateEventNavigation({
  currentStep,
  steps,
  setCurrentStep,
  handleSubmit,
  onNextStep,
}: CreateEventNavigationProps) {
  const handleNext = () => {
    if (onNextStep) {
      onNextStep()
    } else {
      setCurrentStep(Math.min(steps.length, currentStep + 1))
    }
  }

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
        {currentStep < steps.length ? (
          <Button
            onClick={handleNext}
            className="bg-events-500 hover:bg-events-600"
          >
            Next Step
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="bg-events-500 hover:bg-events-600">
            Save Event Draft
          </Button>
        )}
      </div>
    </div>
  )
}