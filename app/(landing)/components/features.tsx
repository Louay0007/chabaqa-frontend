"use client"
import { Check } from "lucide-react"
import { siteData } from "@/lib/data"
import Image from "next/image"
import { useState } from "react"

export function Features() {
  const [activeBadges, setActiveBadges] = useState(
    siteData.features.reduce(
      (acc, _, index) => {
        acc[index] = 0
        return acc
      },
      {} as Record<number, number>,
    ),
  )

  const setActiveBadge = (featureIndex: number, badgeIndex: number) => {
    setActiveBadges((prev) => ({
      ...prev,
      [featureIndex]: badgeIndex,
    }))
  }

  return (
    <div id="features" className="py-8 md:py-16 space-y-16 md:space-y-24">
      {siteData.features.map((feature, featureIndex) => {
        const activeBadge = activeBadges[featureIndex] || 0
        const currentBadge = feature.badges[activeBadge]

        const getBlobStyles = (featureIndex: number) => {
          const positions = [
            // Community - mobile optimized positions
            {
              blob1: "top-10 left-4 md:top-20 md:left-10",
              blob2: "bottom-10 right-4 md:bottom-20 md:right-10",
              blob3: "top-1/2 right-8 md:top-1/2 md:right-1/4",
            },
            // Course - mobile optimized positions
            {
              blob1: "top-8 right-8 md:top-16 md:right-16",
              blob2: "bottom-8 left-8 md:bottom-16 md:left-16",
              blob3: "top-1/3 left-1/4 md:top-1/3 md:left-1/3",
            },
            // Challenge - mobile optimized positions
            {
              blob1: "top-1/2 left-4 md:top-1/2 md:left-8",
              blob2: "top-6 left-1/2 md:top-12 md:left-1/2",
              blob3: "bottom-12 right-6 md:bottom-24 md:right-12",
            },
            // Product - mobile optimized positions
            {
              blob1: "bottom-8 left-1/2 md:bottom-16 md:left-1/2",
              blob2: "top-12 left-10 md:top-24 md:left-20",
              blob3: "top-1/2 right-4 md:top-1/2 md:right-8",
            },
            // OneToOne - mobile optimized positions
            {
              blob1: "top-10 right-6 md:top-20 md:right-12",
              blob2: "top-1/2 left-6 md:top-1/2 md:left-12",
              blob3: "bottom-10 left-1/2 md:bottom-20 md:left-1/2",
            },
            // Event - mobile optimized positions
            {
              blob1: "top-16 left-1/4 md:top-32 md:left-1/4",
              blob2: "bottom-16 right-1/4 md:bottom-32 md:right-1/4",
              blob3: "top-1/2 right-8 md:top-1/2 md:right-16",
            },
          ]

          const colors = [
            // Community - blue tones
            {
              blob1: "from-[#3b82f6]/20 to-[#1d4ed8]/15",
              blob2: "from-[#6366f1]/20 to-[#4f46e5]/15",
              blob3: "from-[#8b5cf6]/15 to-[#7c3aed]/10",
            },
            // Course - cyan tones
            {
              blob1: "from-[#47c7ea]/20 to-[#0891b2]/15",
              blob2: "from-[#06b6d4]/20 to-[#0e7490]/15",
              blob3: "from-[#22d3ee]/15 to-[#0284c7]/10",
            },
            // Challenge - orange tones
            {
              blob1: "from-[#ff9b28]/20 to-[#ea580c]/15",
              blob2: "from-[#f97316]/20 to-[#c2410c]/15",
              blob3: "from-[#fb923c]/15 to-[#dc2626]/10",
            },
            // Product - purple tones
            {
              blob1: "from-[#8e78fb]/20 to-[#7c3aed]/15",
              blob2: "from-[#a855f7]/20 to-[#9333ea]/15",
              blob3: "from-[#c084fc]/15 to-[#8b5cf6]/10",
            },
            // OneToOne - pink tones
            {
              blob1: "from-[#f65887]/20 to-[#ec4899]/15",
              blob2: "from-[#f472b6]/20 to-[#db2777]/15",
              blob3: "from-[#fb7185]/15 to-[#be185d]/10",
            },
            // Event - indigo/purple gradient
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

        const blobStyles = getBlobStyles(featureIndex)

        return (
          <section
            key={feature.id}
            id={`${feature.href?.split("/#")[1] || feature.id}`}
            className="relative flex items-center bg-white overflow-hidden"
          >
            <div className="absolute inset-0 overflow-hidden">
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

            <div className="relative w-full">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="mb-8 md:mb-16">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 text-balance">
                    {feature.title}
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-4xl leading-relaxed text-pretty">
                    {feature.description}
                  </p>
                </div>

                <div className="mb-8 md:mb-12">
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-2 min-w-max md:flex-wrap md:min-w-0">
                      {feature.badges.map((badge, badgeIndex) => {
                        const getActiveBadgeStyle = () => {
                          switch (feature.color) {
                            case "community":
                              return "bg-chabaqa-primary text-white border-chabaqa-primary"
                            case "course":
                              return "bg-chabaqa-courses text-white border-chabaqa-courses"
                            case "challenge":
                              return "bg-chabaqa-challenges text-white border-chabaqa-challenges"
                            case "product":
                              return "bg-purple-600 text-white border-purple-600"
                            case "oneToOne":
                              return "bg-chabaqa-sessions text-white border-chabaqa-sessions"
                            case "event":
                              return "bg-indigo-600 text-white border-indigo-600"
                            default:
                              return "bg-blue-600 text-white border-blue-600"
                          }
                        }

                        return (
                          <button
                            key={badge.id}
                            onClick={() => setActiveBadge(featureIndex, badgeIndex)}
                            className={`flex-shrink-0 px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm font-medium transition-all duration-200 border touch-manipulation min-h-[44px] flex items-center ${badgeIndex === activeBadge
                                ? getActiveBadgeStyle() + " shadow-md"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200"
                              }`}
                          >
                            {badge.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div
                  className={`bg-gradient-to-br ${feature.bgGradient} rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
                    <div className="space-y-6 md:space-y-8 order-2 lg:order-1">
                      <div>
                        <p className="text-base md:text-lg text-gray-700 mb-4 md:mb-6 leading-relaxed">
                          Discover powerful features designed to enhance your experience.
                        </p>

                        <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                          {currentBadge.features.map((featureItem, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div
                                className={`flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center mt-0.5 ${feature.color === "community"
                                    ? "bg-chabaqa-primary"
                                    : feature.color === "course"
                                      ? "bg-chabaqa-courses"
                                      : feature.color === "challenge"
                                        ? "bg-chabaqa-challenges"
                                        : feature.color === "product"
                                          ? "bg-purple-600"
                                          : feature.color === "oneToOne"
                                            ? "bg-chabaqa-sessions"
                                            : "bg-indigo-600"
                                  }`}
                              >
                                <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                              </div>
                              <span className="text-sm md:text-base text-gray-700 font-medium leading-relaxed">
                                {featureItem}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/70 rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/50">
                        <blockquote className="text-sm md:text-base text-gray-700 mb-3 md:mb-4 leading-relaxed">
                          "{currentBadge.testimonial.quote}"
                        </blockquote>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${feature.color === "community"
                                ? "from-chabaqa-primary to-indigo-300"
                                : feature.color === "course"
                                  ? "from-[#47c7ea] to-[#86e4fd]"
                                  : feature.color === "challenge"
                                    ? "from-[#ff9b28] to-[#fddab0]"
                                    : feature.color === "product"
                                      ? "from-purple-500 to-indigo-600"
                                      : feature.color === "oneToOne"
                                        ? "from-[#f65887] to-[#fddab0]"
                                        : "from-indigo-500 to-purple-600"
                              }`}
                          >
                            <span className="text-white font-semibold text-xs md:text-sm">
                              {currentBadge.testimonial.author
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm md:text-base">
                              {currentBadge.testimonial.author}
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">{currentBadge.testimonial.title}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative order-1 lg:order-2">
                      <div className="relative bg-white rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl overflow-hidden">
                        <Image
                          src={currentBadge.image || "/placeholder.svg?height=400&width=600"}
                          alt={`${currentBadge.label} interface`}
                          width={600}
                          height={400}
                          className="w-full h-auto object-cover"
                          priority={featureIndex === 0}
                        />
                      </div>
                      <div
                        className={`absolute -top-2 -right-2 md:-top-4 md:-right-4 w-12 h-12 md:w-20 md:h-20 rounded-full blur-xl ${feature.color === "community"
                            ? "bg-blue-500/20"
                            : feature.color === "course"
                              ? "bg-[#47c7ea]/20"
                              : feature.color === "challenge"
                                ? "bg-[#ff9b28]/20"
                                : feature.color === "product"
                                  ? "bg-purple-500/20"
                                  : feature.color === "oneToOne"
                                    ? "bg-[#f65887]/20"
                                    : "bg-indigo-500/20"
                          }`}
                      ></div>
                      <div
                        className={`absolute -bottom-2 -left-2 md:-bottom-4 md:-left-4 w-16 h-16 md:w-24 md:h-24 rounded-full blur-xl ${feature.color === "community"
                            ? "bg-indigo-500/15"
                            : feature.color === "course"
                              ? "bg-blue-500/15"
                              : feature.color === "challenge"
                                ? "bg-yellow-500/15"
                                : feature.color === "product"
                                  ? "bg-purple-500/15"
                                  : feature.color === "oneToOne"
                                    ? "bg-rose-500/15"
                                    : "bg-purple-500/15"
                          }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
