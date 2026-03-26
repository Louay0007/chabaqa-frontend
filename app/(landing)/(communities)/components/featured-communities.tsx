"use client"

import { useState, useRef } from "react"
import { FeaturedCommunityCard } from "@/app/(landing)/(communities)/components/featured-community-card"
import { useTranslations } from "next-intl"
import type { ExploreItem } from "@/lib/explore-data"

interface FeaturedCommunitiesProps {
  items: ExploreItem[]
}

export function FeaturedCommunities({ items }: FeaturedCommunitiesProps) {
  const t = useTranslations("landing.explore")
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  if (items.length === 0) return null

  const scrollBy = (direction: 1 | -1) => {
    scrollContainerRef.current?.scrollBy({ left: direction * 340, behavior: 'smooth' })
  }

  return (
    <section className="relative pt-12 pb-12 overflow-hidden bg-[var(--bg)]" aria-label={t('heroLabel')}>
      <div className="absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true"
        style={{ backgroundImage: 'linear-gradient(var(--bd) 1px,transparent 1px),linear-gradient(90deg,var(--bd) 1px,transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%,black 30%,transparent 100%)' }} />
      <div className="absolute w-[480px] h-[300px] rounded-full blur-[80px] opacity-[0.10] -top-16 -left-24 bg-[var(--p)] pointer-events-none" aria-hidden="true" />
      <div className="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-[0.08] top-8 -right-16 bg-[var(--cyan)] pointer-events-none" aria-hidden="true" />

      <div className="relative px-6 md:px-10 max-w-6xl mx-auto mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-5"
          style={{ background: 'var(--p2)', border: '1.5px solid var(--p3)', color: 'var(--p)', animation: 'fadeDown .6s ease both' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          {t('badge')}
        </div>
        <h1 className="text-[clamp(22px,4.8vw,52px)] font-black text-[var(--t1)] leading-tight tracking-[-0.03em] mb-4"
          style={{ animation: 'fadeDown .65s .08s ease both' }}>
          {t('heroTitle1')}{' '}
          <span className="relative inline-block">
            <span className="relative z-10" style={{ color: 'var(--p)' }}>{t('heroTitle2')}</span>
            <svg className="absolute -bottom-1 left-0 w-full overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 7 Q25 2 50 6 Q75 10 100 5" fill="none" stroke="var(--orange)" strokeWidth="2"
                strokeLinecap="round" pathLength="1"
                style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'drawLine 0.9s 0.65s ease-out forwards' }}/>
            </svg>
          </span>
        </h1>
        <p className="text-[var(--t3)] text-[clamp(14px,2vw,16px)] leading-relaxed max-w-xl mx-auto"
          style={{ animation: 'fadeDown .65s .16s ease both' }}>
          {t('heroSub')}
        </p>
      </div>

      <div className="relative px-6 md:px-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--p)] mb-0.5">{t('featuredEyebrow')}</div>
            <h2 className="text-lg font-black text-[var(--t1)]">{t('featuredTitle')}</h2>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => scrollBy(-1)} aria-label="Scroll left"
            className="absolute -start-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--white)] border border-[var(--bd)] shadow-md text-[var(--t3)] hover:text-[var(--p)] hover:border-[var(--p3)] transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={() => scrollBy(1)} aria-label="Scroll right"
            className="absolute -end-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--white)] border border-[var(--bd)] shadow-md text-[var(--t3)] hover:text-[var(--p)] hover:border-[var(--p3)] transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {items.map((item) => (
              <FeaturedCommunityCard
                key={item.id}
                community={item}
                slug={item.id}
                accessAware={true}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
