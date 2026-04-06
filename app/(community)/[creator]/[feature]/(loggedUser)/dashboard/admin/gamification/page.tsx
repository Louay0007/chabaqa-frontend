'use client'

import { useState, useEffect, use } from 'react'
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  DashboardLoading,
  DashboardUnauthorized,
} from '../../components'
import { CommunityPermission } from '@/lib/permissions'
import { gamificationApi } from '@/lib/api/gamification.api'
import type { CommunityGamificationConfig } from '@/lib/api/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Trophy,
  Save,
  RefreshCw,
  Settings,
  Zap,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

export default function GamificationAdminPage({
  params,
}: {
  params: Promise<{ creator: string; feature: string }>
}) {
  const { creator, feature } = use(params)
  const normalisedSlug = decodeURIComponent(feature).trim()

  const { community, isLoading: dashLoading, hasPermission } = useDashboard()

  const [config, setConfig] = useState<CommunityGamificationConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recomputing, setRecomputing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Local form state
  const [enabled, setEnabled] = useState(false)
  const [publicLeaderboard, setPublicLeaderboard] = useState(true)
  const [scoringWeights, setScoringWeights] = useState({
    postLikeReceived: 1,
    commentLikeReceived: 1,
    postCreated: 2,
    commentCreated: 1,
    courseCompleted: 50,
    challengeTaskApproved: 0,
    challengeCompleted: 10,
    dailyLoginStreak: 2,
    weeklyStreakBonus: 15,
  })
  const [dailyCaps, setDailyCaps] = useState({
    postCreated: 5,
    commentCreated: 20,
    postLikeReceived: 50,
    commentLikeReceived: 50,
  })
  const [levelThresholds, setLevelThresholds] = useState([
    { level: 1, name: 'Newcomer', minPoints: 0, icon: '🌱', color: '#94a3b8' },
    { level: 2, name: 'Contributor', minPoints: 50, icon: '⚡', color: '#60a5fa' },
    { level: 3, name: 'Active Member', minPoints: 150, icon: '🔥', color: '#f59e0b' },
    { level: 4, name: 'Rising Star', minPoints: 400, icon: '⭐', color: '#a855f7' },
    { level: 5, name: 'Community Leader', minPoints: 800, icon: '👑', color: '#ef4444' },
    { level: 6, name: 'Elite', minPoints: 1500, icon: '💎', color: '#06b6d4' },
    { level: 7, name: 'Legend', minPoints: 3000, icon: '🏆', color: '#eab308' },
  ])

  useEffect(() => {
    if (!normalisedSlug) return
    gamificationApi.getConfig(normalisedSlug)
      .then((cfg) => {
        setConfig(cfg)
        setEnabled(cfg.enabled)
        setPublicLeaderboard(cfg.publicLeaderboard)
        if (cfg.scoringWeights) setScoringWeights(cfg.scoringWeights)
        if (cfg.dailyCaps) setDailyCaps(cfg.dailyCaps)
        if (cfg.levelThresholds?.length) setLevelThresholds(cfg.levelThresholds as any)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [normalisedSlug])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    setMessage(null)
    try {
      await gamificationApi.updateConfig(config.communityId, {
        enabled,
        publicLeaderboard,
        scoringWeights,
        dailyCaps,
        levelThresholds,
      })
      setMessage({ type: 'success', text: 'Gamification settings saved successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleRecompute = async () => {
    if (!config) return
    setRecomputing(true)
    setMessage(null)
    try {
      const result = await gamificationApi.recompute(config.communityId)
      setMessage({ type: 'success', text: `Recomputed ${result.processed} member profiles.` })
    } catch (err) {
      setMessage({ type: 'error', text: 'Recompute failed. Please try again.' })
    } finally {
      setRecomputing(false)
    }
  }

  if (dashLoading || loading) {
    return <DashboardLoading />
  }

  if (!hasPermission?.(CommunityPermission.COMMUNITY_MANAGE_SETTINGS)) {
    return <DashboardUnauthorized />
  }

  const scoringLabels: Record<string, string> = {
    postLikeReceived: 'Post Like Received',
    commentLikeReceived: 'Comment Like Received',
    postCreated: 'Post Created',
    commentCreated: 'Comment Created',
    courseCompleted: 'Course Completed',
    challengeTaskApproved: 'Challenge Task Approved',
    challengeCompleted: 'Challenge Completed',
    dailyLoginStreak: 'Daily Login',
    weeklyStreakBonus: '7-Day Streak Bonus',
  }

  const capLabels: Record<string, string> = {
    postCreated: 'Posts per Day',
    commentCreated: 'Comments per Day',
    postLikeReceived: 'Likes Received per Day',
    commentLikeReceived: 'Comment Likes per Day',
  }

  return (
    <DashboardShell variant="admin">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Gamification Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure points, levels, and leaderboard for your community
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRecompute} disabled={recomputing}>
              {recomputing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Recompute All
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        {/* Enable/Disable + Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Enable Gamification</Label>
                <p className="text-sm text-muted-foreground">Turn on points, levels, and leaderboard</p>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Public Leaderboard</Label>
                <p className="text-sm text-muted-foreground">Allow all members to see the leaderboard</p>
              </div>
              <button
                onClick={() => setPublicLeaderboard(!publicLeaderboard)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${publicLeaderboard ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${publicLeaderboard ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Weights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Scoring Rules
            </CardTitle>
            <CardDescription>Points awarded for each action type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(scoringWeights).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <Label className="text-sm">{scoringLabels[key] || key}</Label>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => setScoringWeights({ ...scoringWeights, [key]: Number(e.target.value) })}
                    className="w-20 text-center"
                    min={0}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Caps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Anti-Spam Caps
            </CardTitle>
            <CardDescription>Maximum number of scored actions per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(dailyCaps).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <Label className="text-sm">{capLabels[key] || key}</Label>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => setDailyCaps({ ...dailyCaps, [key]: Number(e.target.value) })}
                    className="w-20 text-center"
                    min={1}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Level Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Level Thresholds
            </CardTitle>
            <CardDescription>Define the levels and point requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                <span>Level</span>
                <span>Name</span>
                <span>Min Points</span>
                <span>Icon</span>
                <span>Color</span>
              </div>
              {levelThresholds.map((lt, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                  <Input
                    type="number"
                    value={lt.level}
                    onChange={(e) => {
                      const updated = [...levelThresholds]
                      updated[idx] = { ...updated[idx], level: Number(e.target.value) }
                      setLevelThresholds(updated)
                    }}
                    className="text-center"
                    min={1}
                  />
                  <Input
                    value={lt.name}
                    onChange={(e) => {
                      const updated = [...levelThresholds]
                      updated[idx] = { ...updated[idx], name: e.target.value }
                      setLevelThresholds(updated)
                    }}
                  />
                  <Input
                    type="number"
                    value={lt.minPoints}
                    onChange={(e) => {
                      const updated = [...levelThresholds]
                      updated[idx] = { ...updated[idx], minPoints: Number(e.target.value) }
                      setLevelThresholds(updated)
                    }}
                    min={0}
                  />
                  <Input
                    value={lt.icon || ''}
                    onChange={(e) => {
                      const updated = [...levelThresholds]
                      updated[idx] = { ...updated[idx], icon: e.target.value }
                      setLevelThresholds(updated)
                    }}
                    className="text-center"
                  />
                  <Input
                    type="color"
                    value={lt.color || '#000000'}
                    onChange={(e) => {
                      const updated = [...levelThresholds]
                      updated[idx] = { ...updated[idx], color: e.target.value }
                      setLevelThresholds(updated)
                    }}
                    className="p-1 h-9"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLevelThresholds([...levelThresholds, {
                  level: levelThresholds.length + 1,
                  name: 'New Level',
                  minPoints: (levelThresholds[levelThresholds.length - 1]?.minPoints || 0) + 500,
                  icon: '⭐',
                  color: '#6366f1',
                }])}
              >
                + Add Level
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
