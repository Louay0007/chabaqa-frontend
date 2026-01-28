import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Star } from "lucide-react"

interface SubmissionsTabProps {
  challengeTasks: any[]
}

export default function SubmissionsTab({ challengeTasks }: SubmissionsTabProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>My Submissions</CardTitle>
        <CardDescription>Review your completed projects and feedback</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {challengeTasks
            .filter((task) => task.isCompleted)
            .map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    Day {task.day}: {task.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{task.deliverable}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center text-sm">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                      Excellent work!
                    </div>
                    <div className="text-sm text-muted-foreground">Submitted 2 days ago</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-500">{task.points} pts</Badge>
                  <Button variant="outline" size="sm">
                    View Project
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}