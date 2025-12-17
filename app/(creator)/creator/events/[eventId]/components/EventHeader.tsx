"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, Save, Share } from "lucide-react"
import Link from "next/link"
import { Event } from "@/lib/models"
import { useState } from "react"

interface EventHeaderProps {
  event: Event
}

export default function EventHeader({ event }: EventHeaderProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/creator/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text-events">Manage Event</h1>
          <p className="text-muted-foreground mt-1">{event.title}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/events/${event.id}/landing`}>
            <Share className="h-4 w-4 mr-2" />
            Landing Page
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/events/${event.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Link>
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}