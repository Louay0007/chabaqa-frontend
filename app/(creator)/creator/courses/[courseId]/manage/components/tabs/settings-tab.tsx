"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function SettingsTab() {
  return (
    <div className="space-y-6">
      <EnhancedCard>
        <CardHeader>
          <CardTitle>Course Settings</CardTitle>
          <CardDescription>Advanced course configuration options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Allow Comments</h4>
              <p className="text-sm text-muted-foreground">Let students comment on chapters</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Download Resources</h4>
              <p className="text-sm text-muted-foreground">Allow students to download course resources</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Certificate of Completion</h4>
              <p className="text-sm text-muted-foreground">Issue certificates when students complete the course</p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Discussion Forum</h4>
              <p className="text-sm text-muted-foreground">Enable course-specific discussion forum</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for this course</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <h4 className="font-medium text-red-600">Delete Course</h4>
              <p className="text-sm text-muted-foreground">Permanently delete this course and all its content</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Course
            </Button>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}