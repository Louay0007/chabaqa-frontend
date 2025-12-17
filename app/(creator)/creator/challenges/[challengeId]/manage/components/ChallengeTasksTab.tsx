"use client"

import { useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChallengeTask } from "@/lib/models"

export default function ChallengeTasksTab({
  challengeTasks,
  challengeId,
}: {
  challengeTasks: ChallengeTask[]
  challengeId: string
}) {
  const [newTask, setNewTask] = useState({
    day: "",
    title: "",
    description: "",
    deliverable: "",
    points: "",
    instructions: "",
    notes: "",
  })

  const handleAddTask = () => {
    console.log("Adding task:", newTask)
    setNewTask({
      day: "",
      title: "",
      description: "",
      deliverable: "",
      points: "",
      instructions: "",
      notes: "",
    })
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Tasks</CardTitle>
            <CardDescription>Manage the daily tasks for your challenge</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogDescription>Create a new daily task for the challenge</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taskDay">Day</Label>
                    <Input
                      id="taskDay"
                      type="number"
                      placeholder="1"
                      value={newTask.day}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, day: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taskPoints">Points</Label>
                    <Input
                      id="taskPoints"
                      type="number"
                      placeholder="100"
                      value={newTask.points}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, points: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskTitle">Task Title</Label>
                  <Input
                    id="taskTitle"
                    placeholder="e.g., HTML Basics"
                    value={newTask.title}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskDescription">Description</Label>
                  <Textarea
                    id="taskDescription"
                    rows={3}
                    placeholder="Brief description of the task..."
                    value={newTask.description}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskDeliverable">Deliverable</Label>
                  <Textarea
                    id="taskDeliverable"
                    rows={2}
                    placeholder="What should participants submit?"
                    value={newTask.deliverable}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, deliverable: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskInstructions">Instructions</Label>
                  <Textarea
                    id="taskInstructions"
                    rows={4}
                    placeholder="Detailed instructions for completing the task..."
                    value={newTask.instructions}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, instructions: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskNotes">Notes</Label>
                  <Textarea
                    id="taskNotes"
                    rows={2}
                    placeholder="Additional notes or tips..."
                    value={newTask.notes}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTask}>Add Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {challengeTasks.map((task) => (
            <div key={task.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">Day {task.day}</Badge>
                  <h3 className="font-semibold">{task.title}</h3>
                  <Badge variant="secondary">{task.points} pts</Badge>
                  {task.isActive && <Badge className="bg-green-500">Active</Badge>}
                  {task.isCompleted && <Badge className="bg-blue-500">Completed</Badge>}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 bg-transparent">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-2">{task.description}</p>
              <div className="text-sm">
                <strong>Deliverable:</strong> {task.deliverable}
              </div>
              {task.notes && (
                <div className="text-sm mt-2 p-2 bg-blue-50 rounded">
                  <strong>Notes:</strong> {task.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}