"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Target, Trophy, Clock, Award, FileText, Upload, MessageSquare, ListTodo } from "lucide-react"
import ResourceList from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/ResourceList"
import SubmitProjectModal from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/SubmitProjectModal"
import { useState, useEffect } from "react"

interface CurrentTaskProps {
  challengeTasks: any[]
  selectedTaskDay: number | null
  setSelectedTaskDay: (day: number | null) => void
  challengeId: string
}

export default function CurrentTask({ challengeTasks, selectedTaskDay, setSelectedTaskDay, challengeId }: CurrentTaskProps) {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [submittedTasks, setSubmittedTasks] = useState<string[]>([])
  const [existingSubmissionStatus, setExistingSubmissionStatus] = useState<boolean>(false)

  // Determine the current task based on selection or default to active/first
  const currentTask =
    selectedTaskDay !== null
      ? challengeTasks.find((t) => t.day === selectedTaskDay)
      : challengeTasks.find((t) => t.isActive) || challengeTasks[0]

  // Check if we already have a submission for this task from the API
  // We can do this by checking if the task is marked as "hasSubmission" or similar from the parent
  // BUT since we don't have that prop, let's fetch it or use a more robust check if possible.
  // Ideally, the parent component should pass down "submissions" or "submissionStatus" map.
  // For now, let's assume if it's NOT completed but we want to know if it's pending, we need to check.
  
  // Actually, let's fetch the submission status when the task changes if we don't have it.
  // However, simpler approach: The backend prevents duplicate submissions.
  // The frontend "isCompleted" usually means "Approved" or "Done".
  // We need to know if "Pending".
  
  // Let's add a useEffect to check submission status for the current task
  useEffect(() => {
    const checkSubmission = async () => {
      if (!currentTask?.id) return;
      
      try {
        // We can reuse the submissions endpoint or a specific check endpoint
        // Let's use the submissions endpoint and filter
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/challenges/${challengeId}/submissions`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          const submissions = Array.isArray(data) ? data : (data.data || []);
          
          const hasSubmission = submissions.some((s: any) => 
            s.taskId === currentTask.id || 
            String(s.taskId) === String(currentTask.id) ||
            String(s.taskId) === String(currentTask.day)
          );
          
          setExistingSubmissionStatus(hasSubmission);
        }
      } catch (error) {
        console.error("Error checking submission status:", error)
      }
    }

    checkSubmission();
  }, [currentTask?.id, challengeId]);

  const isLocked = currentTask?.isCompleted || submittedTasks.includes(currentTask?.id) || existingSubmissionStatus

  if (!currentTask) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-challenges-500" />
            Current Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks available</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for new tasks</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-challenges-500" />
            Day {currentTask.day} Challenge
          </div>
          <Badge variant="secondary" className="bg-challenges-100 text-challenges-700">
            {currentTask.isActive ? "Active" : isLocked ? "Completed" : "Upcoming"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">{currentTask.title}</h3>
          <p className="text-muted-foreground">{currentTask.description}</p>
        </div>

        {currentTask.deliverable && (
          <div className="bg-challenges-50 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-challenges-600" />
              Today's Deliverable
            </h4>
            <p className="text-sm">{currentTask.deliverable}</p>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Award className="h-4 w-4 mr-1" />
                {currentTask.points || 0} points
              </div>
              {currentTask.dueDate && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Due: {new Date(currentTask.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resources & Instructions */}
        <div className="space-y-4">
          <h4 className="font-semibold">Resources & Instructions</h4>

          {/* Resources */}
          {currentTask.resources && currentTask.resources.length > 0 && (
            <ResourceList resources={currentTask.resources} />
          )}

          {/* Instructions */}
          {currentTask.instructions && (
            <div className="bg-white border rounded-lg p-4">
              <h5 className="font-semibold mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Detailed Instructions
              </h5>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {currentTask.instructions}
                </pre>
              </div>
            </div>
          )}

          {/* Notes */}
          {currentTask.notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-semibold mb-2 text-blue-800">Notes</h5>
              <p className="text-sm text-blue-700">{currentTask.notes}</p>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <Button 
            className="flex-1 bg-challenges-500 hover:bg-challenges-600"
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={isLocked}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isLocked ? "Project Submitted" : "Submit Project"}
          </Button>
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Get Help
          </Button>
        </div>

        <SubmitProjectModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          challengeId={challengeId}
          taskId={currentTask.id}
          taskTitle={currentTask.title}
          onSubmitSuccess={() => {
            // Refresh or update local state if needed
            // window.location.reload(); // Simple refresh to see updated state
            if (currentTask?.id) {
              setSubmittedTasks(prev => [...prev, currentTask.id])
            }
          }}
        />
      </CardContent>
    </Card>
  )
}