"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface BatchConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  action: string
  selectedCount: number
  onConfirm: () => Promise<void>
}

interface BatchProgress {
  total: number
  processed: number
  succeeded: number
  failed: number
  errors: Array<{ id: string; error: string }>
}

export function BatchConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  action,
  selectedCount,
  onConfirm,
}: BatchConfirmDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<BatchProgress | null>(null)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!open) {
      setIsProcessing(false)
      setProgress(null)
      setCompleted(false)
    }
  }, [open])

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
      setCompleted(true)
    } catch {
      // error handled by caller
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={!isProcessing ? onOpenChange : undefined}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isProcessing && !progress && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {progress && (
            <div className="space-y-4">
              <Progress
                value={(progress.processed / progress.total) * 100}
                className="h-2"
              />
              <div className="flex justify-between text-sm">
                <span>
                  Progress: {progress.processed}/{progress.total}
                </span>
                <span>
                  {Math.round((progress.processed / progress.total) * 100)}%
                </span>
              </div>
              <div className="flex gap-2">
                <Badge variant="default">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {progress.succeeded} succeeded
                </Badge>
                {progress.failed > 0 && (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    {progress.failed} failed
                  </Badge>
                )}
              </div>
              {progress.errors.length > 0 && (
                <ScrollArea className="h-[100px] border rounded-md p-2">
                  {progress.errors.map((err, i) => (
                    <div key={i} className="text-sm text-destructive py-1">
                      • {err.error}
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
          )}

          {!isProcessing && !progress && !completed && (
            <div className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
              <span className="text-sm">
                This will affect{" "}
                <strong>{selectedCount}</strong> item
                {selectedCount !== 1 ? "s" : ""}. This action cannot be undone.
              </span>
            </div>
          )}

          {completed && !isProcessing && (
            <div className="flex items-center gap-3 py-4">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span className="text-sm font-medium">
                Operation completed successfully.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            {completed ? "Close" : "Cancel"}
          </Button>
          {!completed && (
            <Button
              variant={action === "delete" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                action.charAt(0).toUpperCase() + action.slice(1)
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
