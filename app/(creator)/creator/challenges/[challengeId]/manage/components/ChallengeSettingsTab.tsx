"use client"

import { useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Props {
  challengeId: string
  onDeleteChallenge: () => Promise<void>
}

export default function ChallengeSettingsTab({ challengeId, onDeleteChallenge }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDeleteChallenge()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <EnhancedCard>
        <CardHeader>
          <CardTitle>Challenge Settings</CardTitle>
          <CardDescription>Advanced challenge configuration options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Allow Late Submissions</h4>
              <p className="text-sm text-muted-foreground">Accept submissions after the daily deadline</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Public Leaderboard</h4>
              <p className="text-sm text-muted-foreground">Show participant rankings publicly</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Peer Reviews</h4>
              <p className="text-sm text-muted-foreground">Enable participants to review each other's work</p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Daily Reminders</h4>
              <p className="text-sm text-muted-foreground">Send daily email reminders to participants</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Community Discussion</h4>
              <p className="text-sm text-muted-foreground">Enable challenge-specific discussion forum</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for this challenge</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <h4 className="font-medium text-red-600">End Challenge Early</h4>
              <p className="text-sm text-muted-foreground">Immediately end the challenge and process rewards</p>
            </div>
            <Button variant="destructive" size="sm">
              End Challenge
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <h4 className="font-medium text-red-600">Delete Challenge</h4>
              <p className="text-sm text-muted-foreground">Permanently delete this challenge and all its data</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete Challenge"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the challenge
                    and remove all associated data including participants, tasks, and resources.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Delete Challenge
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}
