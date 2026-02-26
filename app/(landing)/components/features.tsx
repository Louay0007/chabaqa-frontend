"use client"
import { siteData } from "@/lib/data"
import { useState } from "react"

export function Features() {
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0)

  const activeFeature = siteData.features[activeFeatureIndex]

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
      case "dms":
        return "bg-green-600 hover:bg-green-400 border-green-300"
      case "analytics":
        return "bg-teal-600 hover:bg-teal-700 border-teal-600"
      case "branding":
        return "bg-amber-600 hover:bg-amber-700 border-amber-600"
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
            {/* Gradient Fade Edges with Scroll Indicators */}
            <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-white via-white to-transparent pointer-events-none flex items-center">
              <div className="w-1 h-8 bg-gray-300 rounded-full ml-2 animate-pulse"></div>
            </div>
            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white via-white to-transparent pointer-events-none flex items-center justify-end">
              <div className="w-1 h-8 bg-gray-300 rounded-full mr-2 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start">
          {/* Desktop Sidebar - Scrollable */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 sticky top-4">
              <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-1">
                <div className="space-y-1.5">
                  {siteData.features.map((feature, index) => (
                    <button
                      key={feature.id}
                      onClick={() => setActiveFeatureIndex(index)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        index === activeFeatureIndex
                          ? `${getFeatureColor(feature.color)} text-white shadow-md`
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="font-semibold text-sm">{feature.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="relative flex items-center justify-center">
              <div className="relative group w-full max-w-3xl">
                {/* Animated border */}
                <div
                  className={`absolute -inset-1 rounded-2xl opacity-75 blur-sm animate-pulse ${
                    activeFeature.color === "community"
                      ? "bg-gradient-to-r from-chabaqa-primary via-blue-300 to-indigo-400"
                      : activeFeature.color === "course"
                        ? "bg-gradient-to-r from-[#47c7ea] via-cyan-300 to-blue-300"
                        : activeFeature.color === "challenge"
                          ? "bg-gradient-to-r from-[#ff9b28] via-orange-300 to-yellow-300"
                          : activeFeature.color === "product"
                            ? "bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-400"
                            : activeFeature.color === "oneToOne"
                              ? "bg-gradient-to-r from-[#f65887] via-pink-300 to-rose-500"
                              : activeFeature.color === "dms"
                                ? "bg-gradient-to-r from-green-300 via-emerald-200 to-teal-200"
                                : activeFeature.color === "analytics"
                                  ? "bg-gradient-to-r from-teal-300 via-cyan-200 to-blue-200"
                                  : activeFeature.color === "branding"
                                    ? "bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-200"
                                    : "bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-200"
                  }`}
                ></div>
                
                {/* Video container */}
                <div className="relative bg-white rounded-lg md:rounded-xl shadow-xl overflow-hidden">
                  <video
                    key={activeFeature.id}
                    src={activeFeature.video || "/placeholder.mp4"}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto object-cover"
                  >
                    <source src={activeFeature.video || "/placeholder.mp4"} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
