"use client"

import { useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, X, Link as LinkIcon, FileText, Video, Code, Wrench } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

interface ChallengeTaskResource {
  id?: string
  title: string
  type: 'video' | 'article' | 'code' | 'tool'
  url: string
  description: string
}

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
  resources: ChallengeTaskResource[]
}

interface NewTaskState {
  day: string
  title: string
  description: string
  deliverable: string
  points: string
  instructions: string
  notes: string
  isActive: boolean
  resources: ChallengeTaskResource[]
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
    isActive: boolean
    resources: ChallengeTaskResource[]
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

  // Resource form state (for adding a resource to a task)
  const [newResource, setNewResource] = useState<ChallengeTaskResource>({
    title: '',
    type: 'article',
    url: '',
    description: ''
  })

  const [newTask, setNewTask] = useState<NewTaskState>({
    day: "",
    title: "",
    description: "",
    deliverable: "",
    points: "",
    instructions: "",
    notes: "",
    isActive: true,
    resources: []
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
      isActive: true,
      resources: []
    })
    setNewResource({ title: '', type: 'article', url: '', description: '' })
  }

  const handleAddResourceToNewTask = () => {
    if (!newResource.title || !newResource.url) return
    setNewTask(prev => ({
      ...prev,
      resources: [...prev.resources, { ...newResource }]
    }))
    setNewResource({ title: '', type: 'article', url: '', description: '' })
  }

  const handleRemoveResourceFromNewTask = (index: number) => {
    setNewTask(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }))
  }

  const handleAddResourceToEditingTask = () => {
    if (!editingTask || !newResource.title || !newResource.url) return
    setEditingTask(prev => prev ? ({
      ...prev,
      resources: [...(prev.resources || []), { ...newResource }]
    }) : null)
    setNewResource({ title: '', type: 'article', url: '', description: '' })
  }

  const handleRemoveResourceFromEditingTask = (index: number) => {
    if (!editingTask) return
    setEditingTask(prev => prev ? ({
      ...prev,
      resources: (prev.resources || []).filter((_, i) => i !== index)
    }) : null)
  }

  const handleAddTask = async () => {
    // Validate required fields
    if (!newTask.title || !newTask.day || !newTask.description || !newTask.deliverable || !newTask.instructions) {
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
        isActive: newTask.isActive,
        resources: newTask.resources
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
        isActive: editingTask.isActive,
        resources: editingTask.resources
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
    setEditingTask({ ...task, resources: task.resources || [] })
    setNewResource({ title: '', type: 'article', url: '', description: '' })
    setIsEditOpen(true)
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'code': return <Code className="h-4 w-4" />
      case 'tool': return <Wrench className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Tasks</CardTitle>
            <CardDescription>Manage the daily tasks for your challenge</CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            if (!open) resetNewTask()
            setIsAddOpen(open)
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogDescription>Create a new daily task. Fields marked with * are required.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taskDay">Day <span className="text-red-500">*</span></Label>
                    <Input
                      id="taskDay"
                      type="number"
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
                      min={0}
                      value={newTask.points}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, points: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={newTask.isActive}
                    onCheckedChange={(checked) => setNewTask((prev) => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Task Active</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskTitle">Task Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="taskTitle"
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
                    value={newTask.instructions}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, instructions: e.target.value }))}
                    className={!newTask.instructions ? "border-red-200" : ""}
                  />
                </div>

                {/* Resources Section */}
                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                  <Label>Resources (Optional)</Label>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
                      <div className="space-y-2">
                        <Label htmlFor="resTitle" className="text-xs">Title</Label>
                        <Input
                          id="resTitle"
                          placeholder="Resource title"
                          value={newResource.title}
                          onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resUrl" className="text-xs">URL</Label>
                        <Input
                          id="resUrl"
                          placeholder="https://..."
                          value={newResource.url}
                          onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resType" className="text-xs">Type</Label>
                        <Select
                          value={newResource.type}
                          onValueChange={(val: any) => setNewResource(prev => ({ ...prev, type: val }))}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="code">Code</SelectItem>
                            <SelectItem value="tool">Tool</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddResourceToNewTask}
                      disabled={!newResource.title || !newResource.url}
                    >
                      Add Resource
                    </Button>
                  </div>

                  {newTask.resources.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {newTask.resources.map((res, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-background p-2 rounded border">
                          <div className="flex items-center space-x-2">
                            {getResourceIcon(res.type)}
                            <a href={res.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px]">
                              {res.title}
                            </a>
                            <Badge variant="outline" className="text-[10px]">{res.type}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500"
                            onClick={() => handleRemoveResourceFromNewTask(idx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskNotes">Notes (optional)</Label>
                  <Textarea
                    id="taskNotes"
                    rows={2}
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
              <div key={task.id} className="border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">Day {task.day}</Badge>
                    <h3 className="font-semibold">{task.title}</h3>
                    <Badge variant="secondary">{task.points} pts</Badge>
                    {task.isActive ? (
                      <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(task)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 bg-transparent hover:bg-red-50">
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
                <p className="text-muted-foreground text-sm mb-3">{task.description}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="text-sm p-3 bg-muted/30 rounded-md">
                    <strong className="block mb-1 text-foreground">📦 Deliverable:</strong>
                    <span className="text-muted-foreground">{task.deliverable}</span>
                  </div>
                  {task.instructions && (
                    <div className="text-sm p-3 bg-muted/30 rounded-md">
                      <strong className="block mb-1 text-foreground">📋 Instructions:</strong>
                      <span className="text-muted-foreground truncate line-clamp-2">{task.instructions}</span>
                    </div>
                  )}
                </div>

                {task.resources && task.resources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {task.resources.map((res, i) => (
                      <a
                        key={i}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100 hover:bg-blue-100 transition-colors"
                      >
                        {getResourceIcon(res.type)}
                        <span>{res.title}</span>
                      </a>
                    ))}
                  </div>
                )}
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
            <DialogDescription>Update the task details.</DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-6 py-4">
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsActive"
                  checked={editingTask.isActive}
                  onCheckedChange={(checked) => setEditingTask((prev) => prev ? { ...prev, isActive: checked } : null)}
                />
                <Label htmlFor="editIsActive">Task Active</Label>
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

              {/* Edit Resources Section */}
              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <Label>Resources (Optional)</Label>
                <div className="grid gap-4">
                  <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="editResTitle" className="text-xs">Title</Label>
                      <Input
                        id="editResTitle"
                        placeholder="Resource title"
                        value={newResource.title}
                        onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editResUrl" className="text-xs">URL</Label>
                      <Input
                        id="editResUrl"
                        placeholder="https://..."
                        value={newResource.url}
                        onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editResType" className="text-xs">Type</Label>
                      <Select
                        value={newResource.type}
                        onValueChange={(val: any) => setNewResource(prev => ({ ...prev, type: val }))}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="code">Code</SelectItem>
                          <SelectItem value="tool">Tool</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddResourceToEditingTask}
                    disabled={!newResource.title || !newResource.url}
                  >
                    Add Resource
                  </Button>
                </div>

                {editingTask.resources && editingTask.resources.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {editingTask.resources.map((res, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-background p-2 rounded border">
                        <div className="flex items-center space-x-2">
                          {getResourceIcon(res.type)}
                          <a href={res.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px]">
                            {res.title}
                          </a>
                          <Badge variant="outline" className="text-[10px]">{res.type}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500"
                          onClick={() => handleRemoveResourceFromEditingTask(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
