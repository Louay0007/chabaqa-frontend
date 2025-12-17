"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Users, Heart, Reply } from "lucide-react"

export default function ProductCommunity() {
  const sampleComments = [
    {
      id: 1,
      author: "John Doe",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "JD",
      comment: "This template saved me hours of work! The documentation was super clear.",
      timeAgo: "2 days ago",
      likes: 12
    },
    {
      id: 2,
      author: "Sarah Chen",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "SC",
      comment: "Amazing quality and great support from the creator. Highly recommended!",
      timeAgo: "5 days ago",
      likes: 8
    }
  ]

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <CardTitle className="text-base sm:text-lg">Community Support</CardTitle>
        </div>
        <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
          Get help and share feedback with other users
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-4 sm:space-y-6">
        {/* Comments Section */}
        <div className="space-y-3 sm:space-y-4">
          {sampleComments.map((comment) => (
            <div key={comment.id} className="flex gap-3 sm:gap-4">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 mt-1">
                <AvatarImage src={comment.avatar} />
                <AvatarFallback className="text-xs sm:text-sm">
                  {comment.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-2">
                {/* Comment Content */}
                <div className="bg-gray-50/80 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground">
                    {comment.comment}
                  </p>
                </div>
                
                {/* Comment Meta & Actions */}
                <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{comment.author}</span>
                    <span>•</span>
                    <span>{comment.timeAgo}</span>
                  </div>
                  <div className="flex items-center gap-3 xs:gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 text-xs hover:text-primary"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 text-xs hover:text-red-500 flex items-center gap-1"
                    >
                      <Heart className="h-3 w-3" />
                      <span>{comment.likes}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Community Stats */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 py-2 text-center">
          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold text-primary">24</div>
            <div className="text-xs text-muted-foreground">Comments</div>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold text-primary">156</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold text-primary">4.9</div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 sm:pt-4 border-t">
          <Button 
            variant="outline" 
            className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Join the Discussion
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Connect with other users, share tips, and get support from the community
          </p>
        </div>
      </CardContent>
    </Card>
  )
}