"use client"

import React from "react"
import { AlertCircle, Clock3 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"

export default function WhatsAppCampaignsPage() {
  const { selectedCommunity } = useCreatorCommunity()

  if (!selectedCommunity) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a community first.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp Campaigns</h1>
        <p className="text-gray-500">WhatsApp automation is being finalized.</p>
      </div>

      <Card className="p-8 flex items-start gap-4">
        <Clock3 className="w-6 h-6 text-chabaqa-primary mt-0.5" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">Coming Soon</h2>
            <Badge variant="secondary">Unavailable in this release</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Email campaigns are fully available now. WhatsApp channel support will be delivered in a dedicated phase.
          </p>
        </div>
      </Card>
    </div>
  )
}
