import type { Explore } from "@/lib/data-communities"

type ItemType = Explore["type"]

export interface ExploreCardRoutingResult {
  href: string
  ctaLabel: string
}

function normalizeValue(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed || null
}

function encodePathSegment(value: unknown): string | null {
  const normalized = normalizeValue(value)
  return normalized ? encodeURIComponent(normalized) : null
}

function communityOverviewHref(communitySlug: unknown): string {
  const encodedSlug = encodePathSegment(communitySlug)
  return encodedSlug ? `/community/${encodedSlug}` : "/explore"
}

function buildCommunityBasePath(item: Explore): string | null {
  const creatorSegment = encodePathSegment(item.creatorSlug || item.creator)
  const communitySlugSegment = encodePathSegment(item.communitySlug)

  if (!creatorSegment || !communitySlugSegment) {
    return null
  }

  return `/${creatorSegment}/${communitySlugSegment}`
}

function resolveAccessibleContentHref(item: Explore, itemType: ItemType): string {
  const basePath = buildCommunityBasePath(item)
  if (!basePath) return communityOverviewHref(item.communitySlug)

  const contentId = encodePathSegment(item.mongoId || item.id)
  if (!contentId) return communityOverviewHref(item.communitySlug)

  switch (itemType) {
    case "course":
      return `${basePath}/courses/${contentId}`
    case "challenge":
      return `${basePath}/challenges/${contentId}`
    case "product":
      return `${basePath}/products/${contentId}`
    case "oneToOne":
      return `${basePath}/sessions?sessionId=${contentId}`
    case "event":
      return `${basePath}/events?eventId=${contentId}`
    default:
      return communityOverviewHref(item.communitySlug)
  }
}

export function resolveExploreCardRouting(
  item: Explore,
  defaultCtaLabel: string,
): ExploreCardRoutingResult {
  const itemType: ItemType = item.type || "community"

  if (itemType === "community") {
    if (item.isMember) {
      const creatorSegment = encodePathSegment(item.creatorSlug || item.creator)
      const communitySlugSegment = encodePathSegment(item.slug)

      if (!creatorSegment || !communitySlugSegment) {
        return {
          href: "/explore",
          ctaLabel: defaultCtaLabel,
        }
      }

      return {
        href: `/${creatorSegment}/${communitySlugSegment}/home`,
        ctaLabel: defaultCtaLabel,
      }
    }

    return {
      href: communityOverviewHref(item.slug),
      ctaLabel: "Join",
    }
  }

  if (!item.isMember) {
    return {
      href: communityOverviewHref(item.communitySlug),
      ctaLabel: "View Community",
    }
  }

  return {
    href: resolveAccessibleContentHref(item, itemType),
    ctaLabel: defaultCtaLabel,
  }
}
