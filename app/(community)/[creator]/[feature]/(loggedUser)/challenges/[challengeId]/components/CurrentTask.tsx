"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Target, Trophy, Clock, Award, FileText, Upload, MessageSquare, ListTodo } from "lucide-react"
import ResourceList from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/ResourceList"

interface CurrentTaskProps {
  challengeTasks: any[]
  selectedTaskDay: number | null
  setSelectedTaskDay: (day: number | null) => void
}

export default function CurrentTask({ challengeTasks, selectedTaskDay, setSelectedTaskDay }: CurrentTaskProps) {
  // Determine the current task based on selection or default to active/first
  const currentTask =
    selectedTaskDay !== null
      ? challengeTasks.find((t) => t.day === selectedTaskDay)
      : challengeTasks.find((t) => t.isActive) || challengeTasks[0]

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
            {currentTask.isActive ? "Active" : currentTask.isCompleted ? "Completed" : "Upcoming"}
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
          <Button className="flex-1 bg-challenges-500 hover:bg-challenges-600">
            <Upload className="h-4 w-4 mr-2" />
            Submit Project
          </Button>
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Get Help
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}