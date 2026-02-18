"use client"
import { Check } from "lucide-react"
import { siteData } from "@/lib/data"
import Image from "next/image"
import { useState } from "react"

export function Features() {
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0)
  const [activeBadges, setActiveBadges] = useState(
    siteData.features.reduce(
      (acc, _, index) => {
        acc[index] = 0
        return acc
      },
      {} as Record<number, number>,
    ),
  )
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && activeFeatureIndex < siteData.features.length - 1) {
      setActiveFeatureIndex(activeFeatureIndex + 1)
    }
    if (isRightSwipe && activeFeatureIndex > 0) {
      setActiveFeatureIndex(activeFeatureIndex - 1)
    }
  }

  const setActiveBadge = (featureIndex: number, badgeIndex: number) => {
    setActiveBadges((prev) => ({
      ...prev,
      [featureIndex]: badgeIndex,
    }))
  }

  const activeFeature = siteData.features[activeFeatureIndex]
  const activeBadge = activeBadges[activeFeatureIndex] || 0
  const currentBadge = activeFeature.badges[activeBadge]

  const getBlobStyles = (featureIndex: number) => {
    const positions = [
      {
        blob1: "top-10 left-4 md:top-20 md:left-10",
        blob2: "bottom-10 right-4 md:bottom-20 md:right-10",
        blob3: "top-1/2 right-8 md:top-1/2 md:right-1/4",
      },
      {
        blob1: "top-8 right-8 md:top-16 md:right-16",
        blob2: "bottom-8 left-8 md:bottom-16 md:left-16",
        blob3: "top-1/3 left-1/4 md:top-1/3 md:left-1/3",
      },
      {
        blob1: "top-1/2 left-4 md:top-1/2 md:left-8",
        blob2: "top-6 left-1/2 md:top-12 md:left-1/2",
        blob3: "bottom-12 right-6 md:bottom-24 md:right-12",
      },
      {
        blob1: "bottom-8 left-1/2 md:bottom-16 md:left-1/2",
        blob2: "top-12 left-10 md:top-24 md:left-20",
        blob3: "top-1/2 right-4 md:top-1/2 md:right-8",
      },
      {
        blob1: "top-10 right-6 md:top-20 md:right-12",
        blob2: "top-1/2 left-6 md:top-1/2 md:left-12",
        blob3: "bottom-10 left-1/2 md:bottom-20 md:left-1/2",
      },
      {
        blob1: "top-16 left-1/4 md:top-32 md:left-1/4",
        blob2: "bottom-16 right-1/4 md:bottom-32 md:right-1/4",
        blob3: "top-1/2 right-8 md:top-1/2 md:right-16",
      },
    ]

    const colors = [
      {
        blob1: "from-[#3b82f6]/20 to-[#1d4ed8]/15",
        blob2: "from-[#6366f1]/20 to-[#4f46e5]/15",
        blob3: "from-[#8b5cf6]/15 to-[#7c3aed]/10",
      },
      {
        blob1: "from-[#47c7ea]/20 to-[#0891b2]/15",
        blob2: "from-[#06b6d4]/20 to-[#0e7490]/15",
        blob3: "from-[#22d3ee]/15 to-[#0284c7]/10",
      },
      {
        blob1: "from-[#ff9b28]/20 to-[#ea580c]/15",
        blob2: "from-[#f97316]/20 to-[#c2410c]/15",
        blob3: "from-[#fb923c]/15 to-[#dc2626]/10",
      },
      {
        blob1: "from-[#8e78fb]/20 to-[#7c3aed]/15",
        blob2: "from-[#a855f7]/20 to-[#9333ea]/15",
        blob3: "from-[#c084fc]/15 to-[#8b5cf6]/10",
      },
      {
        blob1: "from-[#f65887]/20 to-[#ec4899]/15",
        blob2: "from-[#f472b6]/20 to-[#db2777]/15",
        blob3: "from-[#fb7185]/15 to-[#be185d]/10",
      },
      {
        blob1: "from-[#6366f1]/20 to-[#8b5cf6]/15",
        blob2: "from-[#4f46e5]/20 to-[#7c3aed]/15",
        blob3: "from-[#8b5cf6]/15 to-[#a855f7]/10",
      },
    ]

    return {
      positions: positions[featureIndex] || positions[0],
      colors: colors[featureIndex] || colors[0],
    }
  }

  const blobStyles = getBlobStyles(activeFeatureIndex)

  const getFeatureColor = (color: string) => {
    switch (color) {
      case "community":
        return "bg-chabaqa-primary hover:bg-chabaqa-primary/90 border-chabaqa-primary"
      case "course":
        return "bg-chabaqa-courses hover:bg-chabaqa-courses/90 border-chabaqa-courses"
      case "challenge":
        return "bg-chabaqa-challenges hover:bg-chabaqa-challenges/90 border-chabaqa-challenges"
      case "product":
        return "bg-purple-600 hover:bg-purple-700 border-purple-600"
      case "oneToOne":
        return "bg-chabaqa-sessions hover:bg-chabaqa-sessions/90 border-chabaqa-sessions"
      case "event":
        return "bg-indigo-600 hover:bg-indigo-700 border-indigo-600"
      default:
        return "bg-blue-600 hover:bg-blue-700 border-blue-600"
    }
  }

  return (
    <div id="features" className="py-8 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-8 md:mb-12 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive suite of tools designed to enhance your experience
          </p>
        </div>

        {/* Mobile Feature Selector - Horizontal Scroll */}
        <div className="lg:hidden mb-1">
          <div className="relative -mx-4 px-4">
            <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              <div className="flex gap-2 pb-2">
                {siteData.features.map((feature, index) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeatureIndex(index)}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg transition-all duration-300 snap-start ${
                      index === activeFeatureIndex
                        ? `${getFeatureColor(feature.color)} text-white shadow-md transform scale-105`
                        : "bg-white border border-gray-200 text-gray-700 active:scale-95"
                    }`}
                  >
                    <div className="font-semibold text-xs whitespace-nowrap">{feature.title}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Gradient Fade Edges */}
            <div className="absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-white via-white to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-white via-white to-transparent pointer-events-none"></div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:sticky lg:top-24">
              <div className="space-y-2">
                {siteData.features.map((feature, index) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeatureIndex(index)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                      index === activeFeatureIndex
                        ? `${getFeatureColor(feature.color)} text-white shadow-md`
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div className="font-semibold text-sm md:text-base">{feature.title}</div>
                    <div
                      className={`text-xs md:text-sm mt-1 line-clamp-2 ${
                        index === activeFeatureIndex ? "text-white/90" : "text-gray-500"
                      }`}
                    >
                      {feature.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative lg:sticky lg:top-24">
            {/* Mobile Navigation Arrows - Compact */}
            <div className="lg:hidden flex justify-between items-center mb-3">
              <button
                onClick={() => setActiveFeatureIndex(Math.max(0, activeFeatureIndex - 1))}
                disabled={activeFeatureIndex === 0}
                className={`p-1.5 rounded-lg transition-all ${
                  activeFeatureIndex === 0
                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                    : "bg-white border border-gray-200 text-gray-600 active:scale-90 shadow-sm"
                }`}
                aria-label="Previous feature"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-1.5">
                {siteData.features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeatureIndex(index)}
                    className={`transition-all duration-300 rounded-full ${
                      index === activeFeatureIndex
                        ? "w-6 h-1.5 " + (
                            activeFeature.color === "community"
                              ? "bg-chabaqa-primary"
                              : activeFeature.color === "course"
                                ? "bg-chabaqa-courses"
                                : activeFeature.color === "challenge"
                                  ? "bg-chabaqa-challenges"
                                  : activeFeature.color === "product"
                                    ? "bg-purple-600"
                                    : activeFeature.color === "oneToOne"
                                      ? "bg-chabaqa-sessions"
                                      : "bg-indigo-600"
                          )
                        : "w-1.5 h-1.5 bg-gray-300"
                    }`}
                    aria-label={`Go to feature ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setActiveFeatureIndex(Math.min(siteData.features.length - 1, activeFeatureIndex + 1))}
                disabled={activeFeatureIndex === siteData.features.length - 1}
                className={`p-1.5 rounded-lg transition-all ${
                  activeFeatureIndex === siteData.features.length - 1
                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                    : "bg-white border border-gray-200 text-gray-600 active:scale-90 shadow-sm"
                }`}
                aria-label="Next feature"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <section
              id={`${activeFeature.href?.split("/#")[1] || activeFeature.id}`}
              className="relative bg-white overflow-hidden rounded-2xl h-full touch-pan-y"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div
                  key={`blob-${activeFeatureIndex}`}
                  className="absolute inset-0 transition-opacity duration-500"
                >
                  <div
                    className={`absolute w-32 h-32 md:w-60 md:h-60 bg-gradient-to-br ${blobStyles.colors.blob1} rounded-full blur-2xl animate-pulse ${blobStyles.positions.blob1}`}
                  ></div>
                  <div
                    className={`absolute w-28 h-28 md:w-52 md:h-52 bg-gradient-to-br ${blobStyles.colors.blob2} rounded-full blur-2xl animate-pulse ${blobStyles.positions.blob2}`}
                    style={{ animationDelay: "1s" }}
                  ></div>
                  <div
                    className={`absolute w-24 h-24 md:w-40 md:h-40 bg-gradient-to-br ${blobStyles.colors.blob3} rounded-full blur-2xl animate-pulse ${blobStyles.positions.blob3}`}
                    style={{ animationDelay: "2s" }}
                  ></div>
                </div>
              </div>

              <div className="relative p-4 sm:p-6 md:p-8 h-full flex flex-col transition-all duration-300">
                <div className="mb-3 md:mb-6 animate-fadeIn">
                  <h3 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">
                    {activeFeature.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">
                    {activeFeature.description}
                  </p>
                </div>

                <div className="mb-3 md:mb-6">
                  <div className="overflow-x-auto scrollbar-hide pb-2">
                    <div className="flex gap-1.5 md:gap-2 min-w-max md:flex-wrap md:min-w-0">
                      {activeFeature.badges.map((badge, badgeIndex) => (
                        <button
                          key={badge.id}
                          onClick={() => setActiveBadge(activeFeatureIndex, badgeIndex)}
                          className={`flex-shrink-0 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 border touch-manipulation min-h-[36px] md:min-h-[40px] flex items-center ${
                            badgeIndex === activeBadge
                              ? `${getFeatureColor(activeFeature.color)} text-white shadow-md`
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200"
                          }`}
                        >
                          {badge.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className={`bg-gradient-to-br ${activeFeature.bgGradient} rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 flex-1`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 h-full">
                    <div className="space-y-3 md:space-y-5 order-2 lg:order-1 flex flex-col">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm md:text-base text-gray-700 mb-2 md:mb-4 leading-relaxed">
                          Discover powerful features designed to enhance your experience.
                        </p>

                        <div className="space-y-1.5 md:space-y-3 mb-3 md:mb-4">
                          {currentBadge.features.map((featureItem, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div
                                className={`flex-shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center mt-0.5 ${
                                  activeFeature.color === "community"
                                    ? "bg-chabaqa-primary"
                                    : activeFeature.color === "course"
                                      ? "bg-chabaqa-courses"
                                      : activeFeature.color === "challenge"
                                        ? "bg-chabaqa-challenges"
                                        : activeFeature.color === "product"
                                          ? "bg-purple-600"
                                          : activeFeature.color === "oneToOne"
                                            ? "bg-chabaqa-sessions"
                                            : "bg-indigo-600"
                                }`}
                              >
                                <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                              </div>
                              <span className="text-xs sm:text-sm md:text-sm text-gray-700 font-medium leading-relaxed">
                                {featureItem}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/70 rounded-lg md:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/50">
                        <blockquote className="text-xs sm:text-sm md:text-sm text-gray-700 mb-2 md:mb-3 leading-relaxed italic">
                          "{currentBadge.testimonial.quote}"
                        </blockquote>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${
                              activeFeature.color === "community"
                                ? "from-chabaqa-primary to-indigo-300"
                                : activeFeature.color === "course"
                                  ? "from-[#47c7ea] to-[#86e4fd]"
                                  : activeFeature.color === "challenge"
                                    ? "from-[#ff9b28] to-[#fddab0]"
                                    : activeFeature.color === "product"
                                      ? "from-purple-500 to-indigo-600"
                                      : activeFeature.color === "oneToOne"
                                        ? "from-[#f65887] to-[#fddab0]"
                                        : "from-indigo-500 to-purple-600"
                            }`}
                          >
                            <span className="text-white font-semibold text-xs">
                              {currentBadge.testimonial.author
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-xs sm:text-sm">
                              {currentBadge.testimonial.author}
                            </div>
                            <div className="text-xs text-gray-600">
                              {currentBadge.testimonial.title}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative order-1 lg:order-2 flex items-center">
                      <div className="relative bg-white rounded-lg md:rounded-xl shadow-lg md:shadow-xl overflow-hidden w-full">
                        <Image
                          src={currentBadge.image || "/placeholder.svg?height=400&width=600"}
                          alt={`${currentBadge.label} interface`}
                          width={600}
                          height={400}
                          className="w-full h-auto object-cover"
                          priority={activeFeatureIndex === 0}
                        />
                      </div>
                      <div
                        className={`absolute -top-1 -right-1 md:-top-2 md:-right-2 w-10 h-10 md:w-16 md:h-16 rounded-full blur-xl ${
                          activeFeature.color === "community"
                            ? "bg-blue-500/20"
                            : activeFeature.color === "course"
                              ? "bg-[#47c7ea]/20"
                              : activeFeature.color === "challenge"
                                ? "bg-[#ff9b28]/20"
                                : activeFeature.color === "product"
                                  ? "bg-purple-500/20"
                                  : activeFeature.color === "oneToOne"
                                    ? "bg-[#f65887]/20"
                                    : "bg-indigo-500/20"
                        }`}
                      ></div>
                      <div
                        className={`absolute -bottom-1 -left-1 md:-bottom-2 md:-left-2 w-12 h-12 md:w-20 md:h-20 rounded-full blur-xl ${
                          activeFeature.color === "community"
                            ? "bg-indigo-500/15"
                            : activeFeature.color === "course"
                              ? "bg-blue-500/15"
                              : activeFeature.color === "challenge"
                                ? "bg-yellow-500/15"
                                : activeFeature.color === "product"
                                  ? "bg-purple-500/15"
                                  : activeFeature.color === "oneToOne"
                                    ? "bg-rose-500/15"
                                    : "bg-purple-500/15"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
