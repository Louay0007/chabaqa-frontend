import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, PlayCircle, Lock, MessageSquare, Star, StickyNote, ThumbsUp, Share2, Bookmark } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

interface CourseSidebarProps {
  course: any
  enrollment: any
  allChapters: any[]
  progress: number
  completedChaptersCount: number
  remainingChaptersCount: number
  selectedChapter: string | null
  setSelectedChapter: (chapterId: string) => void | Promise<void>
  isChapterAccessible: (chapterId: string) => boolean
}

export default function CourseSidebar({ 
  course, 
  enrollment, 
  allChapters, 
  progress, 
  completedChaptersCount,
  remainingChaptersCount,
  selectedChapter, 
  setSelectedChapter, 
  isChapterAccessible 
}: CourseSidebarProps) {
  const [activeTab, setActiveTab] = useState("content")
  const [noteContent, setNoteContent] = useState("")
  const [notes, setNotes] = useState<any[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const { toast } = useToast()

  const loadNotes = async () => {
    setLoadingNotes(true)
    try {
      const response = await api.courses.getNotes(course.id)
      setNotes(response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleSaveNote = async () => {
    if (!selectedChapter || !noteContent.trim()) return
    
    try {
      await api.courses.createNote(course.id, selectedChapter, noteContent)
      setNoteContent("")
      toast({ title: "Note saved!" })
      loadNotes()
    } catch (error) {
      toast({ 
        title: "Error saving note", 
        variant: "destructive" 
      })
    }
  }

  const handleSocialAction = async (action: 'like' | 'bookmark' | 'share') => {
    try {
      if (action === 'like') await api.courses.likeCourse(course.id)
      if (action === 'bookmark') await api.courses.bookmarkCourse(course.id)
      if (action === 'share') await api.courses.shareCourse(course.id)
      
      toast({ title: `Course ${action}d!` })
    } catch (error) {
      // Error handling
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 justify-center pb-2">
        <Button variant="outline" size="sm" onClick={() => handleSocialAction('like')}>
          <ThumbsUp className="h-4 w-4 mr-1" /> Like
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleSocialAction('bookmark')}>
          <Bookmark className="h-4 w-4 mr-1" /> Save
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleSocialAction('share')}>
          <Share2 className="h-4 w-4 mr-1" /> Share
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v)
        if (v === 'notes') loadNotes()
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="notes">My Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Chapter Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-courses-600">{Math.round(progress)}%</div>
                <div className="text-sm text-muted-foreground">Current chapter</div>
              </div>
              <Progress value={progress} className="mb-4" />
              <div className="text-sm text-muted-foreground text-center">
                {completedChaptersCount} completed • {remainingChaptersCount} remaining
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
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Take a Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Type your notes for this chapter here..." 
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
              />
              <Button onClick={handleSaveNote} disabled={!selectedChapter || !noteContent.trim()} className="w-full">
                Save Note
              </Button>
            </CardContent>
          </Card>

          <ScrollArea className="h-[400px] mt-4">
            <div className="space-y-3 pr-4">
              {notes.map((note) => (
                <Card key={note.id} className="bg-muted/50">
                  <CardContent className="p-3 text-sm space-y-2">
                    <p>{note.content}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 text-xs text-blue-500"
                        onClick={() => setSelectedChapter(note.chapterId)}
                      >
                        Jump to Chapter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {notes.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No notes yet. Start taking notes to track your learning!
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

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