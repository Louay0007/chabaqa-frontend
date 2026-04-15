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
  Key,
  Plus,
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  Shield,
  Loader2,
  Clock,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { developerApi, type ApiKey, type CreatedApiKey } from "@/lib/api/developer.api"

const AVAILABLE_PERMISSIONS = [
  { value: "read:posts", label: "Read Posts" },
  { value: "write:posts", label: "Write Posts" },
  { value: "read:members", label: "Read Members" },
  { value: "read:analytics", label: "Read Analytics" },
  { value: "read:subscriptions", label: "Read Subscriptions" },
  { value: "read:courses", label: "Read Courses" },
]

function statusColor(status: string) {
  if (status === "active") return "bg-green-50 text-green-700 border-green-200"
  if (status === "expired") return "bg-yellow-50 text-yellow-700 border-yellow-200"
  return "bg-red-50 text-red-700 border-red-200"
}

function RelativeDate({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-muted-foreground text-xs">Never</span>
  const d = new Date(iso)
  return (
    <span className="text-xs text-muted-foreground">
      {d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
    </span>
  )
}

export default function ApiKeysPage() {
  const { selectedCommunityId } = useCreatorCommunity()
  const { toast } = useToast()

  const [keys, setKeys] = useState<ApiKey[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, revoked: 0, expired: 0 })
  const [loading, setLoading] = useState(true)

  // Create form state
  const [showCreate, setShowCreate] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([])
  const [newKeyExpiry, setNewKeyExpiry] = useState("")

  // One-time reveal state
  const [revealedKey, setRevealedKey] = useState<CreatedApiKey | null>(null)
  const [copied, setCopied] = useState(false)

  const loadKeys = useCallback(async () => {
    if (!selectedCommunityId) return
    setLoading(true)
    try {
      const res = await developerApi.listApiKeys(selectedCommunityId)
      setKeys(res.data)
      setStats(res.meta)
    } catch {
      toast({ title: "Failed to load API keys", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [selectedCommunityId, toast])

  useEffect(() => { loadKeys() }, [loadKeys])

  const handleCreate = async () => {
    if (!selectedCommunityId || !newKeyName.trim()) return
    setCreateLoading(true)
    try {
      const res = await developerApi.createApiKey(selectedCommunityId, {
        name: newKeyName.trim(),
        permissions: newKeyPermissions,
        expiresInDays: newKeyExpiry ? parseInt(newKeyExpiry, 10) : undefined,
      })
      setRevealedKey(res.data)
      setShowCreate(false)
      setNewKeyName("")
      setNewKeyPermissions([])
      setNewKeyExpiry("")
      await loadKeys()
    } catch {
      toast({ title: "Failed to create API key", variant: "destructive" })
    } finally {
      setCreateLoading(false)
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!selectedCommunityId) return
    try {
      await developerApi.revokeApiKey(selectedCommunityId, keyId)
      toast({ title: "API key revoked" })
      await loadKeys()
    } catch {
      toast({ title: "Failed to revoke API key", variant: "destructive" })
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast({ title: "Copied to clipboard" })
    setTimeout(() => setCopied(false), 2000)
  }

  const togglePermission = (perm: string) =>
    setNewKeyPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )

  if (!selectedCommunityId) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select a community to manage API keys
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
            <Key className="h-6 w-6" />
            API Keys
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys for external integrations and custom builds
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, icon: Key },
            { label: "Active", value: stats.active, icon: CheckCircle },
            { label: "Revoked", value: stats.revoked, icon: Trash2 },
            { label: "Expired", value: stats.expired, icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* One-time Key Reveal Dialog */}
      <Dialog open={!!revealedKey} onOpenChange={(open) => !open && setRevealedKey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              Save Your API Key — Shown Once Only
            </DialogTitle>
            <DialogDescription>
              Copy this key now. It cannot be retrieved after closing this dialog.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <p className="text-xs font-medium text-amber-800">API Key</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-white border rounded px-3 py-2 break-all select-all">
                  {revealedKey?.key}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => revealedKey && copyToClipboard(revealedKey.key)}
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Include in requests as: <code className="bg-muted px-1 rounded">X-API-Key: {revealedKey?.key?.slice(0, 20)}…</code></p>
              <p>• Rate limit: <strong>{revealedKey?.rateLimitPerHour?.toLocaleString()} requests/hour</strong></p>
              {revealedKey?.expiresAt && (
                <p>• Expires: <strong>{new Date(revealedKey.expiresAt).toLocaleDateString()}</strong></p>
              )}
            </div>
            <Button className="w-full" onClick={() => setRevealedKey(null)}>
              I&apos;ve saved my key
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Create New API Key</CardTitle>
            <CardDescription>API keys authenticate external requests to your community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="key-name">Key Name <span className="text-destructive">*</span></Label>
              <Input
                id="key-name"
                placeholder="e.g. Mobile App, Zapier Integration"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">A descriptive name to identify this key later</p>
            </div>

            <div className="space-y-2">
              <Label>Permissions (optional — leave empty for full access)</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <label
                    key={perm.value}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      newKeyPermissions.includes(perm.value)
                        ? "bg-primary/5 border-primary/40"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={newKeyPermissions.includes(perm.value)}
                      onChange={() => togglePermission(perm.value)}
                    />
                    <span className="text-sm">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="key-expiry">Expires In (days, optional)</Label>
              <Input
                id="key-expiry"
                type="number"
                placeholder="e.g. 365"
                min="1"
                max="3650"
                value={newKeyExpiry}
                onChange={(e) => setNewKeyExpiry(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createLoading || !newKeyName.trim()}>
                {createLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Key
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keys List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : keys.length === 0 && !showCreate ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium mb-1">No API keys yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first API key to start integrating external services
            </p>
            <Button variant="outline" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <Card key={key.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{key.name}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusColor(key.status)}`}
                        >
                          {key.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          {key.rateLimitPerHour.toLocaleString()} req/hr limit
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Created <RelativeDate iso={key.createdAt} />
                        </span>
                        {key.lastUsedAt && (
                          <span className="text-xs text-muted-foreground">
                            Last used <RelativeDate iso={key.lastUsedAt} />
                          </span>
                        )}
                      </div>
                      {key.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {key.permissions.map((p) => (
                            <Badge key={p} variant="secondary" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {key.status === "active" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will immediately invalidate <strong>{key.name}</strong>. Any integrations using this key will stop working.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevoke(key.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Revoke Key
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documentation hint */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-5">
          <h3 className="font-medium mb-2">Using API Keys</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Include your API key in every request via the <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">X-API-Key</code> header:</p>
            <pre className="bg-background border rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`curl https://api.chabaqa.com/api/communities/:id/posts \\
  -H "X-API-Key: chabaqa_your_key_here"`}
            </pre>
            <p>Rate limit: <strong>1,000 requests/hour</strong> per key. Exceeding the limit returns <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">401 Unauthorized</code>.</p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
