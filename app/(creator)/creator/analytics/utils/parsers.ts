import { AnalyticsTimeRange } from "./types"

export const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export const toOptionalNumber = (value: unknown): number | undefined => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export const toChangeLabel = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim().length > 0) return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : ""
    return `${sign}${Math.abs(value).toFixed(1)}%`
  }
  return undefined
}

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object") return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

export const tryParseJsonObject = (input: unknown): Record<string, unknown> | null => {
  if (typeof input !== "string") return null
  const trimmed = input.trim()
  if (!trimmed.startsWith("{")) return null

  const withoutTruncated = trimmed.replace(/\n?\[truncated\]\s*$/i, "").trim()
  const lastBrace = withoutTruncated.lastIndexOf("}")
  if (lastBrace <= 0) return null

  const candidate = withoutTruncated.slice(0, lastBrace + 1)
  try {
    const parsed = JSON.parse(candidate)
    return isPlainObject(parsed) ? parsed : null
  } catch {
    return null
  }
}

const extractJsonStringField = (input: string, fieldName: string): string | null => {
  const needle = `"${fieldName}"`
  const idx = input.indexOf(needle)
  if (idx < 0) return null
  let i = idx + needle.length
  while (i < input.length && /\s/.test(input[i])) i++
  if (input[i] !== ":") return null
  i++
  while (i < input.length && /\s/.test(input[i])) i++
  if (input[i] !== "\"") return null

  const start = i
  i++
  let escaped = false
  while (i < input.length) {
    const ch = input[i]
    if (escaped) {
      escaped = false
      i++
      continue
    }
    if (ch === "\\") {
      escaped = true
      i++
      continue
    }
    if (ch === "\"") {
      const jsonStringLiteral = input.slice(start, i + 1)
      try {
        const decoded = JSON.parse(jsonStringLiteral)
        return typeof decoded === "string" ? decoded : null
      } catch {
        return null
      }
    }
    i++
  }
  return null
}

export const toHumanParagraph = (input: unknown): string => {
  if (typeof input !== "string") return ""
  const trimmed = input.trim()
  if (!trimmed) return ""

  const extracted = extractJsonStringField(trimmed, "summary")
  if (extracted && extracted.trim().length > 0) return extracted.trim()

  const withoutTruncated = trimmed.replace(/\n?\[truncated\]\s*$/i, "").trim()
  const stopAt = (() => {
    const markers = ["\"topIssues\"", "\"fixes\"", "\"rewriteSuggestions\"", "\"experiments\""]
    const indices = markers.map((m) => withoutTruncated.indexOf(m)).filter((n) => n > 0)
    return indices.length ? Math.min(...indices) : -1
  })()

  const candidate = (stopAt > 0 ? withoutTruncated.slice(0, stopAt) : withoutTruncated)
    .replace(/^\{+/, "")
    .replace(/,+\s*$/, "")
    .replace(/"summary"\s*:\s*/i, "")
    .trim()

  if (!candidate) return ""

  return candidate
    .replace(/^"+|"+$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim()
}

export const getRangeFromTimeRange = (timeRange: AnalyticsTimeRange): { from: string; to: string } => {
  const toDate = new Date()
  const fromDate = new Date()
  switch (timeRange) {
    case "7d":
      fromDate.setDate(toDate.getDate() - 7)
      break
    case "28d":
      fromDate.setDate(toDate.getDate() - 28)
      break
    case "90d":
      fromDate.setDate(toDate.getDate() - 90)
      break
    case "1y":
      fromDate.setFullYear(toDate.getFullYear() - 1)
      break
  }
  return { from: fromDate.toISOString(), to: toDate.toISOString() }
}
