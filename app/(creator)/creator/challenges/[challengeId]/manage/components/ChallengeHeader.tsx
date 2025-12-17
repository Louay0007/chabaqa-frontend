
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Eye, Share } from "lucide-react"
import Link from "next/link"
import { Challenge } from "@/lib/models"

export default function ChallengeHeader({
  challenge,
  isLoading,
  onSave,
}: {
  challenge: Challenge
  isLoading: boolean
  onSave: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/creator/challenges">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text-challenges">Manage Challenge</h1>
          <p className="text-muted-foreground mt-1">{challenge.title}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/challenges/${challenge.id}/landing`}>
            <Share className="h-4 w-4 mr-2" />
            Landing Page
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/challenges/${challenge.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Link>
        </Button>
        <Button size="sm" onClick={onSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}