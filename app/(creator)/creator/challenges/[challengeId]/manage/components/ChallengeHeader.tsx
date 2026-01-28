
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Copy, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useState } from "react"

export default function ChallengeHeader({
  challenge,
  isLoading,
  onSave,
}: {
  challenge: any
  isLoading: boolean
  onSave: () => void
}) {
  const [copied, setCopied] = useState(false)

  // For now, we'll copy the manage page URL since we don't have the full public URL
  // The public URL requires both creator slug and community slug which we don't have
  const handleCopyLink = () => {
    const manageUrl = `${window.location.origin}/creator/challenges/${challenge.id}/manage`
    navigator.clipboard.writeText(manageUrl)
    setCopied(true)
    toast.success("Challenge manage link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

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
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        <Button size="sm" onClick={onSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}