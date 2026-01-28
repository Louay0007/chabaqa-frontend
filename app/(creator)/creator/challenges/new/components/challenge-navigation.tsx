import { Button } from "@/components/ui/button"

interface ChallengeNavigationProps {
  currentStep: number
  steps: Array<{ id: number }>
  setCurrentStep: (step: number) => void
  onSubmit: () => void
  isPublished: boolean
}

export function ChallengeNavigation({
  currentStep,
  steps,
  setCurrentStep,
  onSubmit,
  isPublished
}: ChallengeNavigationProps) {
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
            onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
            className="bg-challenges-500 hover:bg-challenges-600"
          >
            Next Step
          </Button>
        ) : (
          <Button onClick={onSubmit} className="bg-challenges-500 hover:bg-challenges-600">
            {isPublished ? "Create & Publish Challenge" : "Save as Draft"}
          </Button>
        )}
      </div>
    </div>
  )
}