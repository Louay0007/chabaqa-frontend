"use client"

import React, { useState } from "react"
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Microscope,
  Award,
  CircleDot,
  PenLine,
  ClipboardCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import {
  geoApi,
  GeoDifficultyLevel,
  GeoQuizQuestion,
  GeoQuizSubmitResponse,
} from "@/lib/api/geo.api"

interface GeoQuizPanelProps {
  courseId: string
  chapterId: string
  chapterName?: string
  initialDifficultyLevel?: GeoDifficultyLevel
}

type QuizState = "idle" | "generating" | "taking" | "submitting" | "results"

const DIFFICULTY_CONFIG: Record<
  GeoDifficultyLevel,
  {
    label: string
    Icon: React.FC<{ className?: string }>
    color: string
    pill: string
    multiplier: number
  }
> = {
  beginner: {
    label: "Beginner",
    Icon: BookOpen,
    color: "text-emerald-600",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    multiplier: 1,
  },
  intermediate: {
    label: "Intermediate",
    Icon: GraduationCap,
    color: "text-blue-600",
    pill: "bg-blue-50 text-blue-700 border-blue-200",
    multiplier: 1.5,
  },
  advanced: {
    label: "Advanced",
    Icon: FlaskConical,
    color: "text-violet-600",
    pill: "bg-violet-50 text-violet-700 border-violet-200",
    multiplier: 2,
  },
  expert: {
    label: "Expert",
    Icon: Microscope,
    color: "text-amber-600",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    multiplier: 3,
  },
}

function getScoreVariant(pct: number): {
  label: string
  color: string
  bg: string
} {
  if (pct === 100) return { label: "Perfect Score", color: "text-emerald-700", bg: "bg-emerald-50" }
  if (pct >= 80)  return { label: "Excellent",      color: "text-blue-700",    bg: "bg-blue-50"    }
  if (pct >= 60)  return { label: "Good",            color: "text-violet-700",  bg: "bg-violet-50"  }
  if (pct >= 40)  return { label: "Keep Practising", color: "text-amber-700",   bg: "bg-amber-50"   }
  return                  { label: "Needs Review",   color: "text-red-700",     bg: "bg-red-50"     }
}

function getScoreMessage(pct: number): string {
  if (pct === 100) return "Flawless! You answered every question correctly."
  if (pct >= 80)  return "Great work — you have a strong grasp of this chapter."
  if (pct >= 60)  return "Solid progress. Review the missed questions to reinforce understanding."
  if (pct >= 40)  return "You're on the right track. More practice will help."
  return "Take time to re-read the chapter, then try again."
}

// ─── Idle ─────────────────────────────────────────────────────────────────────

function IdleScreen({
  difficultyLevel,
  setDifficultyLevel,
  questionCount,
  setQuestionCount,
  chapterName,
  onGenerate,
}: {
  difficultyLevel: GeoDifficultyLevel
  setDifficultyLevel: (v: GeoDifficultyLevel) => void
  questionCount: number
  setQuestionCount: (v: number) => void
  chapterName?: string
  onGenerate: () => void
}) {
  const cfg = DIFFICULTY_CONFIG[difficultyLevel]
  const DiffIcon = cfg.Icon
  const maxPoints =
    Math.floor(questionCount * 10 * cfg.multiplier) + 50

  return (
    <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
      {/* Header band */}
      <div className="bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <ClipboardCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-base leading-tight">
            Knowledge Check
          </p>
          <p className="text-white/70 text-xs mt-0.5 leading-tight">
            {chapterName ? `Based on: ${chapterName}` : "Chapter assessment"}
          </p>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="space-y-5">
          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Difficulty level
            </label>
            <Select
              value={difficultyLevel}
              onValueChange={(v) => setDifficultyLevel(v as GeoDifficultyLevel)}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(DIFFICULTY_CONFIG) as [
                    GeoDifficultyLevel,
                    (typeof DIFFICULTY_CONFIG)[GeoDifficultyLevel]
                  ][]
                ).map(([level, c]) => {
                  const Icon = c.Icon
                  return (
                    <SelectItem key={level} value={level} className="text-sm">
                      <span className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${c.color}`} />
                        <span className={`font-medium ${c.color}`}>
                          {c.label}
                        </span>
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Question count */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Number of questions
            </label>
            <Select
              value={String(questionCount)}
              onValueChange={(v) => setQuestionCount(Number(v))}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 7, 10].map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-sm">
                    {n} questions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Points preview */}
          <div
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${cfg.pill}`}
          >
            <DiffIcon className={`h-5 w-5 flex-shrink-0 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-none">
                {cfg.label} · up to {maxPoints} pts
              </p>
              <p className="text-[11px] opacity-70 mt-0.5">
                Includes {questionCount * 10}× base + difficulty bonus + 50 perfect-score bonus
              </p>
            </div>
          </div>

          <Button
            onClick={onGenerate}
            className="w-full h-10 bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate Quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Generating ───────────────────────────────────────────────────────────────

function GeneratingScreen({
  questionCount,
  difficultyLabel,
}: {
  questionCount: number
  difficultyLabel: string
}) {
  return (
    <Card className="border border-border shadow-sm rounded-xl">
      <CardContent className="py-16 flex flex-col items-center text-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
        </div>
        <p className="font-semibold text-gray-900">Generating your quiz…</p>
        <p className="text-sm text-muted-foreground">
          Creating {questionCount} {difficultyLabel.toLowerCase()}-level
          questions. This takes a few seconds.
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Taking Quiz ──────────────────────────────────────────────────────────────

function TakingScreen({
  questions,
  answers,
  setAnswers,
  currentQuestion,
  setCurrentQuestion,
  onSubmit,
  isSubmitting,
  difficultyLevel,
}: {
  questions: GeoQuizQuestion[]
  answers: Record<string, string>
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>
  currentQuestion: number
  setCurrentQuestion: React.Dispatch<React.SetStateAction<number>>
  onSubmit: () => void
  isSubmitting: boolean
  difficultyLevel: GeoDifficultyLevel
}) {
  const q = questions[currentQuestion]
  const total = questions.length
  const answeredCount = Object.keys(answers).length
  const isLast = currentQuestion === total - 1
  const cfg = DIFFICULTY_CONFIG[difficultyLevel]
  const DiffIcon = cfg.Icon

  return (
    <Card
      className="border border-border shadow-sm rounded-xl flex flex-col overflow-hidden"
      style={{ minHeight: 480 }}
    >
      {/* Quiz header */}
      <div className="flex-shrink-0 px-5 py-3 border-b border-border bg-white">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs border ${cfg.pill} gap-1.5`}
            >
              <DiffIcon className={`h-3 w-3 ${cfg.color}`} />
              {cfg.label}
            </Badge>
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestion + 1}
              <span className="text-muted-foreground font-normal">
                {" "}/ {total}
              </span>
            </span>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {answeredCount}/{total} answered
          </span>
        </div>
        <Progress
          value={(answeredCount / total) * 100}
          className="h-1.5 bg-gray-100"
        />
      </div>

      {/* Question body */}
      <ScrollArea className="flex-1 px-5 py-5">
        {q && (
          <div className="space-y-5">
            {/* Question text */}
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-md bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-violet-700">
                  {currentQuestion + 1}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                {q.question}
              </p>
            </div>

            {/* Multiple choice */}
            {q.type === "multiple-choice" && q.options && (
              <RadioGroup
                value={answers[q.id] || ""}
                onValueChange={(val) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: val }))
                }
                className="space-y-2 ml-9"
              >
                {q.options.map((opt, idx) => {
                  const selected = answers[q.id] === opt
                  return (
                    <div
                      key={idx}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                      }
                      className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 cursor-pointer transition-all ${
                        selected
                          ? "border-violet-500 bg-violet-50/60"
                          : "border-border bg-white hover:border-violet-300 hover:bg-violet-50/30"
                      }`}
                    >
                      <RadioGroupItem
                        value={opt}
                        id={`q${q.id}-${idx}`}
                        className="flex-shrink-0"
                      />
                      <Label
                        htmlFor={`q${q.id}-${idx}`}
                        className="cursor-pointer text-sm flex-1 leading-snug font-normal"
                      >
                        {opt}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            )}

            {/* True / False */}
            {q.type === "true-false" && (
              <RadioGroup
                value={answers[q.id] || ""}
                onValueChange={(val) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: val }))
                }
                className="grid grid-cols-2 gap-3 ml-9"
              >
                {["True", "False"].map((opt) => {
                  const selected = answers[q.id] === opt
                  return (
                    <div
                      key={opt}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                      }
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 cursor-pointer transition-all ${
                        selected
                          ? "border-violet-500 bg-violet-50/60"
                          : "border-border bg-white hover:border-violet-300 hover:bg-violet-50/30"
                      }`}
                    >
                      <RadioGroupItem
                        value={opt}
                        id={`q${q.id}-${opt}`}
                        className="flex-shrink-0"
                      />
                      <Label
                        htmlFor={`q${q.id}-${opt}`}
                        className="cursor-pointer text-sm font-medium"
                      >
                        {opt}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            )}

            {/* Fill blank */}
            {q.type === "fill-blank" && (
              <div className="ml-9">
                <div className="flex items-center gap-2 mb-1.5">
                  <PenLine className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Type your answer
                  </span>
                </div>
                <input
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  placeholder="Enter your answer…"
                  className="w-full border-2 border-border rounded-lg px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none transition-colors"
                />
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer nav */}
      <div className="flex-shrink-0 border-t border-border px-5 py-3.5 bg-white flex items-center justify-between">
        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQuestion(i)}
              className={`rounded-full transition-all ${
                i === currentQuestion
                  ? "h-2 w-5 bg-violet-600"
                  : answers[questions[i]?.id]
                  ? "h-2 w-2 bg-violet-300"
                  : "h-2 w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {currentQuestion > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQuestion((p) => p - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          )}

          {!isLast ? (
            <Button
              size="sm"
              onClick={() => setCurrentQuestion((p) => p + 1)}
              disabled={!answers[q?.id]}
              className="gap-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={answeredCount < total || isSubmitting}
              className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Submit Quiz
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── Results ──────────────────────────────────────────────────────────────────

function ResultsScreen({
  results,
  onReset,
  onRetry,
}: {
  results: GeoQuizSubmitResponse
  onReset: () => void
  onRetry: () => void
}) {
  const pct = results.percentage
  const variant = getScoreVariant(pct)
  const message = getScoreMessage(pct)
  const cfg = DIFFICULTY_CONFIG[results.difficultyLevel]
  const DiffIcon = cfg.Icon

  return (
    <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
      {/* Score banner */}
      <div className={`px-6 py-6 text-center border-b border-border ${variant.bg}`}>
        <div
          className={`text-5xl font-black mb-1 tabular-nums ${variant.color}`}
        >
          {pct}%
        </div>
        <p className={`text-sm font-bold mb-0.5 ${variant.color}`}>
          {variant.label}
        </p>
        <p className="text-xs text-muted-foreground mb-4">{message}</p>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="bg-white border-amber-200 text-amber-700 gap-1.5 px-3 py-1"
          >
            <Award className="h-3.5 w-3.5 text-amber-500" />
            +{results.pointsEarned} pts
          </Badge>
          <Badge
            variant="outline"
            className={`bg-white border ${cfg.pill} gap-1.5 px-3 py-1`}
          >
            <DiffIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
            {cfg.label}
          </Badge>
          <Badge
            variant="outline"
            className="bg-white border-gray-200 text-gray-700 gap-1 px-3 py-1"
          >
            {results.score}/{results.totalQuestions} correct
          </Badge>
        </div>

        {results.newAchievements && results.newAchievements.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {results.newAchievements.map((id) => (
              <Badge
                key={id}
                variant="outline"
                className="bg-white border-violet-200 text-violet-700 gap-1.5 px-2.5 py-1 text-xs"
              >
                <Trophy className="h-3 w-3 text-violet-500" />
                Achievement unlocked
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Per-question breakdown */}
      <ScrollArea className="max-h-[340px]">
        <div className="px-5 py-4 space-y-3">
          {results.results.map((r, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 ${
                r.isCorrect
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-red-200 bg-red-50/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {r.isCorrect ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">
                    {i + 1}. {r.question}
                  </p>
                  <div className="space-y-0.5 text-xs">
                    <p
                      className={`${
                        r.isCorrect ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      <span className="font-semibold">Your answer: </span>
                      {r.userAnswer || "—"}
                    </p>
                    {!r.isCorrect && (
                      <p className="text-emerald-700">
                        <span className="font-semibold">Correct: </span>
                        {r.correctAnswer}
                      </p>
                    )}
                  </div>
                  {r.explanation && (
                    <>
                      <Separator className="my-1.5" />
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {r.explanation}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-border flex gap-3">
        <Button
          variant="outline"
          onClick={onReset}
          className="flex-1 gap-2 text-sm"
        >
          <RotateCcw className="h-4 w-4" />
          New Quiz
        </Button>
        <Button
          onClick={onRetry}
          className="flex-1 gap-2 text-sm bg-violet-600 hover:bg-violet-700 text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GeoQuizPanel({
  courseId,
  chapterId,
  chapterName,
  initialDifficultyLevel,
}: GeoQuizPanelProps) {
  const { toast } = useToast()

  const [quizState, setQuizState] = useState<QuizState>("idle")
  const [difficultyLevel, setDifficultyLevel] = useState<GeoDifficultyLevel>(
    initialDifficultyLevel || "intermediate"
  )
  const [questionCount, setQuestionCount] = useState(5)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<GeoQuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<GeoQuizSubmitResponse | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const handleGenerateQuiz = async () => {
    setQuizState("generating")
    try {
      const res = await geoApi.generateQuiz(courseId, chapterId, {
        difficultyLevel,
        questionCount,
        questionTypes: ["multiple-choice", "true-false"],
      })
      setQuizId(res.quizId)
      setQuestions(res.questions)
      setAnswers({})
      setCurrentQuestion(0)
      setResults(null)
      setQuizState("taking")
    } catch (err: any) {
      toast({
        title: "Could not generate quiz",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
      setQuizState("idle")
    }
  }

  const handleSubmitQuiz = async () => {
    if (!quizId) return
    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }))
    if (answersArray.length < questions.length) {
      toast({
        title: "Incomplete quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      })
      return
    }
    setQuizState("submitting")
    try {
      const res = await geoApi.submitQuiz(quizId, answersArray)
      setResults(res)
      setQuizState("results")
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
      setQuizState("taking")
    }
  }

  const handleReset = () => {
    setQuizState("idle")
    setQuizId(null)
    setQuestions([])
    setAnswers({})
    setResults(null)
    setCurrentQuestion(0)
  }

  if (quizState === "idle")
    return (
      <IdleScreen
        difficultyLevel={difficultyLevel}
        setDifficultyLevel={setDifficultyLevel}
        questionCount={questionCount}
        setQuestionCount={setQuestionCount}
        chapterName={chapterName}
        onGenerate={handleGenerateQuiz}
      />
    )

  if (quizState === "generating")
    return (
      <GeneratingScreen
        questionCount={questionCount}
        difficultyLabel={DIFFICULTY_CONFIG[difficultyLevel].label}
      />
    )

  if (quizState === "taking" || quizState === "submitting")
    return (
      <TakingScreen
        questions={questions}
        answers={answers}
        setAnswers={setAnswers}
        currentQuestion={currentQuestion}
        setCurrentQuestion={setCurrentQuestion}
        onSubmit={handleSubmitQuiz}
        isSubmitting={quizState === "submitting"}
        difficultyLevel={difficultyLevel}
      />
    )

  if (quizState === "results" && results)
    return (
      <ResultsScreen
        results={results}
        onReset={handleReset}
        onRetry={() => {
          setAnswers({})
          setCurrentQuestion(0)
          setQuizState("taking")
        }}
      />
    )

  return null
}
