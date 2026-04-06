"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import type { AiAssistAction } from "@/lib/api/ai.api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sparkles, Wand2, Expand, Shrink, RefreshCw, FileText, Lightbulb, Loader2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface WanisAssistButtonProps {
  value: string
  onAccept: (newText: string) => void
  context?: string
  disabled?: boolean
  className?: string
}

const ACTIONS: {
  action: AiAssistAction
  label: string
  icon: React.ReactNode
  description: string
  requiresText: boolean
}[] = [
  {
    action: "improve",
    label: "Improve",
    icon: <Wand2 className="h-4 w-4" />,
    description: "Fix grammar & improve flow",
    requiresText: true,
  },
  {
    action: "expand",
    label: "Expand",
    icon: <Expand className="h-4 w-4" />,
    description: "Add more details & examples",
    requiresText: true,
  },
  {
    action: "shorten",
    label: "Shorten",
    icon: <Shrink className="h-4 w-4" />,
    description: "Make it more concise",
    requiresText: true,
  },
  {
    action: "rewrite",
    label: "Rewrite",
    icon: <RefreshCw className="h-4 w-4" />,
    description: "Rewrite with a fresh perspective",
    requiresText: true,
  },
  {
    action: "summarize",
    label: "Summarize",
    icon: <FileText className="h-4 w-4" />,
    description: "Create a brief summary",
    requiresText: true,
  },
  {
    action: "brainstorm",
    label: "Brainstorm",
    icon: <Lightbulb className="h-4 w-4" />,
    description: "Generate ideas & outlines",
    requiresText: false,
  },
]

export function WanisAssistButton({
  value,
  onAccept,
  context,
  disabled = false,
  className,
}: WanisAssistButtonProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const handleAction = async (action: AiAssistAction) => {
    const text = value.trim()

    const actionConfig = ACTIONS.find((a) => a.action === action)
    if (actionConfig?.requiresText && !text) {
      toast({
        title: "No content",
        description: "Please write some text first before using this action.",
        variant: "destructive",
      })
      return
    }

    if (!text) {
      toast({
        title: "No content",
        description: "Please write something first so Wanis can help you.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setActiveAction(action)
    setPreview(null)

    try {
      const response = await api.ai.assistContent({
        action,
        text,
        context,
      })

      setPreview(response.result)
    } catch (error: any) {
      console.error("Wanis assist error:", error)
      toast({
        title: "Wanis couldn't help right now",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
      setActiveAction(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = () => {
    if (preview) {
      onAccept(preview)
      toast({
        title: "Applied!",
        description: "Wanis's suggestion has been applied.",
      })
    }
    setPreview(null)
    setActiveAction(null)
  }

  const handleDiscard = () => {
    setPreview(null)
    setActiveAction(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Preview panel */}
      {preview && (
        <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
            <Sparkles className="h-4 w-4" />
            <span>Wanis suggests ({activeAction})</span>
          </div>
          <div className="text-sm text-gray-800 whitespace-pre-wrap max-h-48 overflow-y-auto bg-white rounded-md p-3 border">
            {preview}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAccept}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleAction(activeAction as AiAssistAction)}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isLoading && "animate-spin")} />
              Try Again
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDiscard}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isLoading}
            className={cn(
              "hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-colors",
              isLoading && "opacity-70"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wanis is thinking...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Ask Wanis ✨
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            Wanis AI Assistant
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ACTIONS.map((item) => (
            <DropdownMenuItem
              key={item.action}
              onClick={() => handleAction(item.action)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full">
                <span className="text-purple-600">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
