"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText as FileTextIcon, Download as DownloadIcon } from "lucide-react"

interface ChapterTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  currentChapter: any
  currentChapterIndex: number
  allChapters: any[]
  canComplete?: boolean
  onCompleteChapter?: (chapterId: string) => void
}

export default function ChapterTabs({ 
  activeTab, 
  setActiveTab, 
  currentChapter, 
  currentChapterIndex, 
  allChapters,
  canComplete,
  onCompleteChapter,
}: ChapterTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
        <TabsTrigger value="discussion">Discussion</TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="mt-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{currentChapter?.title}</CardTitle>
            <CardDescription>
              Chapter {currentChapterIndex + 1} of {allChapters.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>{currentChapter?.content}</p>

            {canComplete && currentChapter?.id && onCompleteChapter ? (
              <div className="not-prose mt-6">
                <Button type="button" onClick={() => onCompleteChapter(String(currentChapter.id))}>
                  Mark as completed
                </Button>
              </div>
            ) : null}

            <h3>Key Learning Points</h3>
            <ul>
              <li>Understanding React component lifecycle</li>
              <li>Managing component state effectively</li>
              <li>Handling user interactions and events</li>
              <li>Best practices for component composition</li>
            </ul>

            <h3>Practice Exercise</h3>
            <p>
              Create a simple counter component that demonstrates the concepts covered in this chapter. The
              component should include increment, decrement, and reset functionality.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notes" className="mt-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Your Notes</CardTitle>
            <CardDescription>Take notes while learning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-yellow-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm">Remember to use useEffect for side effects</p>
                    <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm">Component composition is key for reusability</p>
                    <p className="text-xs text-muted-foreground mt-1">5 minutes ago</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="resources" className="mt-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Chapter Resources</CardTitle>
            <CardDescription>Additional materials for this chapter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileTextIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Chapter Slides</p>
                  <p className="text-sm text-muted-foreground">PDF • 2.3 MB</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileTextIcon className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Source Code</p>
                  <p className="text-sm text-muted-foreground">ZIP • 1.1 MB</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="discussion" className="mt-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Discussion</CardTitle>
            <CardDescription>Ask questions and share insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm">
                      Great explanation of React components! The examples really helped me understand the
                      concept.
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>John Doe • 2 hours ago</span>
                    <Button variant="ghost" size="sm" className="h-auto p-0">
                      Reply
                    </Button>
                    <Button variant="ghost" size="sm" className="h-auto p-0">
                      Like
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}