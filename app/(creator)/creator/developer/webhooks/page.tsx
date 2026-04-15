"use client"

import { useState, useEffect, useCallback } from "react"
import { PageShell } from "@/components/creator-dashboard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Webhook,
  Plus,
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { developerApi, type WebhookConfig, type CreatedWebhook, type WebhookEventOption } from "@/lib/api/developer.api"

function RelativeDate({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-muted-foreground text-xs">Never</span>
  const d = new Date(iso)
  return (
    <span className="text-xs text-muted-foreground">
      {d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
    </span>
  )
}

export default function WebhooksPage() {
  const { selectedCommunityId } = useCreatorCommunity()
  const { toast } = useToast()

  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [eventOptions, setEventOptions] = useState<WebhookEventOption[]>([])
  const [loading, setLoading] = useState(true)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [formName, setFormName] = useState("")
  const [formUrl, setFormUrl] = useState("")
  const [formEvents, setFormEvents] = useState<string[]>([])

  // One-time secret reveal
  const [revealedWebhook, setRevealedWebhook] = useState<CreatedWebhook | null>(null)
  const [copied, setCopied] = useState(false)

  const loadData = useCallback(async () => {
    if (!selectedCommunityId) return
    setLoading(true)
    try {
      const [wh, ev] = await Promise.all([
        developerApi.listWebhooks(selectedCommunityId),
        developerApi.listWebhookEvents(selectedCommunityId),
      ])
      setWebhooks(wh)
      setEventOptions(ev)
    } catch {
      toast({ title: "Failed to load webhooks", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [selectedCommunityId, toast])

  useEffect(() => { loadData() }, [loadData])

  const handleCreate = async () => {
    if (!selectedCommunityId || !formName.trim() || !formUrl.trim() || !formEvents.length) return
    setCreateLoading(true)
    try {
      const res = await developerApi.createWebhook(selectedCommunityId, {
        name: formName.trim(),
        url: formUrl.trim(),
        events: formEvents,
      })
      setRevealedWebhook(res.data)
      setShowCreate(false)
      setFormName("")
      setFormUrl("")
      setFormEvents([])
      await loadData()
    } catch {
      toast({ title: "Failed to create webhook", variant: "destructive" })
    } finally {
      setCreateLoading(false)
    }
  }

  const handleToggleActive = async (webhook: WebhookConfig) => {
    if (!selectedCommunityId) return
    try {
      await developerApi.updateWebhook(selectedCommunityId, webhook.id, {
        isActive: !webhook.isActive,
      })
      setWebhooks((prev) =>
        prev.map((w) => (w.id === webhook.id ? { ...w, isActive: !w.isActive } : w))
      )
      toast({
        title: webhook.isActive ? "Webhook paused" : "Webhook resumed",
      })
    } catch {
      toast({ title: "Failed to update webhook", variant: "destructive" })
    }
  }

  const handleDelete = async (webhookId: string) => {
    if (!selectedCommunityId) return
    try {
      await developerApi.deleteWebhook(selectedCommunityId, webhookId)
      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId))
      toast({ title: "Webhook deleted" })
    } catch {
      toast({ title: "Failed to delete webhook", variant: "destructive" })
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast({ title: "Copied to clipboard" })
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleEvent = (ev: string) =>
    setFormEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    )

  if (!selectedCommunityId) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select a community to manage webhooks
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Webhooks
          </h1>
          <p className="text-muted-foreground mt-1">
            Receive real-time event notifications via HTTP POST to your endpoints
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* One-time Secret Reveal */}
      <Dialog open={!!revealedWebhook} onOpenChange={(open) => !open && setRevealedWebhook(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              Save Your Webhook Secret — Shown Once Only
            </DialogTitle>
            <DialogDescription>
              Use this secret to verify that incoming webhook calls are from Chabaqa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <p className="text-xs font-medium text-amber-800">Signing Secret</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-white border rounded px-3 py-2 break-all select-all">
                  {revealedWebhook?.secret}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => revealedWebhook && copyToClipboard(revealedWebhook.secret)}
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-foreground mb-1">Verify webhook signatures:</p>
              <pre className="overflow-x-auto font-mono text-xs">
{`const signature = req.headers['x-chabaqa-signature'];
const expected = 'sha256=' + crypto
  .createHmac('sha256', SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');
const isValid = crypto.timingSafeEqual(
  Buffer.from(expected),
  Buffer.from(signature)
);`}
              </pre>
            </div>
            <Button className="w-full" onClick={() => setRevealedWebhook(null)}>
              I&apos;ve saved the secret
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Create New Webhook</CardTitle>
            <CardDescription>
              Chabaqa will send a signed POST request to your URL on each selected event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="wh-name">Name <span className="text-destructive">*</span></Label>
                <Input
                  id="wh-name"
                  placeholder="e.g. Slack Notifier"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wh-url">Endpoint URL <span className="text-destructive">*</span></Label>
                <Input
                  id="wh-url"
                  type="url"
                  placeholder="https://your-server.com/hooks/chabaqa"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Events <span className="text-destructive">*</span>{" "}
                <span className="font-normal text-muted-foreground">({formEvents.length} selected)</span>
              </Label>
              {eventOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading events…</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {eventOptions.map((ev) => (
                    <label
                      key={ev.value}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                        formEvents.includes(ev.value)
                          ? "bg-primary/5 border-primary/40"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={formEvents.includes(ev.value)}
                        onChange={() => toggleEvent(ev.value)}
                      />
                      <span>{ev.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {eventOptions.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormEvents(eventOptions.map((e) => e.value))}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormEvents([])}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={createLoading || !formName.trim() || !formUrl.trim() || !formEvents.length}
              >
                {createLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Webhook
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhooks List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : webhooks.length === 0 && !showCreate ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Webhook className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium mb-1">No webhooks configured</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add a webhook to get real-time notifications when events happen
            </p>
            <Button variant="outline" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className={webhook.isActive ? "" : "opacity-60"}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium">{webhook.name}</p>
                      {webhook.isActive ? (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 gap-1">
                          Paused
                        </Badge>
                      )}
                      {webhook.failuresCount > 0 && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {webhook.failuresCount} failure{webhook.failuresCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground font-mono mb-2 truncate">
                      {webhook.url}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {webhook.events.slice(0, 4).map((ev) => (
                        <Badge key={ev} variant="secondary" className="text-xs">
                          {ev}
                        </Badge>
                      ))}
                      {webhook.events.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{webhook.events.length - 4} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Created <RelativeDate iso={webhook.createdAt} />
                      </span>
                      {webhook.lastTriggeredAt && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <RefreshCw className="h-3 w-3" />
                          Last triggered <RelativeDate iso={webhook.lastTriggeredAt} />
                        </span>
                      )}
                    </div>

                    {webhook.lastFailureReason && (
                      <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded px-2 py-1 border border-red-100">
                        Last error: {webhook.lastFailureReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Toggle active/paused */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(webhook)}
                      title={webhook.isActive ? "Pause webhook" : "Resume webhook"}
                    >
                      {webhook.isActive ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
                          <AlertDialogDescription>
                            <strong>{webhook.name}</strong> will be permanently deleted and will stop receiving events.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(webhook.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payload format */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-5">
          <h3 className="font-medium mb-2">Webhook Payload Format</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Every delivery sends a JSON body and three headers:</p>
            <pre className="bg-background border rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`// Request headers
X-Chabaqa-Event: post.created
X-Chabaqa-Signature: sha256=<hmac>
X-Chabaqa-Timestamp: 2026-04-15T12:00:00.000Z

// Request body
{
  "event": "post.created",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "data": { ... }
}`}
            </pre>
            <p>Webhooks are disabled after <strong>5 consecutive failures</strong>.</p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
