'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
} from '@/components/ui/alert-dialog'
import {
  Shield,
  Download,
  Trash2,
  Smartphone,
  Laptop,
  LogOut,
  Cookie,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  MonitorSmartphone,
  KeyRound,
  FileDown,
  ChevronRight,
  Globe,
  MapPin,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { privacyApi, type ConsentRecord, type UserSession } from '@/lib/api/privacy.api'
import { COOKIE_OPEN_PREFERENCES_EVENT } from '@/components/cookie-consent-provider'
import Link from 'next/link'
import { apiClient } from '@/lib/api/client'

const CONSENT_LABELS: Record<string, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  marketing: 'Marketing Emails',
  analytics: 'Analytics Cookies',
  cookies: 'Cookie Preferences',
  ccpa_opt_out: 'CCPA Opt-Out',
  ccpa_do_not_sell: 'Do Not Sell My Personal Information',
  california_resident: 'California Resident Verification',
}

const DATA_REGIONS = [
  { code: 'us', name: 'United States', description: 'Default — lowest latency for Americas' },
  { code: 'eu', name: 'European Union', description: 'GDPR-compliant storage in EU' },
  { code: 'mea', name: 'Middle East & Africa', description: 'Optimal for MENA region users' },
  { code: 'apac', name: 'Asia Pacific', description: 'Optimal for Asian market users' },
]

function ConsentBadge({ granted }: { granted: boolean }) {
  return granted ? (
    <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 gap-1">
      <CheckCircle className="h-3 w-3" />
      Granted
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground gap-1">
      <XCircle className="h-3 w-3" />
      Revoked
    </Badge>
  )
}

function DeviceIcon({ deviceInfo }: { deviceInfo: string }) {
  if (/iOS|Android/i.test(deviceInfo)) return <Smartphone className="h-4 w-4 shrink-0" />
  if (/macOS|Windows|Linux/i.test(deviceInfo)) return <Laptop className="h-4 w-4 shrink-0" />
  return <MonitorSmartphone className="h-4 w-4 shrink-0" />
}

export default function PrivacySettingsPage() {
  const { toast } = useToast()

  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [consentsLoading, setConsentsLoading] = useState(true)
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'code-sent'>('idle')
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [twoFADisabling, setTwoFADisabling] = useState(false)

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeletePassword, setShowDeletePassword] = useState(false)

  // CCPA state
  const [ccpaOptOut, setCcpaOptOut] = useState(false)
  const [ccpaLoading, setCcpaLoading] = useState(false)

  // Data residency state
  const [selectedRegion, setSelectedRegion] = useState('us')
  const [regionLoading, setRegionLoading] = useState(false)
  const [regionSaving, setRegionSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const [c, s, ccpa, region] = await Promise.allSettled([
      privacyApi.getConsents(),
      privacyApi.getSessions(),
      apiClient.get('/user/me/consents').catch(() => ({ data: [] })),
      apiClient.get('/user/me/data-residency').catch(() => ({ data: { preferredRegion: 'us' } })),
    ])
    if (c.status === 'fulfilled') setConsents(c.value)
    if (s.status === 'fulfilled') setSessions(s.value)
    if (ccpa.status === 'fulfilled') {
      const records = (ccpa.value as any)?.data || []
      const doNotSell = records.find((r: any) => r.consentType === 'ccpa_do_not_sell' && !r.revokedAt)
      setCcpaOptOut(!!doNotSell?.granted)
    }
    if (region.status === 'fulfilled') {
      setSelectedRegion((region.value as any)?.data?.preferredRegion || 'us')
    }
    setConsentsLoading(false)
    setSessionsLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Cookie Preferences ──────────────────────────────────────
  const openCookiePreferences = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(COOKIE_OPEN_PREFERENCES_EVENT))
    }
  }

  // ── Data Export ─────────────────────────────────────────────
  const handleExport = async () => {
    setExportLoading(true)
    try {
      const data = await privacyApi.exportMyData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chabaqa-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: 'Data exported', description: 'Your data export has been downloaded.' })
    } catch {
      toast({
        title: 'Export failed',
        description: 'Please try again later. You can export up to 3 times per hour.',
        variant: 'destructive',
      })
    } finally {
      setExportLoading(false)
    }
  }

  // ── Sessions ────────────────────────────────────────────────
  const handleRevokeSession = async (sessionId: string) => {
    try {
      await privacyApi.revokeSession(sessionId)
      setSessions(prev => prev.filter(x => x.sessionId !== sessionId))
      toast({ title: 'Session revoked', description: 'That device has been signed out.' })
    } catch {
      toast({ title: 'Failed to revoke session', variant: 'destructive' })
    }
  }

  const handleRevokeAllOther = async () => {
    try {
      await privacyApi.revokeAllOtherSessions()
      await fetchData()
      toast({ title: 'All other sessions signed out' })
    } catch {
      toast({ title: 'Failed to sign out other sessions', variant: 'destructive' })
    }
  }

  // ── 2FA Setup ───────────────────────────────────────────────
  const handle2FASetupRequest = async () => {
    setTwoFALoading(true)
    try {
      await privacyApi.setup2FA()
      setTwoFADisabling(false)
      setTwoFAStep('code-sent')
      setTwoFACode('')
      toast({ title: '2FA code sent', description: 'Check your email for the 6-digit code.' })
    } catch (err: any) {
      toast({ title: err?.message || 'Failed to send code', variant: 'destructive' })
    } finally {
      setTwoFALoading(false)
    }
  }

  const handle2FADisableRequest = async () => {
    setTwoFALoading(true)
    try {
      await privacyApi.disable2FA()
      setTwoFADisabling(true)
      setTwoFAStep('code-sent')
      setTwoFACode('')
      toast({ title: 'Confirmation code sent', description: 'Check your email.' })
    } catch {
      toast({ title: 'Failed', variant: 'destructive' })
    } finally {
      setTwoFALoading(false)
    }
  }

  const handle2FAVerify = async () => {
    if (twoFACode.trim().length < 6) return
    setTwoFALoading(true)
    try {
      if (twoFADisabling) {
        await privacyApi.disable2FA(twoFACode.trim())
        setTwoFAEnabled(false)
        toast({ title: '2FA disabled' })
      } else {
        await privacyApi.verify2FASetup(twoFACode.trim())
        setTwoFAEnabled(true)
        toast({ title: '2FA enabled', description: 'Your account is now protected.' })
      }
      setTwoFAStep('idle')
      setTwoFACode('')
      setTwoFADisabling(false)
    } catch {
      toast({ title: 'Invalid code. Please try again.', variant: 'destructive' })
    } finally {
      setTwoFALoading(false)
    }
  }

  // ── CCPA ────────────────────────────────────────────────────
  const handleCcpaOptOut = async () => {
    setCcpaLoading(true)
    try {
      await apiClient.post('/user/me/consents', {
        consentType: 'ccpa_do_not_sell',
        granted: !ccpaOptOut,
      })
      setCcpaOptOut(prev => !prev)
      toast({
        title: ccpaOptOut ? 'Opt-out removed' : 'Opted out successfully',
        description: ccpaOptOut
          ? 'Your data may now be used as described in our Privacy Policy.'
          : 'We will not sell your personal information to third parties.',
      })
    } catch {
      toast({ title: 'Failed to update preference', variant: 'destructive' })
    } finally {
      setCcpaLoading(false)
    }
  }

  // ── Data Residency ──────────────────────────────────────────
  const handleSaveRegion = async () => {
    setRegionSaving(true)
    try {
      await apiClient.post('/user/me/data-residency', { region: selectedRegion })
      toast({
        title: 'Region preference saved',
        description: 'Data migration will begin shortly.',
      })
    } catch {
      toast({ title: 'Failed to save region preference', variant: 'destructive' })
    } finally {
      setRegionSaving(false)
    }
  }

  // ── Delete Account ──────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!deletePassword) return
    setDeleteLoading(true)
    try {
      await apiClient.delete('/user/me', { password: deletePassword } as any)
      toast({ title: 'Account deleted', description: 'Your account has been permanently deleted.' })
      setTimeout(() => { window.location.href = '/' }, 1500)
    } catch (err: any) {
      toast({
        title: 'Deletion failed',
        description: err?.message || 'Incorrect password or server error.',
        variant: 'destructive',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Page header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
            <ChevronRight className="h-3 w-3" />
            <span>Privacy & Security</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Privacy & Security
          </h1>
          <p className="text-muted-foreground">
            Manage your data, two-factor authentication, active sessions, and account deletion.
          </p>
        </div>

        {/* ── Cookie Preferences ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cookie className="h-5 w-5" />
              Cookie Preferences
            </CardTitle>
            <CardDescription>
              Control which cookies Chabaqa uses. Essential cookies are always active.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={openCookiePreferences}>
              Manage Cookie Settings
            </Button>
          </CardContent>
        </Card>

        {/* ── Consent History ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" />
              Consent History
            </CardTitle>
            <CardDescription>
              All consent decisions recorded for your account. Stored for up to 7 years per GDPR requirements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consentsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : consents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No consent records found.</p>
            ) : (
              <div className="divide-y">
                {consents.map(c => (
                  <div key={c._id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium">{CONSENT_LABELS[c.consentType] ?? c.consentType}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Version {c.version} &middot;{' '}
                        {new Date(c.grantedAt).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                        {c.revokedAt &&
                          ` · Revoked ${new Date(c.revokedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <ConsentBadge granted={c.granted && !c.revokedAt} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Two-Factor Authentication ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-5 w-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Require an email verification code in addition to your password on each login.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email 2FA</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {twoFAEnabled
                    ? 'Active — a code will be sent to your email at each sign-in.'
                    : 'Inactive — anyone with your password can sign in.'}
                </p>
              </div>
              <Badge variant={twoFAEnabled ? 'default' : 'secondary'}>
                {twoFAEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            {twoFAStep === 'idle' && (
              twoFAEnabled ? (
                <Button variant="outline" size="sm" onClick={handle2FADisableRequest} disabled={twoFALoading}>
                  {twoFALoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Disable 2FA
                </Button>
              ) : (
                <Button size="sm" onClick={handle2FASetupRequest} disabled={twoFALoading}>
                  {twoFALoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Enable 2FA
                </Button>
              )
            )}

            {twoFAStep === 'code-sent' && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <p className="text-sm">
                  {twoFADisabling
                    ? 'Enter the confirmation code sent to your email to disable 2FA:'
                    : 'Enter the 6-digit code sent to your email:'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    value={twoFACode}
                    onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-32 text-center font-mono text-lg tracking-[0.3em]"
                  />
                  <Button
                    size="sm"
                    onClick={handle2FAVerify}
                    disabled={twoFALoading || twoFACode.length < 6}
                  >
                    {twoFALoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setTwoFAStep('idle'); setTwoFACode(''); setTwoFADisabling(false) }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Active Sessions ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MonitorSmartphone className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Devices and browsers where your account is currently signed in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No active sessions found.</p>
            ) : (
              <>
                <div className="divide-y">
                  {sessions.map(s => (
                    <div key={s.sessionId} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <DeviceIcon deviceInfo={s.deviceInfo} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                            {s.deviceInfo || 'Unknown device'}
                            {s.isCurrent && (
                              <Badge variant="secondary" className="text-xs">Current</Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {s.ipAddress} &middot; Last active{' '}
                            {new Date(s.lastActiveAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {!s.isCurrent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive shrink-0"
                          onClick={() => handleRevokeSession(s.sessionId)}
                          title="Sign out this device"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {sessions.some(s => !s.isCurrent) && (
                  <Button variant="outline" size="sm" onClick={handleRevokeAllOther}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out all other devices
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Download My Data ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileDown className="h-5 w-5" />
              Download My Data
            </CardTitle>
            <CardDescription>
              Export a copy of all personal data Chabaqa holds about you — your right under GDPR Article 20.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The export includes your profile, posts, memberships, and consent history as a JSON file.
              Limited to 3 exports per hour.
            </p>
            <Button variant="outline" onClick={handleExport} disabled={exportLoading}>
              {exportLoading
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <Download className="h-4 w-4 mr-2" />}
              Export My Data
            </Button>
          </CardContent>
        </Card>

        {/* ── Data Residency ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5" />
              Data Residency
            </CardTitle>
            <CardDescription>
              Choose which region your personal data is stored in. Changing region triggers an async data migration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {DATA_REGIONS.map(r => (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => setSelectedRegion(r.code)}
                  className={`text-left p-3 rounded-lg border transition-all duration-150 ${
                    selectedRegion === r.code
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium">{r.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">{r.description}</p>
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={handleSaveRegion}
              disabled={regionSaving}
            >
              {regionSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Region Preference
            </Button>
          </CardContent>
        </Card>

        {/* ── California Privacy Rights (CCPA) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" />
              California Privacy Rights (CCPA)
            </CardTitle>
            <CardDescription>
              As a California resident, you have additional privacy rights under the California Consumer Privacy Act.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Do Not Sell My Personal Information */}
            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
              <div className="min-w-0 mr-4">
                <p className="text-sm font-medium">Do Not Sell My Personal Information</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Opt out of having your personal information sold to third parties
                </p>
              </div>
              <Button
                size="sm"
                variant={ccpaOptOut ? 'default' : 'outline'}
                onClick={handleCcpaOptOut}
                disabled={ccpaLoading}
                className="shrink-0"
              >
                {ccpaLoading
                  ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  : ccpaOptOut
                    ? <CheckCircle className="h-4 w-4 mr-1" />
                    : null}
                {ccpaOptOut ? 'Opted Out' : 'Opt Out'}
              </Button>
            </div>

            {/* California Resident Verification */}
            <div className="p-4 bg-muted/40 rounded-lg border">
              <p className="text-sm font-medium mb-1">Verify California Residency</p>
              <p className="text-xs text-muted-foreground mb-3">
                To exercise certain CCPA rights, we need to verify you are a California resident.
              </p>
              <Button variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Verify Residency
              </Button>
            </div>

            {/* Request Data */}
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Request My Data</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Download a copy of all personal information we hold about you
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={exportLoading}>
                {exportLoading
                  ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  : <Download className="h-4 w-4 mr-1" />}
                Request Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Delete Account ── */}
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently and irreversibly delete your account and all associated personal data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3 text-sm">
                      <p>The following will be <strong>permanently deleted</strong>:</p>
                      <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Your profile and login credentials</li>
                        <li>All community memberships and enrollments</li>
                        <li>Your messages and notifications</li>
                        <li>Consent records and session history</li>
                      </ul>
                      <p className="text-muted-foreground">
                        Posts you created will be anonymised and kept for community continuity.
                        Financial records may be retained for legal compliance.
                      </p>
                      <div className="pt-2">
                        <p className="font-medium mb-1.5">Enter your password to confirm:</p>
                        <div className="relative">
                          <Input
                            type={showDeletePassword ? 'text' : 'password'}
                            placeholder="Current password"
                            value={deletePassword}
                            onChange={e => setDeletePassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowDeletePassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showDeletePassword
                              ? <EyeOff className="h-4 w-4" />
                              : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => { setDeletePassword(''); setShowDeletePassword(false) }}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={!deletePassword || deleteLoading}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Delete permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Footer links */}
        <p className="text-xs text-muted-foreground text-center pb-4">
          <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>
          {' · '}
          <Link href="/terms-of-service" className="underline underline-offset-2 hover:text-foreground">Terms of Service</Link>
          {' · '}
          <Link href="/legal/dpa" className="underline underline-offset-2 hover:text-foreground">DPA</Link>
        </p>
      </main>
    </div>
  )
}
