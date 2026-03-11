"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Play, Sparkles, ArrowRight, Users, Zap } from "lucide-react"
import { Rocket, Gem, LifeBuoy, Calendar, BookOpen, Trophy, ShoppingBag, Video } from "lucide-react"
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref } from "@/lib/i18n/client"

interface HeroProps {
  className?: string
}

export function Hero({ className }: HeroProps) {
  const [currentFeature, setCurrentFeature] = useState(0)
  const t = useTranslations("landing.hero")
  const pathname = usePathname()
  const withLocale = (href: string) => localizeHref(pathname, href)
  const isArabic = pathname === "/ar" || pathname.startsWith("/ar/")

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 6)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const featuresPlus = [
    { value: "6", label: t("stats.features"), icon: Rocket },
    { value: t("stats.freeValue"), label: t("stats.toStart"), icon: Gem },
    { value: "24/7", label: t("stats.support"), icon: LifeBuoy },
  ]

  const timelineData = [
    { id: 1, title: t("timeline.community.title"), date: t("timeline.community.date"), content: t("timeline.community.content"), category: t("timeline.community.category"), icon: Users, relatedIds: [2, 3], status: "completed" as const, energy: 100, image: "/hero/community.webp" },
    { id: 2, title: t("timeline.courses.title"), date: t("timeline.courses.date"), content: t("timeline.courses.content"), category: t("timeline.courses.category"), icon: BookOpen, relatedIds: [1, 4], status: "in-progress" as const, energy: 85, image: "/hero/course.webp" },
    { id: 3, title: t("timeline.challenges.title"), date: t("timeline.challenges.date"), content: t("timeline.challenges.content"), category: t("timeline.challenges.category"), icon: Trophy, relatedIds: [1, 5], status: "in-progress" as const, energy: 75, image: "/hero/challenge.webp" },
    { id: 4, title: t("timeline.products.title"), date: t("timeline.products.date"), content: t("timeline.products.content"), category: t("timeline.products.category"), icon: ShoppingBag, relatedIds: [2, 6], status: "pending" as const, energy: 45, image: "/hero/product.webp" },
    { id: 5, title: t("timeline.sessions.title"), date: t("timeline.sessions.date"), content: t("timeline.sessions.content"), category: t("timeline.sessions.category"), icon: Video, relatedIds: [3, 6], status: "pending" as const, energy: 55, image: "/hero/session.webp" },
    { id: 6, title: t("timeline.events.title"), date: t("timeline.events.date"), content: t("timeline.events.content"), category: t("timeline.events.category"), icon: Calendar, relatedIds: [4, 5], status: "pending" as const, energy: 35, image: "/hero/event.webp" },
  ]

  return (
    <section
      className={cn(
        "relative bg-white overflow-hidden",
        className,
      )}
    >
      {/* BG blobs (lighter on mobile) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-4 sm:left-10 w-28 h-28 sm:w-44 sm:h-44 bg-gradient-to-br from-[#8e78fb]/20 to-[#f65887]/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-10 right-4 sm:right-10 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-br from-[#47c7ea]/20 to-[#ff9b28]/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left content */}
          <div className="space-y-6 lg:pr-6">
            <div
              className={cn(
                "inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[#8e78fb]/10 to-[#f65887]/10 rounded-full border border-[#8e78fb]/20 backdrop-blur-sm shadow-sm mt-1",
                isArabic && "flex-row-reverse"
              )}
            >
              <Sparkles className={cn("w-4 h-4 text-[#8e78fb] animate-spin", isArabic ? "ml-2" : "mr-2")} />
              <span className="text-xs sm:text-sm font-semibold text-[#8e78fb]">{t("badge")}</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                <span className="block">{t("headlineLine1")}</span>
                <span className="bg-gradient-to-r from-[#8e78fb] via-[#f65887] to-[#ff9b28] bg-clip-text text-transparent">
                  {t("headlineLine2")}
                </span>
                <span className="block text-[#ff9b28]">{t("headlineLine3")}</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-xl leading-relaxed">
                {t("descriptionPrefix")}{" "}
                <span className="font-bold text-transparent bg-gradient-to-r from-[#8e78fb] to-[#ff9b28] bg-clip-text">
                  {t("descriptionHighlight")}
                </span>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-chabaqa-primary text-white px-6 py-3 text-base sm:text-lg font-bold shadow-md hover:scale-105 transition-all duration-300 rounded-lg"
              >
                <Link href={withLocale("/signin")} className="flex items-center gap-2">
                  <Zap className="w-5 h-5 mr-2 animate-pulse" />
                  {t("startFree")}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
 
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-[#8e78fb] text-[#8e78fb] hover:bg-[#8e78fb] hover:text-white px-6 py-3 text-base sm:text-lg font-bold rounded-lg bg-transparent"
              >
                <Link href={withLocale("/explore")}>
                  <Play className="w-5 h-5 mr-2" />
                  {t("explore")}
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6">
              {featuresPlus.map((feature, i) => (
                <div key={i} className="text-center space-y-1.5 sm:space-y-2 group cursor-pointer">
                  <div className="flex justify-center mb-0.5 sm:mb-1 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#8e78fb]" />
                  </div>
                  <div className="text-lg sm:text-xl font-black bg-gradient-to-r from-[#8e78fb] to-[#ff9b28] bg-clip-text text-transparent">
                    {feature.value}
                  </div>
                  <div className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {feature.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: responsive timeline */}
          <div className="relative lg:pl-4 hidden lg:block">
            <RadialOrbitalTimeline
              timelineData={timelineData}
              logoSrc="/Logos/PNG/brandmark.png"
              className="h-[470px] sm:h-[520px] lg:h-[600px]"
              autoRotateSpeed={0.25}
              orbitRadius={200}
            />
          </div>


        </div>
      </div>
    </section>
  )
}
