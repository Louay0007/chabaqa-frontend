"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Plus, Edit, Trash2, PlayCircle, Lock, Unlock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { Course } from "@/lib/models"
import { apiClient } from "@/lib/api/client"

type ContentTabProps = {
  course: Course
  onAddSection: (payload: { titre: string; description?: string }) => Promise<void>
  onAddChapter: (sectionId: string, payload: any) => Promise<void>
  onDeleteSection: (sectionId: string) => Promise<void>
  onDeleteChapter: (sectionId: string, chapterId: string) => Promise<void>
  onUpdateSection: (sectionId: string, payload: { title: string; description: string }) => Promise<void>
  onUpdateChapter: (
    sectionId: string,
    chapterId: string,
    payload: {
      title: string
      content: string
      videoUrl: string
      duration: string
      isPreview: boolean
      price: string
      notes: string
    },
  ) => Promise<void>
}

export function ContentTab({
  course,
  onAddSection,
  onAddChapter,
  onDeleteSection,
  onDeleteChapter,
  onUpdateSection,
  onUpdateChapter,
}: ContentTabProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [newSection, setNewSection] = useState({
    title: "",
    description: "",
  })

  const [isEditSectionOpen, setIsEditSectionOpen] = useState(false)
  const [editSectionId, setEditSectionId] = useState<string | null>(null)
  const [editSectionTitle, setEditSectionTitle] = useState("")
  const [editSectionDescription, setEditSectionDescription] = useState("")

  const [isEditChapterOpen, setIsEditChapterOpen] = useState(false)
  const [editChapterSectionId, setEditChapterSectionId] = useState<string | null>(null)
  const [editChapterId, setEditChapterId] = useState<string | null>(null)
  const [editChapter, setEditChapter] = useState({
    title: "",
    content: "",
    videoUrl: "",
    duration: "",
    isPreview: false,
    price: "",
    notes: "",
  })

  const [newChapter, setNewChapter] = useState({
    title: "",
    content: "",
    videoUrl: "",
    duration: "",
    isPreview: false,
    price: "",
    notes: "",
  })

  const uploadChapterVideo = async (file: File): Promise<string | null> => {
    setIsUploading(true)
    try {
      const result = await apiClient.uploadFile<{ url: string }>("/upload/video", file, "video")
      return result?.url ?? null
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddSection = () => {
    void onAddSection({ titre: newSection.title, description: newSection.description })
    setNewSection({ title: "", description: "" })
  }

  const openEditSection = (section: any) => {
    setEditSectionId(String(section.id))
    setEditSectionTitle(String(section.title || ""))
    setEditSectionDescription(String(section.description || ""))
    setIsEditSectionOpen(true)
  }

  const saveEditSection = () => {
    if (!editSectionId) return
    void onUpdateSection(editSectionId, { title: editSectionTitle, description: editSectionDescription })
    setIsEditSectionOpen(false)
    setEditSectionId(null)
  }

  const openEditChapter = (sectionId: string, chapter: any) => {
    setEditChapterSectionId(sectionId)
    setEditChapterId(String(chapter.id))
    setEditChapter({
      title: String(chapter.title || ""),
      content: String(chapter.content || ""),
      videoUrl: String(chapter.videoUrl || ""),
      duration: String(chapter.duration || ""),
      isPreview: Boolean(chapter.isPreview),
      price: chapter.price ? String(chapter.price) : "",
      notes: String(chapter.notes || ""),
    })
    setIsEditChapterOpen(true)
  }

  const saveEditChapter = () => {
    if (!editChapterSectionId || !editChapterId) return
    void onUpdateChapter(editChapterSectionId, editChapterId, editChapter)
    setIsEditChapterOpen(false)
    setEditChapterSectionId(null)
    setEditChapterId(null)
  }

  const handleDeleteSection = (sectionId: string) => {
    const confirmed = window.confirm("Delete this section? This will also remove all its chapters.")
    if (!confirmed) return
    void onDeleteSection(sectionId)
  }

  const handleDeleteChapter = (sectionId: string, chapterId: string) => {
    const confirmed = window.confirm("Delete this chapter?")
    if (!confirmed) return
    void onDeleteChapter(sectionId, chapterId)
  }

  const handleAddChapter = (sectionId: string) => {
    void onAddChapter(sectionId, newChapter)
    setNewChapter({
      title: "",
      content: "",
      videoUrl: "",
      duration: "",
      isPreview: false,
      price: "",
      notes: "",
    })
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Course Content</CardTitle>
            <CardDescription>Manage your course sections and chapters</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Section</DialogTitle>
                <DialogDescription>Create a new section to organize your course content</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sectionTitle">Section Title</Label>
                  <Input
                    id="sectionTitle"
                    placeholder="e.g., HTML Fundamentals"
                    value={newSection.title}
                    onChange={(e) => setNewSection((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sectionDescription">Description</Label>
                  <Textarea
                    id="sectionDescription"
                    placeholder="Brief description of what this section covers"
                    value={newSection.description}
                    onChange={(e) => setNewSection((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddSection}>Add Section</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Dialog open={isEditSectionOpen} onOpenChange={setIsEditSectionOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Section</DialogTitle>
                <DialogDescription>Update section title and description</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={editSectionTitle} onChange={(e) => setEditSectionTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={editSectionDescription} onChange={(e) => setEditSectionDescription(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={saveEditSection}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditChapterOpen} onOpenChange={setIsEditChapterOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Chapter</DialogTitle>
                <DialogDescription>Update chapter details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Chapter Title</Label>
                    <Input value={editChapter.title} onChange={(e) => setEditChapter((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input type="number" value={editChapter.duration} onChange={(e) => setEditChapter((p) => ({ ...p, duration: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Chapter Video (Upload)</Label>
                  <Input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      void (async () => {
                        const url = await uploadChapterVideo(file)
                        if (url) {
                          setEditChapter((p) => ({ ...p, videoUrl: url }))
                        }
                      })()
                    }}
                  />
                  {editChapter.videoUrl ? (
                    <p className="text-xs text-muted-foreground break-all">{editChapter.videoUrl}</p>
                  ) : null}
                  {isUploading ? (
                    <p className="text-xs text-muted-foreground">Uploading...</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Chapter Content</Label>
                  <Textarea rows={4} value={editChapter.content} onChange={(e) => setEditChapter((p) => ({ ...p, content: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Chapter Notes</Label>
                  <Textarea rows={3} value={editChapter.notes} onChange={(e) => setEditChapter((p) => ({ ...p, notes: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch checked={editChapter.isPreview} onCheckedChange={(checked) => setEditChapter((p) => ({ ...p, isPreview: checked }))} />
                    <Label>Free Preview</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Chapter Price</Label>
                    <Input type="number" value={editChapter.price} onChange={(e) => setEditChapter((p) => ({ ...p, price: e.target.value }))} disabled={editChapter.isPreview} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={saveEditChapter}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {(course.sections || []).map((section, sectionIndex) => (
            <div key={section.id} className="border rounded-lg p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Section {sectionIndex + 1}: {section.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{section.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{section.chapters.length} chapters</Badge>
                  <Button variant="outline" size="sm" onClick={() => openEditSection(section)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 bg-transparent"
                    onClick={() => handleDeleteSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {section.chapters.map((chapter, chapterIndex) => (
                  <div key={chapter.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {chapter.isPreview ? (
                          <Unlock className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-orange-500" />
                        )}
                        <PlayCircle className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {chapterIndex + 1}. {chapter.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{chapter.duration} min</span>
                          {chapter.isPreview && (
                            <Badge variant="outline" className="text-xs">
                              Free Preview
                            </Badge>
                          )}
                          {chapter.price && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                              ${chapter.price}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditChapter(section.id, chapter)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDeleteChapter(section.id, chapter.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Chapter to {section.title}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Chapter</DialogTitle>
                      <DialogDescription>Add a new chapter to {section.title}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="chapterTitle">Chapter Title</Label>
                          <Input
                            id="chapterTitle"
                            placeholder="e.g., Introduction to HTML"
                            value={newChapter.title}
                            onChange={(e) => setNewChapter((prev) => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="chapterDuration">Duration (minutes)</Label>
                          <Input
                            id="chapterDuration"
                            type="number"
                            placeholder="15"
                            value={newChapter.duration}
                            onChange={(e) => setNewChapter((prev) => ({ ...prev, duration: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chapterVideo">Chapter Video (Upload)</Label>
                        <Input
                          id="chapterVideo"
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            void (async () => {
                              const url = await uploadChapterVideo(file)
                              if (url) {
                                setNewChapter((prev) => ({ ...prev, videoUrl: url }))
                              }
                            })()
                          }}
                        />
                        {newChapter.videoUrl ? (
                          <p className="text-xs text-muted-foreground break-all">{newChapter.videoUrl}</p>
                        ) : null}
                        {isUploading ? (
                          <p className="text-xs text-muted-foreground">Uploading...</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chapterContent">Chapter Content</Label>
                        <Textarea
                          id="chapterContent"
                          rows={4}
                          placeholder="Describe what students will learn in this chapter..."
                          value={newChapter.content}
                          onChange={(e) => setNewChapter((prev) => ({ ...prev, content: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chapterNotes">Chapter Notes</Label>
                        <Textarea
                          id="chapterNotes"
                          rows={3}
                          placeholder="Additional notes or instructions for this chapter..."
                          value={newChapter.notes}
                          onChange={(e) => setNewChapter((prev) => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="chapterPreview"
                            checked={newChapter.isPreview}
                            onCheckedChange={(checked) =>
                              setNewChapter((prev) => ({ ...prev, isPreview: checked }))
                            }
                          />
                          <Label htmlFor="chapterPreview">Free Preview</Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="chapterPrice">Individual Price (optional)</Label>
                          <Input
                            id="chapterPrice"
                            type="number"
                            placeholder="9.99"
                            value={newChapter.price}
                            onChange={(e) => setNewChapter((prev) => ({ ...prev, price: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => handleAddChapter(section.id)}>Add Chapter</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}