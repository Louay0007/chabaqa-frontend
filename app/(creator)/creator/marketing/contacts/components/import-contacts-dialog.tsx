"use client"

import { useState, useMemo, useCallback } from "react"
import { Upload, Plus, X, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { communityInvitationsApi } from "@/lib/api/community-invitations.api"

interface ParsedContact {
  email: string
  name: string
  valid: boolean
}

interface ImportContactsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  communityId: string
  onSuccess: () => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseEmailLine(line: string): ParsedContact | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // Handle "Name <email>" format
  const angleMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/)
  if (angleMatch) {
    const name = angleMatch[1].trim().replace(/^["']|["']$/g, "")
    const email = angleMatch[2].trim().toLowerCase()
    return { email, name, valid: EMAIL_REGEX.test(email) }
  }

  // Handle "email, name" or "email; name" format
  const sepMatch = trimmed.match(/^([^\s,;]+)\s*[,;]\s*(.+)$/)
  if (sepMatch && EMAIL_REGEX.test(sepMatch[1].trim().toLowerCase())) {
    return {
      email: sepMatch[1].trim().toLowerCase(),
      name: sepMatch[2].trim(),
      valid: true,
    }
  }

  // Handle bare email
  const email = trimmed.toLowerCase()
  return { email, name: "", valid: EMAIL_REGEX.test(email) }
}

function parseCSV(text: string): ParsedContact[] {
  const lines = text.split(/\r?\n/)
  const results: ParsedContact[] = []

  for (const line of lines) {
    if (!line.trim()) continue
    // Skip header row
    if (/^email/i.test(line.trim())) continue

    const parts = line.split(/[,;\t]/)
    const email = (parts[0] || "").trim().toLowerCase()
    const name = (parts[1] || "").trim().replace(/^["']|["']$/g, "")

    if (email) {
      results.push({ email, name, valid: EMAIL_REGEX.test(email) })
    }
  }

  return results
}

export function ImportContactsDialog({
  open,
  onOpenChange,
  communityId,
  onSuccess,
}: ImportContactsDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<1 | 2>(1)
  const [rawText, setRawText] = useState("")
  const [contacts, setContacts] = useState<ParsedContact[]>([])
  const [personalMessage, setPersonalMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("paste")

  const parsedFromText = useMemo(() => {
    if (!rawText.trim()) return [] as ParsedContact[]
    return rawText
      .split(/\r?\n/)
      .map(parseEmailLine)
      .filter(Boolean) as ParsedContact[]
  }, [rawText])

  const validCount = useMemo(
    () => (step === 1 ? parsedFromText : contacts).filter((c) => c.valid).length,
    [step, parsedFromText, contacts],
  )
  const invalidCount = useMemo(
    () => (step === 1 ? parsedFromText : contacts).filter((c) => !c.valid).length,
    [step, parsedFromText, contacts],
  )
  const uniqueEmails = useMemo(() => {
    const list = step === 1 ? parsedFromText : contacts
    const seen = new Set<string>()
    let dupes = 0
    for (const c of list) {
      if (seen.has(c.email)) dupes++
      else seen.add(c.email)
    }
    return dupes
  }, [step, parsedFromText, contacts])

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        if (!text) return
        const parsed = parseCSV(text)
        setContacts(parsed)
        setStep(2)
      }
      reader.readAsText(file)
      e.target.value = ""
    },
    [],
  )

  const goToPreview = useCallback(() => {
    // Deduplicate and keep only valid
    const seen = new Set<string>()
    const deduplicated: ParsedContact[] = []
    for (const c of parsedFromText) {
      if (c.valid && !seen.has(c.email)) {
        seen.add(c.email)
        deduplicated.push(c)
      }
    }
    setContacts(deduplicated)
    setStep(2)
  }, [parsedFromText])

  const removeContact = useCallback((email: string) => {
    setContacts((prev) => prev.filter((c) => c.email !== email))
  }, [])

  const handleSend = useCallback(async () => {
    if (contacts.length === 0) return
    setSending(true)
    try {
      const result = await communityInvitationsApi.importContacts({
        contacts: contacts.map((c) => ({
          email: c.email,
          ...(c.name ? { name: c.name } : {}),
        })),
        communityId,
        ...(personalMessage.trim() ? { personalMessage: personalMessage.trim() } : {}),
      })
      toast({
        title: "Invitations sent!",
        description: `${result.created} invitation(s) sent. ${result.skipped > 0 ? `${result.skipped} skipped (already invited or member).` : ""}`,
      })
      // Reset
      setStep(1)
      setRawText("")
      setContacts([])
      setPersonalMessage("")
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Failed to send invitations",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }, [contacts, communityId, personalMessage, toast, onOpenChange, onSuccess])

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setStep(1)
        setRawText("")
        setContacts([])
        setPersonalMessage("")
      }
      onOpenChange(open)
    },
    [onOpenChange],
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Import Contacts" : "Preview & Send Invitations"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Add email addresses of people you'd like to invite to your community."
              : `You're about to invite ${contacts.length} contact(s) to your community.`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">Paste Emails</TabsTrigger>
                <TabsTrigger value="csv">Upload CSV</TabsTrigger>
              </TabsList>

              <TabsContent value="paste" className="space-y-3">
                <div>
                  <Label htmlFor="email-input">Email addresses</Label>
                  <Textarea
                    id="email-input"
                    placeholder={`Enter one email per line:\n\njohn@example.com\nJane Doe <jane@example.com>\nmark@company.com, Mark Smith`}
                    className="mt-1.5 min-h-[200px] font-mono text-sm"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                  />
                </div>
                {parsedFromText.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      ✓ {validCount} valid
                    </Badge>
                    {invalidCount > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        ⚠ {invalidCount} invalid
                      </Badge>
                    )}
                    {uniqueEmails > 0 && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        ↩ {uniqueEmails} duplicate(s)
                      </Badge>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="csv" className="space-y-3">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-purple-300 transition-colors">
                  <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload a CSV file with email addresses
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    First column: email, second column: name (optional)
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".csv,.txt,.tsv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div>
              <Label htmlFor="personal-message">
                Personal message <span className="text-gray-400">(optional)</span>
              </Label>
              <Textarea
                id="personal-message"
                placeholder="Write a personal note that will be included in the invitation email..."
                className="mt-1.5 min-h-[80px]"
                maxLength={500}
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
              />
              <p className="text-xs text-gray-400 text-right mt-1">
                {personalMessage.length}/500
              </p>
            </div>

            <div className="flex-1 overflow-hidden">
              <Label>Contacts ({contacts.length})</Label>
              <ScrollArea className="mt-1.5 h-[200px] border rounded-md">
                <div className="p-2 space-y-1">
                  {contacts.map((contact) => (
                    <div
                      key={contact.email}
                      className="flex items-center justify-between py-1.5 px-3 rounded hover:bg-gray-50 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{contact.email}</p>
                        {contact.name && (
                          <p className="text-xs text-gray-500 truncate">{contact.name}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeContact(contact.email)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No contacts to send
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} disabled={sending}>
              Back
            </Button>
          )}
          {step === 1 && (
            <Button onClick={goToPreview} disabled={validCount === 0}>
              Next
              <span className="ml-1 text-xs">({validCount})</span>
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleSend} disabled={contacts.length === 0 || sending}>
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Invitations
                  <span className="ml-1 text-xs">({contacts.length})</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
