"use client"
import { Check } from "lucide-react"
import { siteData } from "@/lib/data"
import Image from "next/image"
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

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-center">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
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
                  </button>
                ))}
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
                      ? "bg-gradient-to-r from-chabaqa-primary via-blue-500 to-indigo-600"
                      : activeFeature.color === "course"
                        ? "bg-gradient-to-r from-[#47c7ea] via-cyan-500 to-blue-500"
                        : activeFeature.color === "challenge"
                          ? "bg-gradient-to-r from-[#ff9b28] via-orange-500 to-yellow-500"
                          : activeFeature.color === "product"
                            ? "bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600"
                            : activeFeature.color === "oneToOne"
                              ? "bg-gradient-to-r from-[#f65887] via-pink-500 to-rose-500"
                              : "bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500"
                  }`}
                ></div>
                
                {/* Image container */}
                <div className="relative bg-white rounded-xl md:rounded-2xl shadow-2xl overflow-hidden">
                  <Image
                    src={activeFeature.image || "/placeholder.svg?height=500&width=700"}
                    alt={`${activeFeature.title} interface`}
                    width={700}
                    height={500}
                    className="w-full h-auto object-cover"
                    priority={activeFeatureIndex === 0}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
