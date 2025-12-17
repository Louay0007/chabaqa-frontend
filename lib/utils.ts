import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PlayCircle, FileText, Code, ExternalLink, BookOpen } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function getResourceIcon(type: string) {
  switch (type) {
    case "video":
      return PlayCircle
    case "article":
      return FileText
    case "code":
      return Code
    case "tool":
      return ExternalLink
    default:
      return BookOpen
  }
}