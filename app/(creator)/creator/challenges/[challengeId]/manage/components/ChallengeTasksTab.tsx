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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ChallengeTask {
  id: string
  day: number
  title: string
  description: string
  deliverable: string
  isCompleted: boolean
  isActive: boolean
  points: number
  instructions: string
  notes?: string
}

interface Props {
  challengeTasks: ChallengeTask[]
  onAddTask: (task: {
    day: number
    title: string
    description: string
    deliverable: string
    points: number
    instructions: string
    notes?: string
  }) => Promise<void>
  onUpdateTask: (taskId: string, task: Partial<ChallengeTask>) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
}

export default function ChallengeTasksTab({
  challengeTasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: Props) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ChallengeTask | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newTask, setNewTask] = useState({
    day: "",
    title: "",
    description: "",
    deliverable: "",
    points: "",
    instructions: "",
    notes: "",
  })

  const resetNewTask = () => {
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

  const handleAddTask = async () => {
    // Validate all required fields
    if (!newTask.title || !newTask.day) {
      return
    }
    if (!newTask.description) {
      return
    }
    if (!newTask.deliverable) {
      return
    }
    if (!newTask.instructions) {
      return
    }
    
    setIsSubmitting(true)
    try {
      await onAddTask({
        day: Number(newTask.day),
        title: newTask.title,
        description: newTask.description,
        deliverable: newTask.deliverable,
        points: Number(newTask.points) || 0,
        instructions: newTask.instructions,
        notes: newTask.notes || undefined,
      })
      resetNewTask()
      setIsAddOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTask = async () => {
    if (!editingTask) return
    setIsSubmitting(true)
    try {
      await onUpdateTask(editingTask.id, {
        day: editingTask.day,
        title: editingTask.title,
        description: editingTask.description,
        deliverable: editingTask.deliverable,
        points: editingTask.points,
        instructions: editingTask.instructions,
        notes: editingTask.notes,
      })
      setEditingTask(null)
      setIsEditOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    await onDeleteTask(taskId)
  }

  const openEditDialog = (task: ChallengeTask) => {
    setEditingTask({ ...task })
    setIsEditOpen(true)
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Tasks</CardTitle>
            <CardDescription>Manage the daily tasks for your challenge</CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogDescription>Create a new daily task for the challenge. Fields marked with * are required.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taskDay">Day <span className="text-red-500">*</span></Label>
                    <Input
                      id="taskDay"
                      type="number"
                      placeholder="1"
                      min={1}
                      value={newTask.day}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, day: e.target.value }))}
                      className={!newTask.day ? "border-red-200" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taskPoints">Points</Label>
                    <Input
                      id="taskPoints"
                      type="number"
                      placeholder="100"
                      min={0}
                      value={newTask.points}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, points: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskTitle">Task Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="taskTitle"
                    placeholder="e.g., HTML Basics"
                    value={newTask.title}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                    className={!newTask.title ? "border-red-200" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskDescription">Description <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="taskDescription"
                    rows={3}
                    placeholder="Brief description of the task..."
                    value={newTask.description}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                    className={!newTask.description ? "border-red-200" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskDeliverable">Deliverable <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="taskDeliverable"
                    rows={2}
                    placeholder="What should participants submit?"
                    value={newTask.deliverable}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, deliverable: e.target.value }))}
                    className={!newTask.deliverable ? "border-red-200" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskInstructions">Instructions <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="taskInstructions"
                    rows={4}
                    placeholder="Detailed instructions for completing the task..."
                    value={newTask.instructions}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, instructions: e.target.value }))}
                    className={!newTask.instructions ? "border-red-200" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskNotes">Notes (optional)</Label>
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
                <Button 
                  onClick={handleAddTask} 
                  disabled={isSubmitting || !newTask.day || !newTask.title || !newTask.description || !newTask.deliverable || !newTask.instructions}
                >
                  {isSubmitting ? "Adding..." : "Add Task"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {challengeTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tasks added yet. Click "Add Task" to create your first task.</p>
            </div>
          ) : (
            challengeTasks.map((task) => (
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
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(task)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 bg-transparent">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Task</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{task.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTask(task.id)} className="bg-red-600">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-2">{task.description}</p>
                <div className="text-sm space-y-2">
                  <div className="p-2 bg-green-50 rounded">
                    <strong className="text-green-700">📦 Deliverable:</strong> <span className="text-gray-700">{task.deliverable}</span>
                  </div>
                  {task.instructions && (
                    <div className="p-2 bg-blue-50 rounded">
                      <strong className="text-blue-700">📋 Instructions:</strong> <span className="text-gray-700">{task.instructions}</span>
                    </div>
                  )}
                  {task.notes && (
                    <div className="p-2 bg-yellow-50 rounded">
                      <strong className="text-yellow-700">📝 Notes:</strong> <span className="text-gray-700">{task.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Edit Task Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the task details. Fields marked with * are required.</DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editTaskDay">Day <span className="text-red-500">*</span></Label>
                  <Input
                    id="editTaskDay"
                    type="number"
                    min={1}
                    value={editingTask.day}
                    onChange={(e) => setEditingTask((prev) => prev ? { ...prev, day: Number(e.target.value) } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editTaskPoints">Points</Label>
                  <Input
                    id="editTaskPoints"
                    type="number"
                    min={0}
                    value={editingTask.points}
                    onChange={(e) => setEditingTask((prev) => prev ? { ...prev, points: Number(e.target.value) } : null)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTaskTitle">Task Title <span className="text-red-500">*</span></Label>
                <Input
                  id="editTaskTitle"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask((prev) => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTaskDescription">Description <span className="text-red-500">*</span></Label>
                <Textarea
                  id="editTaskDescription"
                  rows={3}
                  value={editingTask.description}
                  onChange={(e) => setEditingTask((prev) => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTaskDeliverable">Deliverable <span className="text-red-500">*</span></Label>
                <Textarea
                  id="editTaskDeliverable"
                  rows={2}
                  value={editingTask.deliverable}
                  onChange={(e) => setEditingTask((prev) => prev ? { ...prev, deliverable: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTaskInstructions">Instructions <span className="text-red-500">*</span></Label>
                <Textarea
                  id="editTaskInstructions"
                  rows={4}
                  value={editingTask.instructions}
                  onChange={(e) => setEditingTask((prev) => prev ? { ...prev, instructions: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTaskNotes">Notes (optional)</Label>
                <Textarea
                  id="editTaskNotes"
                  rows={2}
                  value={editingTask.notes || ""}
                  onChange={(e) => setEditingTask((prev) => prev ? { ...prev, notes: e.target.value } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleEditTask} 
              disabled={isSubmitting || !editingTask?.day || !editingTask?.title || !editingTask?.description || !editingTask?.deliverable || !editingTask?.instructions}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EnhancedCard>
  )
}
