import Image from 'next/image'
import type { ExploreItem } from '@/lib/explore-data'
import { TYPE_CONFIG } from '@/lib/explore-data'

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`
}

interface ExploreListRowProps {
  item: ExploreItem
}

export function ExploreListRow({ item }: ExploreListRowProps) {
  const type = TYPE_CONFIG[item.type]
  return (
    <a href={item.url} className="block">
      <article className="group flex gap-4 bg-[var(--white)] border border-[var(--bd)] rounded-2xl overflow-hidden hover:shadow-[0_8px_32px_rgba(142,120,251,.13)] hover:-translate-y-[2px] transition-all duration-300 p-3">
        <div className="relative flex-shrink-0 w-[140px] sm:w-[180px] rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <Image src={item.banner} alt={item.title} fill className="object-cover" sizes="180px" />
          <div className="absolute top-2 end-2 flex gap-1">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.price === 'free' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' : 'bg-black/60 text-white'}`}>
              {item.price === 'free' ? 'Free' : `${item.price} ${item.currency}`}
            </span>
          </div>
        </div>
        <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
          <div>
            <h3 className="text-sm font-bold text-[var(--t1)] line-clamp-1 group-hover:text-[var(--p)] transition-colors mb-1">{item.title}</h3>
            <p className="text-[11px] text-[var(--t3)] line-clamp-2 leading-relaxed">{item.desc}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <div className="flex items-center gap-1.5">
              <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-[var(--bd)]">
                {item.creatorAvatar
                  ? <Image src={item.creatorAvatar} alt={item.creator} fill className="object-cover" sizes="20px" />
                  : <div className="w-full h-full flex items-center justify-center text-[7px] font-black text-white" style={{ background: item.creatorColor }}>{item.creatorInitials}</div>
                }
              </div>
              <span className="text-[11px] text-[var(--t3)] font-medium">{item.creator}</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: type.bg, color: type.color, border: `1px solid ${type.border}` }}>{type.label}</span>
            {item.members !== undefined && (
              <span className="flex items-center gap-1 text-[11px] text-[var(--t3)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
                {fmt(item.members)}
              </span>
            )}
            {item.rating !== undefined && (
              <span className="flex items-center gap-1 text-[11px]">
                <svg viewBox="0 0 24 24" fill="#ff9b28" width="10" height="10" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span className="font-semibold text-[var(--t2)]">{item.rating}</span>
              </span>
            )}
            <span className={`ms-auto text-xs font-black flex-shrink-0 ${item.price === 'free' ? 'text-emerald-500' : 'text-[var(--t1)]'}`}>
              {item.price === 'free' ? 'Free' : `${item.price} ${item.currency}`}
            </span>
          </div>
        </div>
      </article>
    </a>
  )
}
