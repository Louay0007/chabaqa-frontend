"use client"

import { Button } from "@/components/ui/button"
import { Play, Sparkles, ArrowRight, Users, Zap } from "lucide-react"
import { Rocket, Gem, LifeBuoy, Calendar, BookOpen, Trophy, ShoppingBag, Video } from "lucide-react"
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface HeroProps {
  className?: string
}

export function Hero({ className }: HeroProps) {
  const [currentFeature, setCurrentFeature] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 6)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const featuresPlus = [
    { value: "6", label: "Features", icon: Rocket },
    { value: "Free", label: "To Start", icon: Gem },
    { value: "24/7", label: "Support", icon: LifeBuoy },
  ]

  const timelineData = [
    { id: 1, title: "Community", date: "Always Available", content: "Create, customize, and grow your own community space with powerful engagement tools and real-time interactions.", category: "Engagement", icon: Users, relatedIds: [2, 3], status: "completed" as const, energy: 100, image: "/community-platform.jpg" },
    { id: 2, title: "Courses", date: "Anytime Learning", content: "Build and sell structured learning paths with interactive chapters, quizzes, and comprehensive progress tracking.", category: "Learning", icon: BookOpen, relatedIds: [1, 4], status: "in-progress" as const, energy: 85, image: "/online-courses.jpg" },
    { id: 3, title: "Challenges", date: "Weekly Events", content: "Host interactive challenges and competitions to boost member engagement, retention, and community growth.", category: "Engagement", icon: Trophy, relatedIds: [1, 5], status: "in-progress" as const, energy: 75, image: "/challenges-competition.jpg" },
    { id: 4, title: "Products", date: "Anytime Sales", content: "Offer digital or physical products directly in your community with integrated payments and inventory management.", category: "Monetization", icon: ShoppingBag, relatedIds: [2, 6], status: "pending" as const, energy: 45, image: "/digital-products-store.jpg" },
    { id: 5, title: "1:1 Sessions", date: "On Demand", content: "Provide personalized coaching and mentoring sessions with built-in scheduling, payments, and video integration.", category: "Coaching", icon: Video, relatedIds: [3, 6], status: "pending" as const, energy: 55, image: "/video-coaching-session.jpg" },
    { id: 6, title: "Events", date: "Monthly Gatherings", content: "Organize live events, meetups, or webinars for your members with RSVP management and automated reminders.", category: "Events", icon: Calendar, relatedIds: [4, 5], status: "pending" as const, energy: 35, image: "/live-events-meetup.jpg" },
  ]

  return (
    <section
      className={cn(
        "relative bg-white overflow-hidden",
        // comfy vertical rhythm across breakpoints
        "py-16 sm:py-14 lg:py-20",
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
            <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[#8e78fb]/10 to-[#f65887]/10 rounded-full border border-[#8e78fb]/20 backdrop-blur-sm shadow-sm mt-1">
              <Sparkles className="w-4 h-4 text-[#8e78fb] mr-2 animate-spin" />
              <span className="text-xs sm:text-sm font-semibold text-[#8e78fb]">For Creators, By Creators</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                <span className="block">Turn your</span>
                <span className="bg-gradient-to-r from-[#8e78fb] via-[#f65887] to-[#ff9b28] bg-clip-text text-transparent">
                  passion into
                </span>
                <span className="block text-[#ff9b28]">business</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-xl leading-relaxed">
                Create, engage, and monetize your audience with the platform built for{" "}
                <span className="font-bold text-transparent bg-gradient-to-r from-[#8e78fb] to-[#ff9b28] bg-clip-text">
                  ambitious creators
                </span>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-chabaqa-primary text-white px-6 py-3 text-base sm:text-lg font-bold shadow-md hover:scale-105 transition-all duration-300 rounded-lg"
              >
                <Zap className="w-5 h-5 mr-2 animate-pulse" />
                Start Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#8e78fb] text-[#8e78fb] hover:bg-[#8e78fb] hover:text-white px-6 py-3 text-base sm:text-lg font-bold rounded-lg bg-transparent"
              >
                <Play className="w-5 h-5 mr-2" />
                Explore
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
          <div className="relative lg:pl-4">
            {/* Height is responsive; timeline adapts radius automatically */}
            <RadialOrbitalTimeline
              timelineData={timelineData}
              logoSrc="/Logos/PNG/brandmark.png"
              className="h-[470px] sm:h-[520px] lg:h-[680px]"
              autoRotateSpeed={0.25}
              orbitRadius={200} // initial; component will adapt with ResizeObserver
            />
          </div>
        </div>
      </div>
    </section>
  )
}
