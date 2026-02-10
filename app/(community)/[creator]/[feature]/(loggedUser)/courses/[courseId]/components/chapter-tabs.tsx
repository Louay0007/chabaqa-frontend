"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText as FileTextIcon, Download as DownloadIcon, Video, Code, Link as LinkIcon, FileType, Wrench, MessageSquare, Star, Sparkles } from "lucide-react"
import { CourseReviewsSection } from "@/components/reviews/course-reviews-section"
import AiTutorWidget from "./ai-tutor-widget"

interface ChapterTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  currentChapter: any
  currentChapterIndex: number
  allChapters: any[]
  canComplete?: boolean
  onCompleteChapter?: (chapterId: string) => void
  isCurrentChapterCompleted?: boolean
  nextChapterId?: string | null
  onGoToNextChapter?: () => void | Promise<void>
  courseId?: string
  onRefreshCourse?: () => Promise<void>
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <Video className="h-5 w-5 text-purple-500" />
    case 'article':
      return <FileTextIcon className="h-5 w-5 text-blue-500" />
    case 'code':
      return <Code className="h-5 w-5 text-green-500" />
    case 'outil':
    case 'tool':
      return <Wrench className="h-5 w-5 text-orange-500" />
    case 'pdf':
      return <FileType className="h-5 w-5 text-red-500" />
    case 'lien':
    case 'link':
      return <LinkIcon className="h-5 w-5 text-cyan-500" />
    default:
      return <FileTextIcon className="h-5 w-5 text-gray-500" />
  }
}

export default function ChapterTabs({ 
  activeTab, 
  setActiveTab, 
  currentChapter, 
  currentChapterIndex, 
  allChapters,
  canComplete,
  onCompleteChapter,
  isCurrentChapterCompleted,
  nextChapterId,
  onGoToNextChapter,
  courseId,
  onRefreshCourse,
}: ChapterTabsProps) {
  const chapterResources = currentChapter?.resources || []
  const chapterNotes = currentChapter?.notes || ''
  const chapterContent = currentChapter?.content || ''

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-5 md:grid-cols-6 lg:grid-cols-6 h-auto p-1">
        <TabsTrigger value="content" className="py-2 text-xs md:text-sm">Content</TabsTrigger>
        <TabsTrigger value="ai-tutor" className="py-2 text-xs md:text-sm gap-1"><Sparkles className="h-3 w-3 md:h-4 md:w-4 text-purple-500" /> AI</TabsTrigger>
        <TabsTrigger value="notes" className="py-2 text-xs md:text-sm">Notes</TabsTrigger>
        <TabsTrigger value="resources" className="py-2 text-xs md:text-sm">Resources</TabsTrigger>
        <TabsTrigger value="reviews" className="py-2 text-xs md:text-sm">Reviews</TabsTrigger>
        <TabsTrigger value="discussion" className="py-2 text-xs md:text-sm hidden md:inline-flex">Discussion</TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="mt-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{currentChapter?.title}</CardTitle>
            <CardDescription>
              Chapter {currentChapterIndex + 1} of {allChapters.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chapterContent ? (
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{chapterContent}</p>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No content description for this chapter.</p>
            )}

            <div className="flex flex-wrap gap-3 mt-6">
              {canComplete && currentChapter?.id && onCompleteChapter && !isCurrentChapterCompleted ? (
                <Button type="button" onClick={() => onCompleteChapter(String(currentChapter.id))}>
                  Mark as completed
                </Button>
              ) : null}

              {isCurrentChapterCompleted && nextChapterId && onGoToNextChapter ? (
                <Button type="button" onClick={() => void onGoToNextChapter()}>
                  Next Chapter
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ai-tutor" className="mt-6">
        {courseId && currentChapter?.id ? (
          <AiTutorWidget courseId={courseId!} chapterId={String(currentChapter.id)} />
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Please select a chapter to use the AI Tutor.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="notes" className="mt-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Instructor Notes</CardTitle>
            <CardDescription>Additional notes and tips from the instructor</CardDescription>
          </CardHeader>
          <CardContent>
            {chapterNotes ? (
              <div className="border rounded-lg p-4 bg-yellow-50">
                <p className="text-sm whitespace-pre-wrap">{chapterNotes}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileTextIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No instructor notes for this chapter</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="resources" className="mt-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Chapter Resources</CardTitle>
            <CardDescription>Downloadable materials and links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chapterResources.length > 0 ? (
              chapterResources.map((resource: any, index: number) => (
                <div key={resource.id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    {getResourceIcon(resource.type)}
                    <div>
                      <p className="font-medium">{resource.titre || resource.title}</p>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                      )}
                    </div>
                  </div>
                  {resource.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        {resource.type === 'link' || resource.type === 'lien' ? 'Open' : 'Download'}
                      </a>
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileTextIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No resources for this chapter</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reviews" className="mt-6">
        {courseId ? (
          <CourseReviewsSection courseId={courseId} showForm={true} onRefreshCourse={onRefreshCourse} />
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Reviews unavailable</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="discussion" className="mt-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Discussion</CardTitle>
            <CardDescription>Community discussion for this chapter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Discussion coming soon</p>
              <p className="text-sm mt-1">You'll be able to ask questions and interact with other students here.</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}