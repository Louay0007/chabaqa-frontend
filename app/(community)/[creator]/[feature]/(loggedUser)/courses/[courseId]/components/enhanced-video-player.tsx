"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
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
  onWatchTimeUpdate?: (seconds: number, duration?: number) => void
  onEnrollNow?: () => void
  /** Called after watch time is saved so parent can refetch progress (e.g. when enrollment was auto-created). */
  onProgressSaved?: () => void
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
  onProgressSaved,
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
  const vimeoReady = useRef(false) // Changed to ref to avoid re-renders
  const [isVimeoReady, setIsVimeoReady] = useState(false)

  const rawVideoUrl = currentChapter?.videoUrl || ''

  // Normalize URL for local playback
  // For localhost development: keep the full URL with port 3000
  // For production with Nginx proxy: use relative paths
  const videoUrl = useMemo(() => {
    if (!rawVideoUrl) return ''
    
    // Check if it's a local upload
    if (rawVideoUrl.includes('/uploads/')) {
       try {
         // If it's a localhost URL, keep it absolute (for development)
         if (rawVideoUrl.startsWith('http://localhost:') || rawVideoUrl.startsWith('http://127.0.0.1:')) {
           console.log('🔧 [VideoPlayer] Keeping absolute localhost URL:', rawVideoUrl)
           return rawVideoUrl
         }
         
         // If it's a full URL (production), strip origin to force relative path
         if (rawVideoUrl.startsWith('http')) {
            const urlObj = new URL(rawVideoUrl);
            const relativePath = urlObj.pathname + urlObj.search;
            console.log('🔧 [VideoPlayer] Converting to relative path:', relativePath)
            return relativePath;
         }
         
         // Ensure it starts with /
         if (!rawVideoUrl.startsWith('/')) return '/' + rawVideoUrl;
         return rawVideoUrl;
       } catch (e) {
         console.error('❌ [VideoPlayer] URL parsing error:', e)
         // Fallback regex if URL parsing fails
         const match = rawVideoUrl.match(/(\/uploads\/.*)/);
         if (match) return match[1];
         return rawVideoUrl;
       }
    }
    return rawVideoUrl;
  }, [rawVideoUrl])

  const platform = detectPlatform(videoUrl)
  const youtubeId = platform === 'youtube' ? extractYouTubeId(videoUrl) : null
  const vimeoId = platform === 'vimeo' ? extractVimeoId(videoUrl) : null

  const storageKey = useMemo(() => {
    if (!courseId || !currentChapter?.id) return null;
    return `course_progress_${courseId}_${currentChapter.id}`;
  }, [courseId, currentChapter?.id]);

  // Saved watch position (seconds) from enrollment/progression (used to resume)
  const savedWatchPosition = useMemo(() => {
    if (!currentChapter?.id || !enrollment?.progress) return 0
    const chapterProgress = enrollment.progress.find((p: any) => String(p.chapterId) === String(currentChapter.id))
    const serverPosition = Number((chapterProgress && (chapterProgress as any).watchTime) ?? 0)
    
    // Check LocalStorage for a potentially newer position
    if (typeof window !== 'undefined' && storageKey) {
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        try {
          const { time, timestamp } = JSON.parse(localData);
          // Only use local position if it's recent (e.g., last 24 hours) or the server has 0
          if (time > serverPosition) {
            console.log(`📍 [VideoPlayer] Resuming from LocalStorage: ${time}s (Server had ${serverPosition}s)`);
            return time;
          }
        } catch (e) {
          localStorage.removeItem(storageKey);
        }
      }
    }
    
    return serverPosition;
  }, [currentChapter?.id, enrollment?.progress, storageKey])

  // Initial UX sync: Notify parent about the saved position immediately on mount
  useEffect(() => {
    if (savedWatchPosition > 0 && onWatchTimeUpdate && currentChapter?.id) {
      const chapterProgress = enrollment?.progress?.find((p: any) => String(p.chapterId) === String(currentChapter.id))
      const duration = Number((chapterProgress && (chapterProgress as any).videoDuration) || currentChapter.duration || 0)
      
      console.log(`🚀 [VideoPlayer] Initial UX Sync: Notifying parent of saved position ${savedWatchPosition}s`);
      onWatchTimeUpdate(savedWatchPosition, duration > 0 ? duration : undefined);
      
      // Also update local state to avoid flicker
      setWatchTime(savedWatchPosition);
      if (duration > 0) setVideoDuration(duration);
    }
  }, [currentChapter?.id]); // Only run when chapter changes

  const isLocalFileVideo = useCallback(() => {
    const safeUrl = String(videoUrl || '')
    if (!safeUrl) return false
    // URLs containing /uploads/ are local files. 
    // We check for both /uploads/video/ and just /uploads/ for flexibility.
    if (safeUrl.includes('/uploads/')) return true
    // Common CDN / storage hosts that often serve direct video files
    if (/s3\.amazonaws\.com|\.cloudfront\.net|storage\.googleapis\.com|blob\.core\.windows\.net|cdn\./i.test(safeUrl)) {
      return true
    }
    // File extension check (with optional query string)
    return /\.(mp4|webm|mov|avi|mkv|3gp)(\?.*)?$/i.test(safeUrl)
  }, [videoUrl])

  // Diagnostic logging
  useEffect(() => {
    if (videoUrl) {
      console.log(`🎬 [VideoPlayer] Loading: "${currentChapter?.titre || currentChapter?.title}"`)
      console.log(`🔗 Raw URL: ${rawVideoUrl}`)
      console.log(`🔗 Playable URL: ${videoUrl}`)
      console.log(`🛠️ Type: ${isLocalFileVideo() ? 'Local File' : platform}`)
    }
  }, [videoUrl, rawVideoUrl, currentChapter, platform, isLocalFileVideo])

  // Send watch time to backend (throttled via lastUpdateRef). Now sends more frequently (per-second), guarded by isSendingRef.
  const isSendingRef = useRef<boolean>(false)
  const hasSentCompleteRef = useRef<boolean>(false)

  const sendWatchTime = useCallback(async (time: number, duration?: number) => {
    if (!currentChapter?.id) return
    if (isSendingRef.current) return
    isSendingRef.current = true
    const hadEnrollment = Boolean(enrollment)

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
        onWatchTimeUpdate(Math.floor(time), duration ? Math.floor(duration) : undefined)
      }
      // Refetch progress when backend may have auto-created enrollment so UI gets it
      if (!hadEnrollment && onProgressSaved) {
        onProgressSaved()
      }
    } catch (error) {
      console.error('Failed to update watch time:', error)
    } finally {
      isSendingRef.current = false
    }
  }, [courseId, currentChapter?.id, enrollment, onWatchTimeUpdate, onProgressSaved])

  // Initialize YouTube Player
  useEffect(() => {
    if (platform !== 'youtube' || !youtubeId || !playerRef.current) return
    // Allow initializing YouTube player for preview chapters even when not enrolled.
    if (!isChapterAccessible(currentChapter?.id) && !currentChapter?.isPreview) return

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
          onReady: (event: any) => {
            // Resume position if available
            if (savedWatchPosition && savedWatchPosition > 0) {
              try {
                event.target.seekTo(savedWatchPosition, true)
                lastUpdateRef.current = savedWatchPosition
                setWatchTime(savedWatchPosition)
              } catch (e) {
                // ignore seek errors
              }
            }
          },
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
    // Allow initializing Vimeo player for preview chapters even when not enrolled.
    if (!isChapterAccessible(currentChapter?.id) && !currentChapter?.isPreview) return

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
          vimeoReady.current = true
          setIsVimeoReady(true)
          enableApi()
          // Seek to saved position if available
          if (savedWatchPosition && savedWatchPosition > 0) {
            try {
              iframeWindow.postMessage(JSON.stringify({ method: 'setCurrentTime', value: savedWatchPosition }), '*')
              lastUpdateRef.current = savedWatchPosition
              setWatchTime(savedWatchPosition)
            } catch (e) {
              // ignore
            }
          }
        } else if (data.event === 'play') {
          setIsPlaying(true)
        } else if (data.event === 'pause') {
          setIsPlaying(false)
        } else if (data.event === 'timeupdate' && data.data) {
          const time = Number(data.data.seconds || 0)
          const duration = Number(data.data.duration || 0)
          setWatchTime(time)
          if (duration > 0) setVideoDuration(duration)

          // Immediately notify parent so UI can update optimistically per-second
          if (onWatchTimeUpdate) {
            try {
              onWatchTimeUpdate(Math.floor(time), duration > 0 ? Math.floor(duration) : undefined)
            } catch (e) {
              // ignore
            }
          }

          // Send update every 1 second (backend can auto-create enrollment)
          if (time - lastUpdateRef.current >= 1) {
            // Check High-Water Mark: Only send if we've passed the max stored time
            const localData = storageKey ? localStorage.getItem(storageKey) : null;
            let maxStored = savedWatchPosition;
            if (localData) {
               try { maxStored = Math.max(maxStored, JSON.parse(localData).time || 0); } catch(e){}
            }
            
            if (time > maxStored) {
               void sendWatchTime(time, duration > 0 ? duration : undefined)
            }
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
    const accessAllowed = (currentChapter?.id ? isChapterAccessible(currentChapter?.id) : false) || !!currentChapter?.isPreview
    if (!accessAllowed) return

    const videoEl = htmlVideoRef.current
    if (!videoEl) return

    const onTimeUpdate = () => {
      const currentTime = videoEl.currentTime;
      const duration = videoEl.duration;
      
      // Update local state for current playback
      setWatchTime(currentTime);
      if (duration > 0) setVideoDuration(duration);

      // --- HIGH WATER MARK LOGIC ---
      // We calculate the maximum time reached across all storage layers
      let maxStoredTime = savedWatchPosition; // Start with backend/initial load value
      
      if (storageKey) {
        const localData = localStorage.getItem(storageKey);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            maxStoredTime = Math.max(maxStoredTime, parsed.time || 0);
          } catch (e) {}
        }
      }

      // The effective progress is the maximum of current time and anything previously saved
      const effectiveMaxTime = Math.max(maxStoredTime, Math.floor(currentTime));

      // Notify parent with the HIGH WATER MARK for UI/UX stability (sidebar, header, etc)
      if (onWatchTimeUpdate) {
        onWatchTimeUpdate(effectiveMaxTime, duration > 0 ? Math.floor(duration) : undefined);
      }

      // Update LocalStorage Mirror (Only if current time is actually greater)
      if (storageKey && Math.floor(currentTime) > maxStoredTime) {
        localStorage.setItem(storageKey, JSON.stringify({
          time: Math.floor(currentTime),
          timestamp: Date.now()
        }));
      }

      // --- AUTO-COMPLETION RECOVERY ---
      // If High-Water Mark is already >= 90% (e.g. from local storage), ensure we mark it complete
      // This handles the "I already completed it" case where backend might have missed it.
      if (enrollment && duration > 0 && !currentChapter?.isPreview && !hasSentCompleteRef.current) {
         // Check if effective max time is enough to complete
         if (effectiveMaxTime / duration >= 0.9) {
            hasSentCompleteRef.current = true;
            console.log(`✅ [VideoPlayer] High-Water Mark (${effectiveMaxTime}s) triggered completion recovery`);
            coursesApi.completeChapterEnrollment(String(courseId), String(currentChapter.id))
              .then(() => {
                if (typeof (window as any).__onChapterComplete === 'function') {
                  (window as any).__onChapterComplete();
                }
              })
              .catch(e => console.error("Completion recovery failed", e));
         }
      }

      // Throttled sync to backend (every 5 seconds) - ONLY if advancing beyond high-water mark
      if (currentTime - lastUpdateRef.current >= 5 && Math.floor(currentTime) > maxStoredTime) {
        sendWatchTime(currentTime, duration > 0 ? duration : undefined);
      }

      // Standard Completion check (Live Playback)
      // (This is redundant if the block above catches it, but kept for safety during active play)
      if (enrollment && duration > 0 && !currentChapter?.isPreview && !hasSentCompleteRef.current) {
        if (currentTime / duration >= 0.9) {
          hasSentCompleteRef.current = true;
          coursesApi.completeChapterEnrollment(String(courseId), String(currentChapter.id))
            .then(() => {
              if (typeof (window as any).__onChapterComplete === 'function') {
                (window as any).__onChapterComplete();
              }
            });
        }
      }
    };

    videoEl.addEventListener('timeupdate', onTimeUpdate);
    
    // Resume position
    const onLoadedMetadataResume = () => {
      const videoEl = htmlVideoRef.current;
      if (!videoEl) return;

      console.log(`📍 [VideoPlayer] Metadata loaded. Duration: ${videoEl.duration}s, Target resume: ${savedWatchPosition}s`);

      if (savedWatchPosition > 0) {
        // If the video is shorter than the saved position (rare), seek to the end minus a small buffer
        const seekTime = Math.min(savedWatchPosition, videoEl.duration - 0.5);
        
        try {
          videoEl.currentTime = seekTime;
          lastUpdateRef.current = seekTime;
          setWatchTime(seekTime);
          console.log(`✅ [VideoPlayer] Successfully resumed to ${seekTime}s`);
        } catch (e) {
          console.error('❌ [VideoPlayer] Seek failed:', e);
        }
      }
    };

    videoEl.addEventListener('loadedmetadata', onLoadedMetadataResume);

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)

    videoEl.addEventListener('play', onPlay)
    videoEl.addEventListener('pause', onPause)
    videoEl.addEventListener('ended', onEnded)

    return () => {
      videoEl.removeEventListener('timeupdate', onTimeUpdate);
      videoEl.removeEventListener('play', onPlay)
      videoEl.removeEventListener('pause', onPause)
      videoEl.removeEventListener('ended', onEnded)
      videoEl.removeEventListener('loadedmetadata', onLoadedMetadataResume)
    }
  }, [currentChapter?.id, enrollment, isChapterAccessible, isLocalFileVideo, storageKey, savedWatchPosition, sendWatchTime, onWatchTimeUpdate, courseId]);

  // Track watch time when playing (run even without enrollment so backend can auto-create it)
  useEffect(() => {
    if (isLocalFileVideo() && currentChapter?.id) {
      const videoEl = htmlVideoRef.current
      if (!videoEl) return

      intervalRef.current = setInterval(async () => {
        const currentTime = Number(videoEl.currentTime || 0)
        const duration = Number(videoEl.duration || 0)
        setWatchTime(currentTime)
        if (duration > 0) setVideoDuration(duration)

        // Notify parent immediately for per-second UI updates
        if (onWatchTimeUpdate) {
          try {
            onWatchTimeUpdate(Math.floor(currentTime), duration > 0 ? Math.floor(duration) : undefined)
          } catch (e) {
            // ignore
          }
        }

        if (isPlaying && currentTime - lastUpdateRef.current >= 1) {
           // High-Water Mark Check
           const localData = storageKey ? localStorage.getItem(storageKey) : null;
           let maxStored = savedWatchPosition;
           if (localData) {
              try { maxStored = Math.max(maxStored, JSON.parse(localData).time || 0); } catch(e){}
           }

           if (currentTime > maxStored) {
              await sendWatchTime(currentTime, duration > 0 ? duration : undefined)
           }
        }

        // Completion trigger (>=90%) for paid chapters only (requires enrollment to exist)
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

    if (isPlaying && player && currentChapter?.id) {
      intervalRef.current = setInterval(async () => {
        try {
          const currentTime = await player.getCurrentTime()
          const duration = await player.getDuration()
          setWatchTime(currentTime)
          if (duration > 0) setVideoDuration(duration)

          // Immediately notify parent for per-second UI updates
          if (onWatchTimeUpdate) {
            try {
              onWatchTimeUpdate(Math.floor(currentTime), duration > 0 ? Math.floor(duration) : undefined)
            } catch (e) {
              // ignore
            }
          }

          // Send update every 1 second
          if (currentTime - lastUpdateRef.current >= 1) {
             // Check High-Water Mark for YouTube/Vimeo too
             const localData = storageKey ? localStorage.getItem(storageKey) : null;
             let maxStored = savedWatchPosition;
             if (localData) {
                try { maxStored = Math.max(maxStored, JSON.parse(localData).time || 0); } catch(e){}
             }

             if (currentTime > maxStored) {
               await sendWatchTime(currentTime, duration > 0 ? duration : undefined)
             }
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

  // Final sync on tab close / navigation
  useEffect(() => {
    if (!courseId || !currentChapter?.id || !watchTime) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveFinalProgress();
      }
    };

    const handleBeforeUnload = () => {
      saveFinalProgress();
    };

    const saveFinalProgress = () => {
      if (!currentChapter?.id) return;

      // UX Fix: Only save if we are actually at or beyond the saved/max position
      // This prevents sending redundant requests when the user is re-watching
      const localData = localStorage.getItem(storageKey || '');
      let maxTime = savedWatchPosition;
      if (localData) {
        try { maxTime = Math.max(maxTime, JSON.parse(localData).time); } catch (e) {}
      }

      if (Math.floor(watchTime) < maxTime) {
        console.log(`ℹ️ [VideoPlayer] Skipping final sync: Current time ${Math.floor(watchTime)}s is below max reached ${maxTime}s`);
        return;
      }
      
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const endpoint = `${backendUrl}/course-enrollment/${courseId}/chapters/${currentChapter.id}/watch-time`;
      
      const payload = JSON.stringify({
        watchTime: Math.floor(watchTime),
        videoDuration: videoDuration > 0 ? Math.floor(videoDuration) : undefined
      });

      // Use sendBeacon for reliable delivery on tab close
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [courseId, currentChapter?.id, watchTime, videoDuration]);

  // Reset completion flag when chapter changes
  useEffect(() => {
    hasSentCompleteRef.current = false
  }, [currentChapter?.id])

  const chapterAccessible = currentChapter ? isChapterAccessible(currentChapter.id) : false
  
  // Check if video URL is valid (not empty string)
  const hasValidVideoUrl = Boolean(
    currentChapter?.videoUrl && 
    typeof currentChapter.videoUrl === 'string' && 
    currentChapter.videoUrl.trim() !== ''
  );
  
  // Show the video for preview chapters even when user isn't enrolled.
  const shouldShowLocked = !hasValidVideoUrl || (!chapterAccessible && !currentChapter?.isPreview)
  
  if (shouldShowLocked) {
    console.debug('[VideoPlayer] locked/preview render check', {
      chapterId: currentChapter?.id,
      videoUrl: currentChapter?.videoUrl,
      hasValidVideoUrl,
      isPreview: currentChapter?.isPreview,
      enrollment,
      chapterAccessible,
    })

    const isAccessDenied = !chapterAccessible && !currentChapter?.isPreview
    const isVideoMissing = !hasValidVideoUrl

    return (
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="relative bg-black aspect-video">
          <div className="flex items-center justify-center h-full text-white bg-gray-800">
            <div className="text-center">
              {isVideoMissing ? (
                <>
                  <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Video Unavailable</p>
                  <p className="text-sm text-gray-300 mt-2">The video for this chapter is currently unavailable.</p>
                  <p className="text-xs text-gray-400 mt-1">Please contact the course creator to upload the video content.</p>
                </>
              ) : isAccessDenied ? (
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
              ) : null}
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
            key={videoUrl} // Force re-render when URL changes
            ref={htmlVideoRef}
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full"
            onError={(e) => {
              console.error("❌ Video Player Error:", e);
              console.error("❌ Failed URL:", videoUrl);
              console.error("❌ Original URL:", rawVideoUrl);
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

        {/* Watch time indicator (for tracking confirmation) - Only show when advancing BEYOND high-water mark */}
        {enrollment && watchTime > savedWatchPosition && watchTime > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ 
                  width: `${videoDuration > 0 ? (watchTime / videoDuration) * 100 : 0}%` 
                }}
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
