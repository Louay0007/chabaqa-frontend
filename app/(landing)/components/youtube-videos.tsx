"use client"

import { useState, useRef, useEffect, useCallback, memo } from "react"
import { Play, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Video {
  id: string
  thumbnail: string
  duration: string
}

const videos: Video[] = [
  {
    id: "dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "5:30"
  },
  {
    id: "dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "8:45"
  },
  {
    id: "dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "6:20"
  },
  {
    id: "dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "7:15"
  },
  {
    id: "dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "9:00"
  },
]

const VideoCard = memo(({ video, onClick }: { video: Video; onClick: () => void }) => (
  <div
    className="flex-shrink-0 w-[280px] sm:w-[340px] lg:w-[380px] group cursor-pointer"
    onClick={onClick}
  >
    <div className="relative">
      {/* Animated gradient border */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#8e78fb] via-[#f65887] to-[#ff9b28] rounded-2xl opacity-0 group-hover:opacity-75 blur-sm transition-opacity duration-300" />
      
      {/* Card */}
      <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-lg group-hover:shadow-2xl transition-all duration-300">
        <img
          src={video.thumbnail}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
          loading="lazy"
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
))

VideoCard.displayName = "VideoCard"

const NavButton = memo(({ 
  direction, 
  show, 
  onClick 
}: { 
  direction: "left" | "right"
  show: boolean
  onClick: () => void 
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
      aria-label={`Scroll ${direction}`}
    >
      {direction === "left" ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
    </Button>
  )
})

NavButton.displayName = "NavButton"

export function YouTubeVideos() {
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
    <section className="relative bg-white overflow-hidden py-12 sm:py-16 lg:py-20" aria-label="Video tutorials">
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
            Learn from Videos
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Watch tutorials and discover features to help you build your community
          </p>
        </div>

        {/* Videos Scroll */}
        <div className="relative">
          <NavButton 
            direction="left" 
            show={showLeftArrow} 
            onClick={() => scrollContainer("left")} 
          />
          <NavButton 
            direction="right" 
            show={showRightArrow} 
            onClick={() => scrollContainer("right")} 
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
              />
            ))}
          </div>
        </div>
      </div>

      {/* Video Modal - matching About section modal style */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 animate-in fade-in duration-300"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-6xl aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              className="absolute -top-12 right-0 sm:top-4 sm:right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110"
              aria-label="Close video"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0`}
              title="YouTube video player"
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


