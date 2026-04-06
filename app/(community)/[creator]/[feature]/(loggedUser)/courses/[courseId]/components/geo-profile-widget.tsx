"use client"

import React, { useState, useEffect } from "react"
import { Trophy, Zap, Target, Star, BookOpen, Image as ImageIcon, Award, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { geoApi, GeoUserProfile, GeoAchievement, GeoDifficultyLevel } from "@/lib/api/geo.api"

interface GeoProfileWidgetProps {
  className?: string
}

const DIFFICULTY_CONFIG: Record<GeoDifficultyLevel, { label: string; emoji: string; color: string; badgeClass: string }> = {
  beginner:     { label: "Beginner",     emoji: "🌱", color: "text-emerald-600", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  intermediate: { label: "Intermediate", emoji: "🌿", color: "text-blue-600",    badgeClass: "bg-blue-100 text-blue-700 border-blue-200"          },
  advanced:     { label: "Advanced",     emoji: "🌳", color: "text-purple-600",  badgeClass: "bg-purple-100 text-purple-700 border-purple-200"    },
  expert:       { label: "Expert",       emoji: "🏆", color: "text-amber-600",   badgeClass: "bg-amber-100 text-amber-700 border-amber-200"       },
}

const STAT_THRESHOLDS = {
  questions: [10, 50, 100],
  quizzes: [5, 20, 50],
  streak: [7, 30, 100],
}

function getNextMilestone(value: number, thresholds: number[]): { next: number; progress: number } {
  const next = thresholds.find((t) => t > value) ?? thresholds[thresholds.length - 1]
  const prev = thresholds.filter((t) => t <= value).pop() ?? 0
  const progress = next === prev ? 100 : Math.min(((value - prev) / (next - prev)) * 100, 100)
  return { next, progress }
}

export default function GeoProfileWidget({ className }: GeoProfileWidgetProps) {
  const [profile, setProfile] = useState<GeoUserProfile | null>(null)
  const [achievements, setAchievements] = useState<GeoAchievement[]>([])
  const [showAllAchievements, setShowAllAchievements] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [profileRes, achievementsRes] = await Promise.allSettled([
          geoApi.getProfile(),
          geoApi.getAchievements(),
        ])
        if (cancelled) return
        if (profileRes.status === "fulfilled") setProfile(profileRes.value)
        if (achievementsRes.status === "fulfilled") setAchievements(achievementsRes.value)
      } catch {
        // silent
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (isLoading) {
    return (
      <Card className={`border shadow-sm ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) return null

  const unlockedSet = new Set(profile.unlockedAchievements)
  const unlockedAchievements = achievements.filter((a) => unlockedSet.has(a.identifier))
  const lockedAchievements = achievements.filter((a) => !unlockedSet.has(a.identifier))
  const displayedAchievements = showAllAchievements ? achievements : achievements.slice(0, 6)

  const diffCfg = DIFFICULTY_CONFIG[profile.preferredDifficultyLevel] ?? DIFFICULTY_CONFIG.intermediate
  const questionMilestone = getNextMilestone(profile.questionsAsked, STAT_THRESHOLDS.questions)
  const quizMilestone = getNextMilestone(profile.quizzesCompleted, STAT_THRESHOLDS.quizzes)
  const streakMilestone = getNextMilestone(profile.currentStreak, STAT_THRESHOLDS.streak)

  return (
    <Card className={`border shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-base">Geo Profile</h3>
            <p className="text-white/70 text-xs">Your learning journey</p>
          </div>
          <Badge className={`border text-xs font-semibold ${diffCfg.badgeClass}`}>
            {diffCfg.emoji} {diffCfg.label}
          </Badge>
        </div>

        {/* Points & Streak */}
        <div className="flex gap-3 mt-3">
          <div className="flex-1 bg-white/15 rounded-xl px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Trophy className="h-4 w-4 text-amber-300" />
              <span className="text-white font-black text-xl">{profile.totalPoints.toLocaleString()}</span>
            </div>
            <p className="text-white/70 text-[10px] font-medium">Total Points</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-xl px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-white font-black text-xl">{profile.currentStreak}</span>
            </div>
            <p className="text-white/70 text-[10px] font-medium">Day Streak</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-xl px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Star className="h-4 w-4 text-purple-300" />
              <span className="text-white font-black text-xl">{profile.bestStreak}</span>
            </div>
            <p className="text-white/70 text-[10px] font-medium">Best Streak</p>
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Stats with progress */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progress</h4>

          <div className="space-y-3">
            {/* Questions */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                  <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                  Questions Asked
                </div>
                <span className="text-muted-foreground">
                  <strong className="text-gray-900">{profile.questionsAsked}</strong>
                  {profile.questionsAsked < questionMilestone.next && ` / ${questionMilestone.next}`}
                </span>
              </div>
              <Progress value={questionMilestone.progress} className="h-1.5" />
            </div>

            {/* Quizzes */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                  <Target className="h-3.5 w-3.5 text-amber-500" />
                  Quizzes Completed
                </div>
                <span className="text-muted-foreground">
                  <strong className="text-gray-900">{profile.quizzesCompleted}</strong>
                  {profile.quizzesCompleted < quizMilestone.next && ` / ${quizMilestone.next}`}
                </span>
              </div>
              <Progress value={quizMilestone.progress} className="h-1.5" />
            </div>

            {/* Streak */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                  <Zap className="h-3.5 w-3.5 text-orange-500" />
                  Current Streak
                </div>
                <span className="text-muted-foreground">
                  <strong className="text-gray-900">{profile.currentStreak}d</strong>
                  {profile.currentStreak < streakMilestone.next && ` / ${streakMilestone.next}d`}
                </span>
              </div>
              <Progress value={streakMilestone.progress} className="h-1.5" />
            </div>

            {/* Images */}
            {profile.imagesShared > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                  <ImageIcon className="h-3.5 w-3.5 text-purple-500" />
                  Images Shared
                </div>
                <strong className="text-gray-900">{profile.imagesShared}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Achievements
              </h4>
              <span className="text-xs text-muted-foreground">
                {unlockedAchievements.length}/{achievements.length} unlocked
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {displayedAchievements.map((a) => {
                const isUnlocked = unlockedSet.has(a.identifier)
                return (
                  <div
                    key={a.identifier}
                    className={`rounded-xl border p-2.5 text-center transition-all ${
                      isUnlocked
                        ? "border-amber-200 bg-amber-50/80 shadow-sm"
                        : "border-gray-100 bg-gray-50/50 opacity-50 grayscale"
                    }`}
                    title={`${a.title}: ${a.description}`}
                  >
                    <div className="text-2xl mb-1">{a.icon}</div>
                    <p className={`text-[10px] font-semibold leading-tight ${isUnlocked ? "text-gray-800" : "text-gray-500"}`}>
                      {a.title}
                    </p>
                    {isUnlocked && a.points > 0 && (
                      <p className="text-[9px] text-amber-600 font-medium mt-0.5">+{a.points}pts</p>
                    )}
                  </div>
                )
              })}
            </div>

            {achievements.length > 6 && (
              <button
                onClick={() => setShowAllAchievements(!showAllAchievements)}
                className="w-full text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-1 py-1"
              >
                {showAllAchievements ? (
                  <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
                ) : (
                  <><ChevronDown className="h-3.5 w-3.5" /> Show all {achievements.length} achievements</>
                )}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
