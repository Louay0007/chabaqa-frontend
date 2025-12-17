"use client"

import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { Community, AchievementWithProgress } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import {
  Trophy,
  Medal,
  Award,
  Star,
  CheckCircle2,
  Lock,
  Target,
  Crown,
  RefreshCw,
  TrendingUp,
  Sparkles,
  Zap,
  Grid3x3,
  List,
} from "lucide-react"

const RARITY_CONFIG = {
  common: { 
    label: "Common", 
    color: "bg-slate-100 text-slate-700 border-slate-200", 
    icon: Trophy,
    gradient: "from-slate-400 to-slate-600",
  },
  rare: { 
    label: "Rare", 
    color: "bg-blue-100 text-blue-700 border-blue-200", 
    icon: Medal,
    gradient: "from-blue-400 to-blue-600",
  },
  epic: { 
    label: "Epic", 
    color: "bg-purple-100 text-purple-700 border-purple-200", 
    icon: Award,
    gradient: "from-purple-400 to-purple-600",
  },
  legendary: { 
    label: "Legendary", 
    color: "bg-amber-100 text-amber-700 border-amber-200", 
    icon: Crown,
    gradient: "from-amber-400 to-amber-600",
  },
}

interface AchievementsPageContentProps {
  slug: string
  community: Community
  achievements: AchievementWithProgress[]
  onRefresh: () => void
}

export default function AchievementsPageContent({
  slug,
  community,
  achievements,
  onRefresh,
}: AchievementsPageContentProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const safeAchievements = Array.isArray(achievements) ? achievements : []

  const stats = useMemo(() => {
    const unlocked = safeAchievements.filter(a => a.isUnlocked).length
    const total = safeAchievements.length
    const inProgress = safeAchievements.filter(a => !a.isUnlocked && a.progress && a.progress > 0).length
    const locked = total - unlocked - inProgress
    const completionRate = total > 0 ? Math.round((unlocked / total) * 100) : 0

    return { total, unlocked, inProgress, locked, completionRate }
  }, [safeAchievements])

  const unlockedAchievements = safeAchievements.filter(a => a.isUnlocked)
  const lockedAchievements = safeAchievements.filter(a => !a.isUnlocked)

  const handleRefresh = async () => {
    try {
      await onRefresh()
      toast({
        title: "✨ Achievements updated",
        description: "Latest achievement progress has been loaded.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "We couldn't refresh your achievements. Please try again.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section - Compact like Events */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
            {/* Background circles */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

            {/* Title */}
            <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3">
              <div className="flex items-center space-x-2">
                <Trophy className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Achievements</h1>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-amber-100 text-sm md:ml-4 mt-2 md:mt-0">
              Track your progress in {community.name}
            </p>

            {/* Stats horizontal */}
            <div className="flex space-x-6 mt-4 md:mt-0">
              <div className="text-center">
                <div className="text-xl font-bold">{stats.unlocked}</div>
                <div className="text-amber-100 text-xs">Unlocked</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{stats.inProgress}</div>
                <div className="text-amber-100 text-xs">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{stats.completionRate}%</div>
                <div className="text-amber-100 text-xs">Complete</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Content */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-3 sm:inline-grid bg-white border">
                <TabsTrigger value="all">
                  All ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="unlocked">
                  Unlocked ({stats.unlocked})
                </TabsTrigger>
                <TabsTrigger value="locked">
                  Locked ({stats.locked})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? (
                  <><List className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">List</span></>
                ) : (
                  <><Grid3x3 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Grid</span></>
                )}
              </Button>
              <Button 
                size="sm" 
                onClick={handleRefresh}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {safeAchievements.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No achievements yet</h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Start engaging with the community to unlock your first achievement!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              "grid gap-4",
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            )}>
              {(activeTab === 'all' ? safeAchievements : activeTab === 'unlocked' ? unlockedAchievements : lockedAchievements).map((achievement) => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AchievementCard({ 
  achievement, 
  viewMode,
}: { 
  achievement: AchievementWithProgress
  viewMode: 'grid' | 'list'
}) {
  const rarityConfig = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common
  const RarityIcon = rarityConfig.icon

  const progressPercent = achievement.progress || 0
  const isUnlocked = achievement.isUnlocked

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        isUnlocked
          ? "border-amber-200 bg-gradient-to-br from-white to-amber-50"
          : "border-gray-200 bg-white hover:border-gray-300",
        viewMode === 'list' && "flex-row"
      )}
    >
      {/* Shine effect for unlocked achievements */}
      {isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "relative rounded-xl p-3 transition-all",
            isUnlocked
              ? `bg-gradient-to-br ${rarityConfig.gradient} text-white shadow-md`
              : "bg-gray-100 text-gray-400"
          )}>
            {isUnlocked ? (
              <>
                <RarityIcon className="h-5 w-5 relative z-10" />
                <Sparkles className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-white animate-pulse" />
              </>
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </div>

          {/* Title and Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <Badge className={cn("text-xs border", rarityConfig.color)}>
                {rarityConfig.label}
              </Badge>
              {achievement.points > 0 && (
                <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700">
                  <Zap className="h-2.5 w-2.5 mr-0.5" />
                  {achievement.points} XP
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-bold text-gray-900 mb-1">
              {achievement.name}
            </CardTitle>
            <p className="text-sm text-gray-600 line-clamp-2">
              {achievement.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Progress Bar for Locked Achievements */}
        {!isUnlocked && achievement.currentValue !== undefined && achievement.targetValue !== undefined && (
          <div className="space-y-1.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium flex items-center gap-1">
                <Target className="h-3 w-3" />
                Progress
              </span>
              <span className="font-bold text-gray-900">
                {achievement.currentValue} / {achievement.targetValue}
              </span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-1.5 bg-gray-200" 
            />
            <p className="text-xs text-gray-500">
              {Math.round(progressPercent)}% complete
            </p>
          </div>
        )}

        {/* Unlocked Status */}
        {isUnlocked && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-100">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-700">Achievement Unlocked!</p>
              {achievement.earnedAt && (
                <p className="text-xs text-green-600">
                  {formatDistanceToNow(new Date(achievement.earnedAt), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {achievement.tags && achievement.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {achievement.tags.slice(0, 3).map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="text-xs bg-gray-100 text-gray-600"
              >
                {tag}
              </Badge>
            ))}
            {achievement.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                +{achievement.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}