"use client"

import { useState, useRef, useEffect, useCallback, memo } from "react"
import { Play, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface Video {
  id: string
  thumbnail: string
  duration: string
}

const videos: Video[] = [
  {
    id: "EmuPphacf0k",
    thumbnail: "https://i.ytimg.com/vi/EmuPphacf0k/hqdefault.jpg",
    duration: "3:10"
  },
  {
    id: "sEXWWLlhuqA",
    thumbnail: "https://i.ytimg.com/vi/sEXWWLlhuqA/hqdefault.jpg",
    duration: "2:59"
  },
  {
    id: "PyHE0D9pWFU",
    thumbnail: "https://i.ytimg.com/vi/PyHE0D9pWFU/hqdefault.jpg",
    duration: "3:39"
  },
  {
    id: "tmnUakwzMpQ",
    thumbnail: "https://i.ytimg.com/vi/tmnUakwzMpQ/hqdefault.jpg",
    duration: "3:06"
  },
  {
    id: "YXoqN0vRLe8",
    thumbnail: "https://i.ytimg.com/vi/YXoqN0vRLe8/hqdefault.jpg",
    duration: "1:51"
  },
  {
    id: "Om87N_xrcfQ",
    thumbnail: "https://i.ytimg.com/vi/Om87N_xrcfQ/hqdefault.jpg",
    duration: "1:45"
  },
]

const VideoCard = memo(({ video, onClick, thumbnailAlt }: { video: Video; onClick: () => void; thumbnailAlt: string }) => {
  const [imgError, setImgError] = useState(false)
  
  return (
    <div
      className="flex-shrink-0 w-[280px] sm:w-[340px] lg:w-[380px] group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        {/* Animated gradient border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#8e78fb] via-[#f65887] to-[#ff9b28] rounded-2xl opacity-0 group-hover:opacity-75 blur-sm transition-opacity duration-300" />
        
        {/* Card */}
        <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-gray-900 shadow-lg group-hover:shadow-2xl transition-all duration-300">
          <img
            src={imgError ? `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg` : video.thumbnail}
            alt={thumbnailAlt}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#8e78fb]/30 rounded-full blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Play className="h-7 w-7 sm:h-9 sm:w-9 text-[#8e78fb] ml-1" fill="currentColor" />
              </div>
            </div>
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-lg">
            {video.duration}
          </div>
        </div>
      </div>
    </div>
  )
})

VideoCard.displayName = "VideoCard"

const NavButton = memo(({ 
  direction, 
  show, 
  onClick,
  ariaLabel
}: { 
  direction: "left" | "right"
  show: boolean
  onClick: () => void 
  ariaLabel: string
}) => {
  if (!show) return null
  
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white shadow-xl border-2 border-gray-200 hover:border-[#8e78fb] hover:bg-[#8e78fb] hover:text-white transition-all hidden lg:flex",
        direction === "left" ? "-left-5" : "-right-5"
      )}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {direction === "left" ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
    </Button>
  )
})

NavButton.displayName = "NavButton"

export function YouTubeVideos() {
  const t = useTranslations("landing.videos")
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 10)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }, [])

  useEffect(() => {
    checkScroll()
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    scrollElement.addEventListener("scroll", checkScroll, { passive: true })
    window.addEventListener("resize", checkScroll, { passive: true })
    
    return () => {
      scrollElement.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [checkScroll])

  const scrollContainer = useCallback((direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }, [])

  const handleVideoClick = useCallback((videoId: string) => {
    setSelectedVideo(videoId)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedVideo(null)
  }, [])

  return (
    <section className="relative bg-white overflow-hidden py-12 sm:py-16 lg:py-20" aria-label={t("sectionAriaLabel")}>
      {/* Background blobs - matching other sections */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-8 left-3 sm:top-12 sm:left-8 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-br from-[#8e78fb]/20 to-[#f65887]/20 rounded-full blur-2xl animate-pulse" />
        <div
          className="absolute bottom-10 right-3 sm:bottom-16 sm:right-8 w-20 h-20 sm:w-36 sm:h-36 bg-gradient-to-br from-[#47c7ea]/20 to-[#ff9b28]/15 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header - matching Features section style */}
        <div className="mb-8 md:mb-12 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t("title")}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Videos Scroll */}
        <div className="relative">
          <NavButton 
            direction="left" 
            show={showLeftArrow} 
            onClick={() => scrollContainer("left")}
            ariaLabel={t("scrollLeft")}
          />
          <NavButton 
            direction="right" 
            show={showRightArrow} 
            onClick={() => scrollContainer("right")}
            ariaLabel={t("scrollRight")}
          />

          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-5 lg:gap-6 overflow-x-auto scrollbar-hide scroll-smooth py-4"
            role="list"
          >
            {videos.map((video, index) => (
              <VideoCard
                key={`${video.id}-${index}`}
                video={video}
                onClick={() => handleVideoClick(video.id)}
                thumbnailAlt={t("thumbnailAlt")}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Video Modal - matching About section modal style */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-5xl rounded-lg sm:rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
            style={{ aspectRatio: '16/9' }}
          >
            <button
              onClick={handleCloseModal}
              className="absolute -top-10 right-0 sm:-top-12 sm:right-0 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-900 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
              aria-label={t("closeVideo")}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0`}
              title={t("playerTitle")}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}

