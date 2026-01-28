"use client"

import { Button } from "@/components/ui/button"
import { Play, X } from "lucide-react"
import { siteData } from "@/lib/data"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"

export function About() {
  const [isVideoExpanded, setIsVideoExpanded] = useState(false)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  // Close modal on ESC
  useEffect(() => {
    if (!isVideoExpanded) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsVideoExpanded(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isVideoExpanded])

  // Lock background scroll when modal open (mobile friendly)
  useEffect(() => {
    if (!isVideoExpanded) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [isVideoExpanded])

  return (
    <section
      id="about"
      className={cn(
        "relative bg-white overflow-hidden",
        "py-12 sm:py-16 lg:py-20",
        "md:min-h-[80vh] lg:min-h-screen"
      )}
    >
      {/* Video Modal (with transition) */}
      {isVideoExpanded && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 animate-in fade-in duration-300"
          role="dialog"
          aria-modal="true"
          aria-label="About video"
          onClick={(e) => {
            if (e.target === overlayRef.current) setIsVideoExpanded(false)
          }}
          style={{
            paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
            paddingRight: "max(0.75rem, env(safe-area-inset-right))",
            paddingTop: "max(0.75rem, env(safe-area-inset-top))",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <div
            className="relative w-full max-w-screen-xl md:max-w-5xl lg:max-w-6xl mx-4 sm:mx-8 animate-in zoom-in-95 fade-in duration-300 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsVideoExpanded(false)}
              aria-label="Close video"
              className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[60] text-white"
              style={{ background: "transparent", border: "none", padding: 0, lineHeight: 0 }}
            >
              <X className="w-8 h-8" />
            </button>


            <div className="w-full max-w-full aspect-video h-auto rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
               <iframe
                src="https://youtu.be/xf5Gvfpo330"
                title="About Us Video - Expanded"
                className="w-full h-full max-h-[80vh]"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              
            </div>
          </div>
        </div>
      )}

      {/* Background blobs (smaller on mobile) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-8 left-3 sm:top-12 sm:left-8 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-br from-[#8e78fb]/20 to-[#f65887]/20 rounded-full blur-2xl animate-pulse" />
        <div
          className="absolute bottom-10 right-3 sm:bottom-16 sm:right-8 w-20 h-20 sm:w-36 sm:h-36 bg-gradient-to-br from-[#47c7ea]/20 to-[#ff9b28]/15 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center mb-10 lg:mb-16">
          {/* Video teaser */}
          <div className="relative order-1 lg:order-none">
            <div
              className="aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl bg-gray-900 cursor-pointer group"
              onClick={() => setIsVideoExpanded(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setIsVideoExpanded(true)}
              aria-label="Play demo video"
            >
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/90 rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 ml-0.5" />
                </div>
              </div>

              {/* <iframe
                src="https://youtu.be/xf5Gvfpo330"
                title="About Us Video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              /> */}
                            <Image
              src="/coming-soon/soon-cover.png"
              alt="About Us Video"
              fill
              className="object-cover rounded-2xl"
              loading="lazy"
            />
            </div>
            <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-[#8e78fb]/10 to-[#f65887]/10 rounded-2xl sm:rounded-3xl -z-10" />
          </div>

          {/* Text + CTAs */}
          <div className="space-y-5 sm:space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 text-balance">
                {siteData.about.title}
              </h1>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                {siteData.about.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#8e78fb] to-[#f65887] hover:from-[#7c6bfa] hover:to-[#f54d7a] text-white px-6 sm:px-8 py-2.5 sm:py-3 text-base"
              >
                Get Started Today
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-gray-300 hover:border-[#8e78fb] px-6 sm:px-8 py-2.5 sm:py-3 bg-transparent text-base"
                onClick={() => setIsVideoExpanded(true)}
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}