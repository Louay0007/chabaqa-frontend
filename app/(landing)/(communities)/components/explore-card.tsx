import Image from 'next/image'
import Link from 'next/link'
import type { ExploreItem } from '@/lib/explore-data'
import { TYPE_CONFIG, type ContentType } from '@/lib/explore-data'
import { resolveExploreCardRouting } from '@/app/(landing)/(communities)/components/explore-card-routing'
import { useTranslations } from 'next-intl'
import type { Explore } from '@/lib/data-communities'

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`
}

const CTA_LABEL: Record<ContentType, string> = {
  community: 'Explore',
  course: 'Start',
  challenge: 'Join',
  product: 'Download',
  session: 'Book',
  event: 'Register',
}

interface ExploreCardProps {
  item: ExploreItem & Partial<Explore>
  featured?: boolean
  accessAware?: boolean
}

export function ExploreCard({ item, featured = false, accessAware = false }: ExploreCardProps) {
  const type = TYPE_CONFIG[item.type]
  const t = useTranslations('landing.explore')

  // Map ExploreItem to Explore format for routing
  const isFree = typeof item.price === 'string' && item.price === 'free'
  const numericPrice = typeof item.price === 'number' ? item.price : 0
  
  const exploreItem: Explore = {
    id: item.id,
    mongoId: item.id,
    type: item.type as any,
    name: item.title,
    slug: item.url.split('/').pop() || item.id,
    creator: item.creator,
    creatorSlug: item.creator.toLowerCase().replace(/\s+/g, '-'),
    creatorAvatar: item.creatorAvatar || '',
    description: item.desc,
    category: item.category,
    members: item.members || 0,
    rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating || '0'),
    ratingCount: item.ratingCount,
    tags: [],
    verified: item.verified || false,
    price: isFree ? 0 : numericPrice,
    priceType: isFree ? 'free' : 'paid',
    image: item.banner,
    featured: item.featured || false,
    link: item.url,
    isMember: (item as any).isMember,
    hasContentAccess: (item as any).hasContentAccess,
    communitySlug: (item as any).communitySlug || item.url.split('/').pop() || item.id,
  }

  const itemType = item.type
  
  // Get type-specific CTA text
  const getCtaText = (type: ContentType) => {
    const ctaMap: Record<ContentType, string> = {
      community: t('cta.explore'),
      course: t('cta.start'),
      challenge: t('cta.join'),
      product: t('cta.buy'),
      session: t('cta.book'),
      event: t('cta.register'),
    }
    return ctaMap[type] || CTA_LABEL[type]
  }

  const defaultCtaText = getCtaText(itemType)

  // Determine routing
  const defaultRouting = {
    href: itemType === 'community'
      ? (exploreItem.isMember
        ? (item.url || `/${exploreItem.creator}/${exploreItem.slug}`)
        : `/community/${exploreItem.slug}#join-section`)
      : (item.url || `/community/${exploreItem.communitySlug}#join-section`),
    label: itemType === 'community'
      ? (exploreItem.isMember ? defaultCtaText : t('cta.join'))
      : defaultCtaText,
  }

  const accessAwareRouting = resolveExploreCardRouting(exploreItem, defaultCtaText, {
    join: t('cta.join'),
    download: t('cta.download'),
    buy: t('cta.buy'),
    viewCommunity: t('cta.viewCommunity'),
  })

  const ctaHref = accessAware ? accessAwareRouting.href : defaultRouting.href
  const ctaLabel = accessAware ? accessAwareRouting.ctaLabel : defaultRouting.label

  return (
    <article
      className={`group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:-translate-y-[3px] hover:shadow-[0_16px_48px_rgba(142,120,251,.18)] transition-all duration-300${
        featured ? ' flex-shrink-0 w-[300px] sm:w-[320px]' : ' w-full'
      }`}
    >
      <div className="relative flex-shrink-0 overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <Image
          src={item.banner} alt={item.title} fill
          className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          sizes={featured ? '320px' : '(max-width:640px) 100vw,(max-width:1024px) 50vw,280px'}
        />
        <div className="absolute top-2.5 end-2.5 flex gap-1.5">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
            isFree
              ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
              : 'bg-black/65 text-white'
          }`}>
            {isFree ? 'Free' : `${item.price} ${item.currency || ''}`}
          </span>
          {featured && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm text-white bg-gradient-to-r from-amber-400 to-orange-600">
              VIP
            </span>
          )}
        </div>
        {item.verified && (
          <span className="absolute top-2.5 start-2.5 w-6 h-6 rounded-full bg-white/92 flex items-center justify-center shadow-sm" aria-label="Verified Creator">
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden="true">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                stroke="#8e78fb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#8e78fb] transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ring-[1.5px] ring-gray-200">
            {item.creatorAvatar
              ? <Image src={item.creatorAvatar} alt={item.creator} fill className="object-cover" sizes="24px" />
              : <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white" style={{ background: item.creatorColor }}>{item.creatorInitials}</div>
            }
          </div>
          <span className="text-[11px] text-gray-500 truncate flex items-center gap-1">
            {item.creator}
            {item.verified && (
              <svg viewBox="0 0 12 12" fill="#3b82f6" width="11" height="11" className="flex-shrink-0" aria-hidden="true">
                <circle cx="6" cy="6" r="6"/>
                <path d="M3.5 6l1.7 1.7L8.5 4.3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: type.bg, color: type.color, border: `1px solid ${type.border}` }}>
            {type.label}
          </span>
          {item.members !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {fmt(item.members)}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] ms-auto flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="#ff9b28" width="11" height="11" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span className="font-semibold text-gray-700">{typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating}</span>
            {item.ratingCount && <span className="text-gray-500">({item.ratingCount})</span>}
          </span>
        </div>
        <Link href={ctaHref}
          className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 hover:-translate-y-[1px] bg-[#8e78fb]">
          {ctaLabel}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </div>
    </article>
  )
}
