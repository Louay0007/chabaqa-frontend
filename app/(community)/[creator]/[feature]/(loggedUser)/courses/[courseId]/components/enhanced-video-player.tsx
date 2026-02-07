"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Lock, PlayCircle } from "lucide-react"
import { coursesApi } from "@/lib/api/courses.api"

interface EnhancedVideoPlayerProps {
  creatorSlug: string
  currentChapter: any
  isChapterAccessible: (chapterId: string) => boolean
  enrollment: any
  slug: string
  courseId: string
  onWatchTimeUpdate?: (seconds: number) => void
  onEnrollNow?: () => void
}

// Helper to extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /^([^"&?\/\s]{11})$/i // Just the ID
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Helper to extract Vimeo video ID
function extractVimeoId(url: string): string | null {
  if (!url) return null
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  return match ? match[1] : null
}

// Detect video platform
function detectPlatform(url: string): 'youtube' | 'vimeo' | 'other' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('vimeo.com')) return 'vimeo'
  return 'other'
}

export default function EnhancedVideoPlayer({
  creatorSlug,
  currentChapter,
  isChapterAccessible,
  enrollment,
  slug,
  courseId,
  onWatchTimeUpdate,
  onEnrollNow,
}: EnhancedVideoPlayerProps) {
  const [player, setPlayer] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [watchTime, setWatchTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const playerRef = useRef<HTMLDivElement>(null)
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null)
  const vimeoIframeRef = useRef<HTMLIFrameElement | null>(null)
  const [vimeoReady, setVimeoReady] = useState(false)

  const videoUrl = currentChapter?.videoUrl || ''
  const platform = detectPlatform(videoUrl)
  const youtubeId = platform === 'youtube' ? extractYouTubeId(videoUrl) : null
  const vimeoId = platform === 'vimeo' ? extractVimeoId(videoUrl) : null

  const isLocalFileVideo = useCallback(() => {
    const safeUrl = String(videoUrl || '')
    if (!safeUrl) return false
    // URLs containing /uploads/ are local files. 
    // We check for both /uploads/video/ and just /uploads/ for flexibility.
    if (safeUrl.includes('/uploads/')) return true
    return /\.(mp4|webm|mov|avi|mkv|3gp)(\?.*)?$/i.test(safeUrl)
  }, [videoUrl])

  // Diagnostic logging
  useEffect(() => {
    if (videoUrl) {
      console.log(`🎬 [VideoPlayer] Loading: "${currentChapter?.titre || currentChapter?.title}"`)
      console.log(`🔗 URL: ${videoUrl}`)
      console.log(`🛠️ Type: ${isLocalFileVideo() ? 'Local File' : platform}`)
    }
  }, [videoUrl, currentChapter, platform, isLocalFileVideo])

  // Send watch time to backend (throttled via lastUpdateRef). Now sends more frequently (per-second), guarded by isSendingRef.
  const isSendingRef = useRef<boolean>(false)
  const hasSentCompleteRef = useRef<boolean>(false)

  const sendWatchTime = useCallback(async (time: number, duration?: number) => {
    if (!enrollment || !currentChapter?.id) return
    if (isSendingRef.current) return
    isSendingRef.current = true

    try {
      const response = await coursesApi.updateChapterWatchTime(
        String(courseId),
        String(currentChapter.id),
        Math.floor(time),
        duration ? Math.floor(duration) : undefined
      )
      lastUpdateRef.current = time

      const percentage = duration ? Math.round((time / duration) * 100) : 0
      console.log(`📊 Watch time updated: ${Math.floor(time)}s / ${duration ? Math.floor(duration) + 's' : '?'} (${percentage}%)`)

      if (response?.isAutoCompleted) {
        console.log('✅ Chapter auto-completed!')
      }

      if (onWatchTimeUpdate) {
        onWatchTimeUpdate(Math.floor(time))
      }
    } catch (error) {
      console.error('Failed to update watch time:', error)
    } finally {
      isSendingRef.current = false
    }
  }, [courseId, currentChapter?.id, enrollment, onWatchTimeUpdate])

  // Initialize YouTube Player
  useEffect(() => {
    if (platform !== 'youtube' || !youtubeId || !playerRef.current) return
    if (!isChapterAccessible(currentChapter?.id)) return

    // Load YouTube IFrame API
    if (!(window as any).YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const initPlayer = () => {
      const newPlayer = new (window as any).YT.Player(playerRef.current, {
        videoId: youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.PLAYING) {
              setIsPlaying(true)
            } else {
              setIsPlaying(false)
            }
          },
        },
      })
      setPlayer(newPlayer)
    }

    if ((window as any).YT?.Player) {
      initPlayer()
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (player) {
        player.destroy()
      }
    }
  }, [youtubeId, platform, currentChapter?.id, isChapterAccessible])

  // Initialize Vimeo Player tracking via postMessage API
  useEffect(() => {
    if (platform !== 'vimeo' || !vimeoId || !vimeoIframeRef.current) return
    if (!isChapterAccessible(currentChapter?.id)) return

    const iframe = vimeoIframeRef.current
    const iframeWindow = iframe.contentWindow
    if (!iframeWindow) return

    // Enable Vimeo Player API
    const enableApi = () => {
      iframeWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'play' }), '*')
      iframeWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'pause' }), '*')
      iframeWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'timeupdate' }), '*')
      iframeWindow.postMessage(JSON.stringify({ method: 'getDuration' }), '*')
    }

    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('vimeo.com')) return
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data.event === 'ready') {
          setVimeoReady(true)
          enableApi()
        } else if (data.event === 'play') {
          setIsPlaying(true)
        } else if (data.event === 'pause') {
          setIsPlaying(false)
        } else if (data.event === 'timeupdate' && data.data) {
          const time = Number(data.data.seconds || 0)
          const duration = Number(data.data.duration || 0)
          setWatchTime(time)
          if (duration > 0) setVideoDuration(duration)

          // Send update every 1 second
          if (enrollment && time - lastUpdateRef.current >= 1) {
            void sendWatchTime(time, duration > 0 ? duration : undefined)
          }

          // Completion trigger (>=90%) for paid chapters only
          if (enrollment && duration > 0 && !currentChapter?.isPreview && !hasSentCompleteRef.current) {
            const pct = time / duration
            if (pct >= 0.9) {
              hasSentCompleteRef.current = true
              coursesApi.completeChapterEnrollment(String(courseId), String(currentChapter.id))
                .then(() => {
                  if (typeof (window as any).__onChapterComplete === 'function') {
                    ;(window as any).__onChapterComplete()
                  }
                })
                .catch((e) => {
                  console.error('Failed to complete chapter:', e)
                })
            }
          }
        } else if (data.method === 'getDuration' && data.value) {
          setVideoDuration(Number(data.value))
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    }

    window.addEventListener('message', handleMessage)

    // Try to enable API after a short delay (iframe may need time to load)
    const timeoutId = setTimeout(() => {
      enableApi()
    }, 1000)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(timeoutId)
    }
  }, [vimeoId, platform, currentChapter?.id, isChapterAccessible, enrollment, sendWatchTime])

  // Track watch time for native HTML5 video
  useEffect(() => {
    if (!isLocalFileVideo()) return
    if (!enrollment || !currentChapter?.id) return
    if (!isChapterAccessible(currentChapter?.id)) return

    const videoEl = htmlVideoRef.current
    if (!videoEl) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)

    videoEl.addEventListener('play', onPlay)
    videoEl.addEventListener('pause', onPause)
    videoEl.addEventListener('ended', onEnded)

    return () => {
      videoEl.removeEventListener('play', onPlay)
      videoEl.removeEventListener('pause', onPause)
      videoEl.removeEventListener('ended', onEnded)
    }
  }, [currentChapter?.id, enrollment, isChapterAccessible, isLocalFileVideo])

  // Track watch time when playing
  useEffect(() => {
    if (isLocalFileVideo() && enrollment && currentChapter?.id) {
      const videoEl = htmlVideoRef.current
      if (!videoEl) return

      intervalRef.current = setInterval(async () => {
        const currentTime = Number(videoEl.currentTime || 0)
        const duration = Number(videoEl.duration || 0)
        setWatchTime(currentTime)
        if (duration > 0) setVideoDuration(duration)

        if (isPlaying && currentTime - lastUpdateRef.current >= 1) {
          await sendWatchTime(currentTime, duration > 0 ? duration : undefined)
        }

        // Completion trigger (>=90%) for paid chapters only
        if (isPlaying && enrollment && duration > 0 && !currentChapter?.isPreview && !hasSentCompleteRef.current) {
          const pct = currentTime / duration
          if (pct >= 0.9) {
            try {
              hasSentCompleteRef.current = true
              await coursesApi.completeChapterEnrollment(String(courseId), String(currentChapter.id))
              if (typeof (window as any).__onChapterComplete === 'function') {
                ;(window as any).__onChapterComplete()
              }
            } catch (e) {
              console.error('Failed to complete chapter:', e)
            }
          }
        }
      }, 1000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }

    if (isPlaying && player && enrollment) {
      intervalRef.current = setInterval(async () => {
        try {
          const currentTime = await player.getCurrentTime()
          const duration = await player.getDuration()
          setWatchTime(currentTime)
          if (duration > 0) setVideoDuration(duration)

          // Send update every 1 second
          if (currentTime - lastUpdateRef.current >= 1) {
            await sendWatchTime(currentTime, duration > 0 ? duration : undefined)
          }

          // Completion trigger (>=90%) for paid chapters only
          if (enrollment && duration > 0 && !currentChapter?.isPreview && !hasSentCompleteRef.current) {
            const pct = currentTime / duration
            if (pct >= 0.9) {
              try {
                hasSentCompleteRef.current = true
                await coursesApi.completeChapterEnrollment(String(courseId), String(currentChapter.id))
                if (typeof (window as any).__onChapterComplete === 'function') {
                  ;(window as any).__onChapterComplete()
                }
              } catch (e) {
                console.error('Failed to complete chapter:', e)
              }
            }
          }
        } catch (error) {
          console.error('Error getting current time:', error)
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentChapter?.id, enrollment, isLocalFileVideo, isPlaying, player, sendWatchTime])

  // Send final watch time when chapter changes or component unmounts
  useEffect(() => {
    return () => {
      if (watchTime > lastUpdateRef.current && enrollment) {
        sendWatchTime(watchTime, videoDuration > 0 ? videoDuration : undefined)
      }
    }
  }, [currentChapter?.id, watchTime, enrollment, sendWatchTime, videoDuration])

  // Reset completion flag when chapter changes
  useEffect(() => {
    hasSentCompleteRef.current = false
  }, [currentChapter?.id])

  const chapterAccessible = currentChapter ? isChapterAccessible(currentChapter.id) : false
  // Show the video for preview chapters even when user isn't enrolled.
  const shouldShowLocked = !currentChapter?.videoUrl || (!chapterAccessible && !currentChapter?.isPreview)
  
  if (shouldShowLocked) {
    console.debug('[VideoPlayer] locked/preview render check', {
      chapterId: currentChapter?.id,
      videoUrl: currentChapter?.videoUrl,
      isPreview: currentChapter?.isPreview,
      enrollment,
      chapterAccessible,
    })
    return (
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="relative bg-black aspect-video">
          <div className="flex items-center justify-center h-full text-white bg-gray-800">
            <div className="text-center">
              {currentChapter?.isPreview && !enrollment ? (
                <>
                  <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Video Unavailable</p>
                  <p className="text-sm text-gray-300 mt-2">The video for this preview is currently unavailable.</p>
                </>
              ) : (
                <>
                  <Lock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  {currentChapter?.isPaidChapter ? (
                    <>
                      <p className="text-lg font-semibold">Payment Required</p>
                      <p className="text-sm text-gray-300 mt-2">You must pay to access this chapter.</p>
                      <Button className="mt-4" onClick={onEnrollNow}>
                        Enroll to Access
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold">Chapter Locked</p>
                      {enrollment ? (
                        <p className="text-sm text-gray-300 mt-2">Complete previous chapters to unlock this content.</p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-300 mt-2">Enroll in the course to access this content</p>
                          <Button className="mt-4" onClick={onEnrollNow}>
                            Enroll Now
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="relative bg-black aspect-video">
        {isLocalFileVideo() ? (
          <video
            ref={htmlVideoRef}
            src={videoUrl}
            controls
            preload="metadata"
            className="absolute inset-0 w-full h-full"
            onError={(e) => {
              console.error("❌ Video Player Error:", e);
              console.error("❌ Failed URL:", videoUrl);
            }}
          />
        ) : platform === 'youtube' && youtubeId ? (
          <div ref={playerRef} className="absolute inset-0 w-full h-full" />
        ) : platform === 'vimeo' && vimeoId ? (
          <iframe
            ref={vimeoIframeRef}
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=0&title=0&byline=0&portrait=0&api=1`}
            title={currentChapter.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <iframe
            src={videoUrl}
            title={currentChapter.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}

        {/* Watch time indicator (for tracking confirmation) */}
        {enrollment && watchTime > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${videoDuration > 0 ? (watchTime / videoDuration) * 100 : 0}%` }}
              />
            </div>
            <span>
              {Math.floor(watchTime / 60)}:{String(Math.floor(watchTime % 60)).padStart(2, '0')}
              {videoDuration > 0 && ` / ${Math.floor(videoDuration / 60)}:${String(Math.floor(videoDuration % 60)).padStart(2, '0')}`}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
