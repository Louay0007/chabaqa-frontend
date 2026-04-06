'use client'

import { useEffect, useRef } from 'react'
import { landingPagesApi } from '@/lib/api/landing-pages.api'

interface Props { pageId: string }

function getDevice(): 'desktop' | 'tablet' | 'mobile' {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1280
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

function generateSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export default function PageViewTracker({ pageId }: Props) {
  const sessionIdRef = useRef<string>(generateSessionId())
  const startTimeRef = useRef<number>(Date.now())
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return
    trackedRef.current = true
    const sessionId = sessionIdRef.current

    landingPagesApi.trackView(pageId, {
      sessionId,
      referrer: document.referrer || undefined,
      device: getDevice(),
    })

    const handleExit = () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const payload = JSON.stringify({ duration, converted: false })
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${baseUrl}/landing-pages/public/${pageId}/view/${sessionId}/exit`,
          new Blob([payload], { type: 'application/json' })
        )
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') handleExit()
    }

    window.addEventListener('beforeunload', handleExit)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleExit)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pageId])

  return null
}
