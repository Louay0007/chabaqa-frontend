import { notFound } from "next/navigation"
import EventsPageContent from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/events-page-content"
import { eventsCommunityApi } from "@/lib/api/events-community.api"

export default async function EventsPage({ 
  params 
}: { 
  params: Promise<{ feature: string }> 
}) {
  const { feature } = await params
  
  try {
    const data = await eventsCommunityApi.getEventsPageData(feature)
    
    if (!data.community) {
      notFound()
    }

  return (
    <EventsPageContent 
        availableEvents={data.events}
        myTickets={data.userRegistrations}
    />
    )
  } catch (error) {
    console.error('Error loading events page:', error)
    notFound()
  }
}