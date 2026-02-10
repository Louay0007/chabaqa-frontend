import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, PlayCircle, Lock, MessageSquare, Star, StickyNote, ThumbsUp, Share2, Bookmark, ArrowRight, ShoppingCart, Trash2 } from "lucide-react"
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
  /** Live watch time for current chapter (from player) so % updates second-by-second */
  currentChapterProgress?: { watchTime: number; duration: number }
  /** ID used for storage keys (matches what player uses) */
  courseId?: string
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
  isChapterAccessible,
  currentChapterProgress,
  courseId,
}: CourseSidebarProps) {
  const [activeTab, setActiveTab] = useState("content")
  const [noteContent, setNoteContent] = useState("")
  const [notes, setNotes] = useState<any[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadNotes = async () => {
    setLoadingNotes(true)
    try {
      const response = await api.courses.getNotes(course.id)
      // Backend returns the array directly, but sometimes it might be wrapped.
      // We check if response is array or if response.data is array.
      if (Array.isArray(response)) {
        setNotes(response)
      } else if (response && Array.isArray(response.data)) {
        setNotes(response.data)
      } else {
        setNotes([])
      }
    } catch (error) {
      console.error(error)
      setNotes([])
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleSaveNote = async () => {
    // If no chapter selected, try to use the first one available
    const targetChapter = selectedChapter || (allChapters?.[0]?.id ?? null)
    
    if (!targetChapter || !noteContent.trim()) {
      toast({ 
        title: "Cannot save note", 
        description: "Please select a chapter and enter some text",
        variant: "destructive" 
      })
      return
    }
    
    try {
      await api.courses.createNote(course.id, targetChapter, noteContent)
      setNoteContent("")
      toast({ title: "Note saved!" })
      loadNotes()
    } catch (error) {
      console.error(error)
      toast({ 
        title: "Error saving note", 
        variant: "destructive" 
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!noteId) return
    setDeletingNoteId(noteId)
    try {
      await api.courses.deleteNote(course.id, noteId)
      toast({ title: "Note deleted!" })
      await loadNotes()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error deleting note",
        variant: "destructive",
      })
    } finally {
      setDeletingNoteId(null)
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

  const handleNextChapter = async (nextChapter: any) => {
    if (!nextChapter) return;

    if (nextChapter.isPaidChapter && !isChapterAccessible(nextChapter.id) && !nextChapter.isPreview) {
      // Initiate payment for the next chapter
      setPurchasing(true);
      try {
        // Use the dedicated endpoint for single chapter purchase
        // We assume `api.courses.buyChapter` exists or we call the payment endpoint directly
        // Since we don't have a direct SDK method yet, we'll use a direct fetch or a helper
        // For now, let's assume we add `buyChapter` to the api or use fetch
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/stripe-link/init/chapter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming token is in localStorage
          },
          body: JSON.stringify({
            courseId: course.id, // or courseId prop
            chapterId: nextChapter.id
          })
        });
        
        const data = await res.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error("Payment initialization failed");
        }
      } catch (error) {
        toast({ 
          title: "Error starting payment", 
          description: "Please try again later",
          variant: "destructive" 
        });
      } finally {
        setPurchasing(false);
      }
    } else {
      // Free or already unlocked
      void setSelectedChapter(nextChapter.id);
    }
  };

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
              {/* Current chapter inline progress (allChapters is flat list of chapters from CoursePlayer) */}
              {(() => {
                const currentId = selectedChapter || (allChapters?.[0]?.id ?? null)
                const currentChapter = Array.isArray(allChapters)
                  ? allChapters.find((c: any) => String(c.id) === String(currentId))
                  : null
                
                // --- HIGH WATER MARK LOGIC FOR SIDEBAR ---
                // We want the sidebar to always show the MAX progress reached, even if the player seeks back.
                
                // 1. Get backend progress
                const chapterProgress = enrollment?.progress?.find((p: any) => String(p.chapterId) === String(currentId))
                const backendWatchTime = Number(chapterProgress?.watchTime ?? 0)
                const isCompleted = chapterProgress?.isCompleted ?? false

                // 2. Get local storage progress (High-Water Mark)
                let maxStoredTime = backendWatchTime
                // Use the passed courseId if available (matches player), otherwise fallback to course.id
                const resolvedCourseId = courseId || course.id
                const storageKey = resolvedCourseId && currentId ? `course_progress_${resolvedCourseId}_${currentId}` : null
                
                if (typeof window !== 'undefined' && storageKey) {
                  const localData = localStorage.getItem(storageKey)
                  if (localData) {
                    try {
                      const parsed = JSON.parse(localData)
                      maxStoredTime = Math.max(maxStoredTime, parsed.time || 0)
                    } catch (e) {}
                  }
                }
                
                // 3. Get live player progress
                const liveWatchTime = currentChapterProgress?.watchTime ?? 0
                
                // 4. Calculate effective High-Water Mark to display
                const effectiveWatchTime = Math.max(maxStoredTime, liveWatchTime)
                
                const duration = currentChapterProgress?.duration ?? Number((chapterProgress && (chapterProgress as any).videoDuration) ?? currentChapter?.duration ?? 0)
                
                // Calculate percentage
                let currentPct = isCompleted 
                  ? 100 
                  : (duration > 0 ? Math.min((effectiveWatchTime / duration) * 100, 100) : 0)

                // AUTO-COMPLETE TRIGGER (Sidebar High-Water Mark)
                // If effective progress is sufficient, treat as completed for UI purposes immediately
                let effectiveIsCompleted = isCompleted
                if (!isCompleted && duration > 0 && effectiveWatchTime >= duration * 0.9) {
                   currentPct = 100;
                   effectiveIsCompleted = true; // Visually treat as completed
                }
                
                // Adjust counts based on local effective status
                // If backend says NOT completed but we locally say YES, increment completed count
                const adjustedCompletedCount = completedChaptersCount + (effectiveIsCompleted && !isCompleted ? 1 : 0)
                const adjustedRemainingCount = Math.max(0, remainingChaptersCount - (effectiveIsCompleted && !isCompleted ? 1 : 0))

                // NEXT CHAPTER LOGIC
                const currentIndex = allChapters.findIndex(c => String(c.id) === String(currentId));
                const nextChapter = currentIndex !== -1 && currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;
                const canGoNext = effectiveIsCompleted && nextChapter;

                return (
                  <div className="text-sm text-muted-foreground text-center">
                    <div className="mb-1">
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span>Progress</span>
                        <span className="font-medium">{Math.round(currentPct)}%</span>
                      </div>
                      <Progress value={currentPct} className="h-1.5 mb-2" />
                      {currentChapter?.title ? (
                         <span className="block truncate text-xs font-medium text-gray-700">{currentChapter.title}</span>
                      ) : ''}
                    </div>
                    <div className="text-xs mt-2 pt-2 border-t border-dashed">
                      {adjustedCompletedCount} completed • {adjustedRemainingCount} remaining
                    </div>

                    {/* NEXT CHAPTER BUTTON */}
                    {nextChapter && (
                      <div className="mt-4">
                        <Button 
                          className="w-full gap-2" 
                          disabled={!effectiveIsCompleted || purchasing}
                          variant={effectiveIsCompleted ? "default" : "secondary"}
                          onClick={() => handleNextChapter(nextChapter)}
                        >
                          {purchasing ? (
                            "Processing..."
                          ) : !effectiveIsCompleted ? (
                            <>
                              <Lock className="h-4 w-4" />
                              Complete to Unlock Next
                            </>
                          ) : nextChapter.isPaidChapter && !isChapterAccessible(nextChapter.id) && !nextChapter.isPreview ? (
                            <>
                              <ShoppingCart className="h-4 w-4" />
                              Buy Next Chapter
                            </>
                          ) : (
                            <>
                              Next Chapter
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                        {effectiveIsCompleted && nextChapter.isPaidChapter && !isChapterAccessible(nextChapter.id) && !nextChapter.isPreview && (
                           <p className="text-xs text-muted-foreground mt-1">
                             Premium content - Purchase required
                           </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
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
              <Button onClick={handleSaveNote} disabled={!noteContent.trim()} className="w-full">
                Save Note
              </Button>
            </CardContent>
          </Card>

          <ScrollArea className="h-[400px] mt-4">
            <div className="space-y-3 pr-4">
              {notes.map((note) => {
                const noteId = String(note?._id || note?.id || "")
                return (
                <Card key={noteId} className="bg-muted/50">
                  <CardContent className="p-3 text-sm space-y-2">
                    <p>{note.content}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-blue-500"
                          onClick={() => void setSelectedChapter(note.chapterId)}
                        >
                          Jump to Chapter
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-red-500"
                          disabled={!noteId || deletingNoteId === noteId}
                          onClick={() => handleDeleteNote(noteId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
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
