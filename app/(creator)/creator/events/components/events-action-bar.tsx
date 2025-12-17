"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface EventsActionBarProps {
  activeTab: string
  totalUpcoming: number
  totalPast: number
}

export function EventsActionBar({
  activeTab,
  totalUpcoming,
  totalPast
}: EventsActionBarProps) {
  const router = useRouter()
  const [tab, setTab] = useState(activeTab)

  const handleCreateEvent = () => {
    router.push("/creator/events/new")
  }

  return (
    <div className="flex items-center justify-between">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({totalUpcoming})</TabsTrigger>
          <TabsTrigger value="past">Past ({totalPast})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts (0)</TabsTrigger>
        </TabsList>
      </Tabs>
      <Button onClick={handleCreateEvent}>
        <Plus className="h-4 w-4 mr-2" />
        Create Event
      </Button>
    </div>
  )
}