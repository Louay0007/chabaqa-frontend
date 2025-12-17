"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Target, Trophy, Clock, Award, FileText, ExternalLink, Upload, MessageSquare } from "lucide-react"
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

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-challenges-500" />
            Day {currentTask?.day || 1} Challenge
          </div>
          <Badge variant="secondary" className="bg-challenges-100 text-challenges-700">
            {currentTask?.isActive ? "Active" : currentTask?.isCompleted ? "Completed" : "Upcoming"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentTask && (
          <>
            <div>
              <h3 className="text-xl font-semibold mb-2">{currentTask.title}</h3>
              <p className="text-muted-foreground">{currentTask.description}</p>
            </div>

            <div className="bg-challenges-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center">
                <Trophy className="h-4 w-4 mr-2 text-challenges-600" />
                Today's Deliverable
              </h4>
              <p className="text-sm">{currentTask.deliverable}</p>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Award className="h-4 w-4 mr-1" />
                  {currentTask.points} points
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Due: Today 11:59 PM
                </div>
              </div>
            </div>

            {/* Resources & Instructions */}
            <div className="space-y-4">
              <h4 className="font-semibold">Resources & Instructions</h4>

              {/* Resources */}
              <ResourceList resources={currentTask.resources} />

              {/* Instructions */}
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

              {/* Notes */}
              {currentTask.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold mb-2 text-blue-800">Notes</h5>
                  <p className="text-sm text-blue-700">{currentTask.notes}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                Submit Project
              </Button>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Get Help
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}