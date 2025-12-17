"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, PlayCircle, Lock, MessageSquare, Star } from "lucide-react"

interface CourseSidebarProps {
  course: any
  enrollment: any
  allChapters: any[]
  progress: number
  selectedChapter: string | null
  setSelectedChapter: (chapterId: string) => void | Promise<void>
  isChapterAccessible: (chapterId: string) => boolean
}

export default function CourseSidebar({ 
  course, 
  enrollment, 
  allChapters, 
  progress, 
  selectedChapter, 
  setSelectedChapter, 
  isChapterAccessible 
}: CourseSidebarProps) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Course Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-courses-600">{Math.round(progress)}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
          <Progress value={progress} className="mb-4" />
          <div className="text-sm text-muted-foreground text-center">
            {enrollment?.progress.filter((p: any) => p.isCompleted).length || 0} of {allChapters.length} chapters
            completed
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Course Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {course.sections.map((section: any) => (
            <div key={section.id} className="space-y-2">
              <h4 className="font-medium text-sm">{section.title}</h4>
              <div className="space-y-1 ml-2">
                {section.chapters.map((chapter: any) => {
                  const isCompleted = enrollment?.progress.find((p: any) => p.chapterId === chapter.id)?.isCompleted
                  const isActive = selectedChapter === chapter.id
                  const accessible = isChapterAccessible(chapter.id)

                  return (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        if (!accessible) return
                        void setSelectedChapter(chapter.id)
                      }}
                      className={`w-full flex items-center space-x-2 p-2 rounded text-left text-sm transition-colors ${
                        isActive
                          ? "bg-courses-100 text-courses-700"
                          : accessible
                            ? "hover:bg-gray-50"
                            : "cursor-not-allowed opacity-70"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : accessible ? (
                        <PlayCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="flex-1 truncate">{chapter.title}</span>
                      {chapter.duration && (
                        <span className="text-xs text-muted-foreground">
                          {Math.floor(chapter.duration / 60)}m
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Instructor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={course.creator.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {course.creator.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{course.creator.name}</p>
              <p className="text-sm text-muted-foreground">Web Development Expert</p>
              <div className="flex items-center mt-1">
                <Star className="h-3 w-3 text-yellow-500 mr-1" />
                <span className="text-xs">4.9 instructor rating</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Instructor
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}