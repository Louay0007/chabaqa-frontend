
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, Plus, Trash2, Lock, Unlock, PlayCircle, BookOpen } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { apiClient } from "@/lib/api/client"

interface CourseChapterForm {
  id: string
  title: string
  content: string
  videoUrl?: string
  duration?: number
  order: number
  isPreview: boolean
  notes?: string
}

interface CourseSectionForm {
  id: string
  title: string
  description?: string
  order: number
  chapters: CourseChapterForm[]
}

interface CourseContentStepProps {
  formData: {
    sections: CourseSectionForm[]
  }
  addSection: () => void
  updateSection: (sectionId: string, field: string, value: any) => void
  removeSection: (sectionId: string) => void
  addChapter: (sectionId: string) => void
  updateChapter: (sectionId: string, chapterId: string, field: string, value: any) => void
  removeChapter: (sectionId: string, chapterId: string) => void
}

export function CourseContentStep({
  formData,
  addSection,
  updateSection,
  removeSection,
  addChapter,
  updateChapter,
  removeChapter,
}: CourseContentStepProps) {
  const totalChapters = formData.sections.reduce((acc, section) => acc + section.chapters.length, 0)

  const [uploadingChapterIds, setUploadingChapterIds] = useState<Record<string, boolean>>({})

  const uploadVideoForChapter = async (sectionId: string, chapterId: string, file: File) => {
    setUploadingChapterIds((prev) => ({ ...prev, [chapterId]: true }))
    try {
      const result = await apiClient.uploadFile<{ url: string }>("/upload/video", file, "video")
      if (result?.url) {
        updateChapter(sectionId, chapterId, "videoUrl", result.url)
      }
    } finally {
      setUploadingChapterIds((prev) => ({ ...prev, [chapterId]: false }))
    }
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-courses-500" />
            Course Content
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {formData.sections.length} sections, {totalChapters} chapters
            </Badge>
            <Button onClick={addSection} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Organize your course into sections and chapters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {formData.sections.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sections added yet</h3>
            <p className="text-muted-foreground mb-6">Start building your course by adding your first section</p>
            <Button onClick={addSection}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Section
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {formData.sections.map((section, sectionIndex) => (
              <EnhancedCard key={section.id} className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">Section {sectionIndex + 1}</Badge>
                      <CardTitle className="text-lg">{section.title || `Section ${sectionIndex + 1}`}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {section.chapters.length} chapters
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSection(section.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Section Title *</Label>
                      <Input
                        placeholder="e.g., HTML Fundamentals"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Section Description</Label>
                      <Input
                        placeholder="Brief description of this section"
                        value={section.description}
                        onChange={(e) => updateSection(section.id, "description", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Chapters */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Chapters</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addChapter(section.id)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Chapter
                      </Button>
                    </div>

                    {section.chapters.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                        <PlayCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No chapters in this section</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => addChapter(section.id)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add First Chapter
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {section.chapters.map((chapter, chapterIndex) => (
                          <div
                            key={chapter.id}
                            className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {chapterIndex + 1}
                                </Badge>
                                <span className="font-medium">{chapter.title || `Chapter ${chapterIndex + 1}`}</span>
                                {chapter.isPreview ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    <Unlock className="h-3 w-3 mr-1" />
                                    Free Preview
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Paid
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeChapter(section.id, chapter.id)}
                                className="text-red-500 hover:text-red-700 h-8 w-8"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Chapter Title *</Label>
                                <Input
                                  placeholder="e.g., Introduction to HTML"
                                  value={chapter.title}
                                  onChange={(e) => updateChapter(section.id, chapter.id, "title", e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Chapter Video (Upload)</Label>
                                <Input
                                  type="file"
                                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                                  disabled={Boolean(uploadingChapterIds[chapter.id])}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    void uploadVideoForChapter(section.id, chapter.id, file)
                                  }}
                                  className="h-8 text-sm"
                                />
                                {chapter.videoUrl ? (
                                  <p className="text-xs text-muted-foreground mt-1 break-all">{chapter.videoUrl}</p>
                                ) : null}
                                {uploadingChapterIds[chapter.id] ? (
                                  <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
                                ) : null}
                              </div>
                            </div>

                            <div className="space-y-1 mb-3">
                              <Label className="text-xs">Chapter Content</Label>
                              <Textarea
                                placeholder="Describe what students will learn in this chapter..."
                                value={chapter.content}
                                onChange={(e) => updateChapter(section.id, chapter.id, "content", e.target.value)}
                                rows={2}
                                className="text-sm"
                              />
                            </div>

                            <div className="space-y-1 mb-3">
                              <Label className="text-xs">Instructor Notes (optional)</Label>
                              <Textarea
                                placeholder="Additional notes, tips, or instructions for students..."
                                value={chapter.notes || ""}
                                onChange={(e) => updateChapter(section.id, chapter.id, "notes", e.target.value)}
                                rows={2}
                                className="text-sm"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="space-y-1">
                                  <Label className="text-xs">Duration (minutes)</Label>
                                  <Input
                                    type="number"
                                    placeholder="15"
                                    value={chapter.duration || ""}
                                    onChange={(e) =>
                                      updateChapter(
                                        section.id,
                                        chapter.id,
                                        "duration",
                                        Number.parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className="h-8 w-20 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={chapter.isPreview}
                                  onCheckedChange={(checked) =>
                                    updateChapter(section.id, chapter.id, "isPreview", checked)
                                  }
                                />
                                <Label className="text-xs">Free Preview</Label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </EnhancedCard>
            ))}
          </div>
        )}
      </CardContent>
    </EnhancedCard>
  )
}