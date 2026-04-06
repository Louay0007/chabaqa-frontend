"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Send,
  Sparkles,
  Award,
  Flame,
  X,
  Paperclip,
  Loader2,
  GraduationCap,
  BookOpen,
  FlaskConical,
  Microscope,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  geoApi,
  GeoDifficultyLevel,
  GeoHistoryMessage,
  GeoUserProfile,
  GeoAchievement,
} from "@/lib/api/geo.api"
import { useAuthContext } from "@/app/providers/auth-provider"

interface GeoChatMessage {
  role: "user" | "geo"
  content: string
  imagePreview?: string
  pointsEarned?: number
  newAchievements?: string[]
  currentStreak?: number
  difficultyLevel?: GeoDifficultyLevel
  createdAt?: string | null
}

interface GeoChatProps {
  courseId: string
  chapterId: string
  courseName?: string
  chapterName?: string
}

const DIFFICULTY_CONFIG: Record<
  GeoDifficultyLevel,
  {
    label: string
    Icon: React.FC<{ className?: string }>
    color: string
    ring: string
    pill: string
  }
> = {
  beginner: {
    label: "Beginner",
    Icon: BookOpen,
    color: "text-emerald-600",
    ring: "ring-emerald-200",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  intermediate: {
    label: "Intermediate",
    Icon: GraduationCap,
    color: "text-blue-600",
    ring: "ring-blue-200",
    pill: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  advanced: {
    label: "Advanced",
    Icon: FlaskConical,
    color: "text-violet-600",
    ring: "ring-violet-200",
    pill: "bg-violet-50 text-violet-700 border border-violet-200",
  },
  expert: {
    label: "Expert",
    Icon: Microscope,
    color: "text-amber-600",
    ring: "ring-amber-200",
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
  },
}

const SUGGESTION_PROMPTS = [
  "Explain the key concept",
  "Give me a real-world example",
  "What should I know first?",
]

function AchievementBanner({
  achievements,
  allAchievements,
}: {
  achievements: string[]
  allAchievements: GeoAchievement[]
}) {
  if (!achievements.length) return null
  return (
    <div className="flex flex-col gap-1 mt-2">
      {achievements.map((id) => {
        const a = allAchievements.find((x) => x.identifier === id)
        if (!a) return null
        return (
          <div
            key={id}
            className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 font-medium"
          >
            <Award className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
            <span>
              Achievement unlocked:{" "}
              <span className="font-semibold">{a.title}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

function MessageBubble({
  message,
  userInitials,
  userAvatar,
  allAchievements,
}: {
  message: GeoChatMessage
  userInitials: string
  userAvatar?: string
  allAchievements: GeoAchievement[]
}) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Geo avatar */}
      {!isUser && (
        <div className="h-7 w-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      <div
        className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}
      >
        {/* Image attachment */}
        {message.imagePreview && (
          <div className="rounded-lg overflow-hidden border border-border mb-1">
            <img
              src={message.imagePreview}
              alt="Attachment"
              className="max-w-[180px] max-h-[140px] object-cover"
            />
          </div>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-violet-600 text-white rounded-br-sm"
              : "bg-white border border-border text-gray-800 rounded-bl-sm shadow-sm"
          }`}
        >
          {message.content}
        </div>

        {/* Points */}
        {message.pointsEarned && message.pointsEarned > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
            <Award className="h-3 w-3" />
            <span>+{message.pointsEarned} pts earned</span>
          </div>
        )}

        {/* Achievement unlocks */}
        {message.newAchievements && message.newAchievements.length > 0 && (
          <AchievementBanner
            achievements={message.newAchievements}
            allAchievements={allAchievements}
          />
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
          {userAvatar && (
            <img
              src={userAvatar}
              alt="You"
              className="h-full w-full object-cover rounded-full"
            />
          )}
          <AvatarFallback className="bg-violet-100 text-violet-700 text-[10px] font-bold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

export default function GeoChat({
  courseId,
  chapterId,
  courseName,
  chapterName,
}: GeoChatProps) {
  const { toast } = useToast()
  const { user: currentUser } = useAuthContext()
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState<GeoChatMessage[]>([])
  const [input, setInput] = useState("")
  const [difficultyLevel, setDifficultyLevel] =
    useState<GeoDifficultyLevel>("intermediate")
  const [isLoading, setIsLoading] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<GeoUserProfile | null>(null)
  const [allAchievements, setAllAchievements] = useState<GeoAchievement[]>([])

  const userAvatar =
    (currentUser as any)?.avatar ||
    (currentUser as any)?.photo_profil ||
    undefined
  const userInitials =
    (currentUser?.name || "You")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p: string) => p[0]?.toUpperCase() || "")
      .join("") || "U"

  // Load history + profile + achievements
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsHistoryLoading(true)
      setMessages([])
      try {
        const [historyRes, profileRes, achievementsRes] =
          await Promise.allSettled([
            geoApi.getHistory(courseId, chapterId),
            geoApi.getProfile(),
            geoApi.getAchievements(),
          ])
        if (cancelled) return
        if (historyRes.status === "fulfilled") {
          setMessages(
            historyRes.value.messages.map((m: GeoHistoryMessage) => ({
              role: m.role === "user" ? "user" : "geo",
              content: m.content,
              createdAt: m.createdAt,
            }))
          )
        }
        if (profileRes.status === "fulfilled") {
          setUserProfile(profileRes.value)
          setDifficultyLevel(
            profileRes.value.preferredDifficultyLevel || "intermediate"
          )
        }
        if (achievementsRes.status === "fulfilled") {
          setAllAchievements(achievementsRes.value)
        }
      } catch {
        //
      } finally {
        if (!cancelled) setIsHistoryLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [courseId, chapterId])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 5 MB.",
        variant: "destructive",
      })
      return
    }
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleDifficultyChange = async (level: GeoDifficultyLevel) => {
    setDifficultyLevel(level)
    try {
      await geoApi.updateDifficulty(level)
    } catch {
      //
    }
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed && !selectedImage) return
    if (isLoading) return

    const userMsg: GeoChatMessage = {
      role: "user",
      content: trimmed || "Please analyse this image.",
      imagePreview: imagePreview || undefined,
      difficultyLevel,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    const capturedImage = selectedImage
    clearImage()
    setIsLoading(true)

    try {
      const response = await geoApi.askQuestion(
        courseId,
        chapterId,
        trimmed || "Please analyse this image.",
        { difficultyLevel, image: capturedImage || undefined }
      )

      setMessages((prev) => [
        ...prev,
        {
          role: "geo",
          content: response.answer,
          pointsEarned: response.pointsEarned,
          newAchievements: response.newAchievements,
          currentStreak: response.currentStreak,
          difficultyLevel: response.difficultyLevel,
        },
      ])

      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              questionsAsked: prev.questionsAsked + 1,
              totalPoints: prev.totalPoints + (response.pointsEarned || 5),
              currentStreak: response.currentStreak ?? prev.currentStreak,
              unlockedAchievements: [
                ...new Set([
                  ...prev.unlockedAchievements,
                  ...(response.newAchievements || []),
                ]),
              ],
            }
          : prev
      )
    } catch (err: any) {
      toast({
        title: "No response from Geo",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const diffCfg = DIFFICULTY_CONFIG[difficultyLevel]
  const DiffIcon = diffCfg.Icon

  return (
    <Card className="flex flex-col overflow-hidden border border-border shadow-sm bg-white rounded-xl" style={{ height: 600 }}>

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-white">
        {/* Identity */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">Geo</p>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
              AI Learning Assistant
            </p>
          </div>
        </div>

        {/* Stats */}
        {userProfile && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">
                {userProfile.totalPoints.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-orange-50 border border-orange-200 px-2.5 py-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-semibold text-orange-700">
                {userProfile.currentStreak}d
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-b border-border bg-gray-50/60">
        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
          Level
        </span>
        <Select
          value={difficultyLevel}
          onValueChange={(v) => handleDifficultyChange(v as GeoDifficultyLevel)}
        >
          <SelectTrigger
            className={`h-7 w-40 text-xs font-medium border ${diffCfg.pill}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              Object.entries(DIFFICULTY_CONFIG) as [
                GeoDifficultyLevel,
                (typeof DIFFICULTY_CONFIG)[GeoDifficultyLevel]
              ][]
            ).map(([level, cfg]) => {
              const Icon = cfg.Icon
              return (
                <SelectItem key={level} value={level} className="text-xs">
                  <span className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    <span className={`font-medium ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        {userProfile && (
          <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground divide-x divide-border">
            <span className="pr-2">
              <span className="font-medium text-gray-700">
                {userProfile.questionsAsked}
              </span>{" "}
              questions
            </span>
            <span className="pl-2">
              <span className="font-medium text-gray-700">
                {userProfile.quizzesCompleted}
              </span>{" "}
              quizzes
            </span>
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-hidden bg-gray-50/40">
        <ScrollArea className="h-full px-4 py-4">
          {isHistoryLoading ? (
            <div className="flex flex-col items-center justify-center h-44 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mb-2 text-violet-400" />
              <p className="text-sm">Loading conversation…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-center px-4">
              <div className="h-14 w-14 rounded-2xl bg-violet-600 flex items-center justify-center mb-4 shadow-sm">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">
                Ask me anything about{" "}
                <span className="text-violet-600">
                  {chapterName || "this chapter"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mb-4 max-w-[260px] leading-relaxed">
                I adapt my explanations to your selected level. You can also
                upload images for visual analysis.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTION_PROMPTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-white hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-colors text-gray-600 shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 pb-2">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  message={msg}
                  userInitials={userInitials}
                  userAvatar={userAvatar}
                  allAchievements={allAchievements}
                />
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="h-7 w-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Input area ── */}
      <div className="flex-shrink-0 border-t border-border bg-white px-4 py-3">
        {/* Image preview strip */}
        {imagePreview && (
          <div className="mb-2 flex items-center gap-2 px-2.5 py-2 bg-gray-50 rounded-lg border border-border text-sm">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-8 w-8 object-cover rounded"
            />
            <span className="flex-1 text-xs text-muted-foreground truncate">
              {selectedImage?.name}
            </span>
            <button
              onClick={clearImage}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message Geo…`}
            className="flex-1 min-h-[36px] max-h-[120px] resize-none text-sm py-2"
            rows={1}
            disabled={isLoading || isHistoryLoading}
          />

          <Button
            onClick={handleSend}
            disabled={
              isLoading ||
              isHistoryLoading ||
              (!input.trim() && !selectedImage)
            }
            size="icon"
            className="h-9 w-9 flex-shrink-0 bg-violet-600 hover:bg-violet-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground mt-1.5">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </Card>
  )
}
