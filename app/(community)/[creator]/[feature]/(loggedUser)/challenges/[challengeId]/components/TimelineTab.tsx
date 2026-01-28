"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ListTodo } from "lucide-react"

interface TimelineTabProps {
  challengeTasks: any[]
  setSelectedTaskDay: (day: number | null) => void
}

export default function TimelineTab({ challengeTasks, setSelectedTaskDay }: TimelineTabProps) {
  if (challengeTasks.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Challenge Timeline</CardTitle>
          <CardDescription>Track your progress through all challenge days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks available yet</p>
            <p className="text-sm text-muted-foreground mt-1">Tasks will appear here once the creator adds them</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Challenge Timeline</CardTitle>
        <CardDescription>Track your progress through all {challengeTasks.length} tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {challengeTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start space-x-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                task.isActive
                  ? "border-challenges-500 bg-challenges-50"
                  : task.isCompleted
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
              onClick={() => setSelectedTaskDay(task.day)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
                  task.isActive
                    ? "bg-challenges-500 text-white"
                    : task.isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                }`}
              >
                {task.isCompleted ? <CheckCircle className="h-5 w-5" /> : task.day}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-semibold">
                    Day {task.day}: {task.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {task.isActive && <Badge className="bg-challenges-500">Active</Badge>}
                    {task.isCompleted && <Badge className="bg-green-500">Completed</Badge>}
                    <span className="text-sm text-muted-foreground">{task.points || 0} pts</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{task.description}</p>
                {task.deliverable && (
                  <p className="text-sm font-medium mt-2">📋 {task.deliverable}</p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  {task.resources && task.resources.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {task.resources.length} resources
                    </Badge>
                  )}
                  {task.notes && (
                    <Badge variant="outline" className="text-xs">
                      Has notes
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}