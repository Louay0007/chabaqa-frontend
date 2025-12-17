import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface BackButtonProps {
  slug: string
}

export default function BackButton({ slug }: BackButtonProps) {
  return (
    <div className="mb-6">
      <Button variant="ghost" asChild>
        <Link href={`/community/${slug}/challenges`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Challenges
        </Link>
      </Button>
    </div>
  )
}