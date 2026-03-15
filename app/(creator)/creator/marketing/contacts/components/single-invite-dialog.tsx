"use client"

import { useState, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { communityInvitationsApi } from "@/lib/api/community-invitations.api"

interface SingleInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  communityId: string
  onSuccess: () => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SingleInviteDialog({
  open,
  onOpenChange,
  communityId,
  onSuccess,
}: SingleInviteDialogProps) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [personalMessage, setPersonalMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [emailError, setEmailError] = useState("")

  const isValid = EMAIL_REGEX.test(email.trim())

  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      setEmailError("Please enter a valid email address")
      return
    }
    setSending(true)
    setEmailError("")
    try {
      await communityInvitationsApi.inviteSingle({
        email: email.trim().toLowerCase(),
        ...(name.trim() ? { name: name.trim() } : {}),
        communityId,
        ...(personalMessage.trim() ? { personalMessage: personalMessage.trim() } : {}),
      })
      toast({
        title: "Invitation sent!",
        description: `An invitation has been sent to ${email.trim()}`,
      })
      setEmail("")
      setName("")
      setPersonalMessage("")
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Failed to send invitation",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }, [email, name, personalMessage, communityId, isValid, toast, onOpenChange, onSuccess])

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setEmail("")
        setName("")
        setPersonalMessage("")
        setEmailError("")
      }
      onOpenChange(open)
    },
    [onOpenChange],
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Invite a Contact</DialogTitle>
          <DialogDescription>
            Send an invitation email to someone outside your community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="invite-email">
              Email address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="user@example.com"
              className="mt-1.5"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError("")
              }}
            />
            {emailError && (
              <p className="text-xs text-red-500 mt-1">{emailError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="invite-name">
              Name <span className="text-gray-400">(optional)</span>
            </Label>
            <Input
              id="invite-name"
              placeholder="John Doe"
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="invite-message">
              Personal message <span className="text-gray-400">(optional)</span>
            </Label>
            <Textarea
              id="invite-message"
              placeholder="Write a personal note..."
              className="mt-1.5 min-h-[80px]"
              maxLength={500}
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {personalMessage.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || sending}>
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Invitation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
