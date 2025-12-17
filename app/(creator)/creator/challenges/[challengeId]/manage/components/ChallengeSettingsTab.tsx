import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export default function ChallengeSettingsTab() {
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
            <Button variant="destructive" size="sm">
              Delete Challenge
            </Button>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}