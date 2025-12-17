"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import confetti from "canvas-confetti"
import NumberFlow from "@number-flow/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { siteData } from "@/lib/data"

type Billing = "monthly" | "yearly"

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly")
  const plans = siteData.pricing.plans

  // Confetti on yearly
  useEffect(() => {
    if (billing === "yearly") {
      confetti({ particleCount: 80, spread: 60, startVelocity: 45, origin: { x: 0.5, y: 0.35 } })
    }
  }, [billing])

  // --- Mobile carousel state (more robust indication)
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(0)
  const [step, setStep] = useState(0)

  // Measure step (card width + gap)
  useEffect(() => {
    const el = sliderRef.current
    if (!el) return
    const first = el.children[0] as HTMLElement | undefined
    const styles = getComputedStyle(el)
    const gap =
      parseFloat((styles as any).gap || "0") ||
      parseFloat((styles as any)["column-gap"] || "0") ||
      16
    if (first) setStep(first.getBoundingClientRect().width + gap)
  }, [plans?.length])

  // Scroll listener -> set active index precisely
  useEffect(() => {
    const el = sliderRef.current
    if (!el || !step) return
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / step)
      const clamped = Math.max(0, Math.min(plans.length - 1, idx))
      setActive(clamped)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [step, plans.length])

  const goTo = (i: number) => {
    const el = sliderRef.current
    if (!el || !step) return
    const clamped = Math.max(0, Math.min(plans.length - 1, i))
    el.scrollTo({ left: clamped * step, behavior: "smooth" })
  }
  const scrollByOne = (dir: "left" | "right") => goTo(active + (dir === "left" ? -1 : 1))

  const atStart = active === 0
  const atEnd = active === plans.length - 1

  return (
    <section id="pricing" className="py-20 bg-white relative">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-4 md:top-20 md:right-10 w-32 h-32 md:w-60 md:h-60 bg-gradient-to-br from-[#3b82f6]/20 to-[#1d4ed8]/15 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-10 left-4 md:bottom-20 md:left-10 w-28 h-28 md:w-52 md:h-52 bg-gradient-to-br from-[#8b5cf6]/20 to-[#7c3aed]/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-40 md:h-40 bg-gradient-to-br from-[#06b6d4]/15 to-[#0284c7]/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{siteData.pricing.title}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{siteData.pricing.subtitle}</p>
        </div>

        {/* Billing switch */}
        <div className="flex items-center justify-center mb-6 sm:mb-10">
          <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition ${billing === "monthly" ? "bg-chabaqa-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}
              aria-pressed={billing === "monthly"}
              type="button"
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition ${billing === "yearly" ? "bg-chabaqa-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}
              aria-pressed={billing === "yearly"}
              type="button"
            >
              Yearly
            </button>
          </div>

          {/* Desktop savings badge */}
          <SaveBadge plans={plans} billing={billing} />
        </div>

        {/* Mobile savings mini badge (better indication) */}
        <MobileSaveBadge plans={plans} billing={billing} />




        {/* Pricing cards: mobile carousel (smaller) + desktop grid */}
        <div
          ref={sliderRef}
          className="
            flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-4 px-4 md:mx-0 md:px-0
            [scrollbar-width:none] [-ms-overflow-style:none]
            md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:snap-none md:pb-0
            max-w-6xl mx-auto
          "
          style={{ scrollbarWidth: "none" } as any}
          aria-live="polite"
          aria-roledescription="carousel"
          aria-label="Pricing plans"
        >
          <style>{`#pricing ::-webkit-scrollbar{ display:none; height:0; width:0 }`}</style>
            
          {plans.map((plan: any, i: number) => {
            const hasToggle = !!plan.prices
            const currentPrice = hasToggle ? (billing === "monthly" ? plan.prices.monthly : plan.prices.yearly) : plan.price
            const period = hasToggle ? (billing === "monthly" ? "/mo" : "/yr") : plan.period ?? ""
            const perMonth = hasToggle && billing === "yearly" ? plan.prices.yearly / 12 : null

            return (
              <Card
                key={i}
                aria-label={`Plan ${plan.name}`}
                className={`
                  relative min-w-[70%] sm:min-w-[58%] snap-center border-2 bg-white/80
                  md:min-w-0 md:w-full
                  ${plan.popular ? "border-chabaqa-primary shadow-xl md:scale-[1.02]" : "border-gray-200 shadow-lg"}
                `}
              >
                {/* Popular badge – safer position on mobile */}
                {plan.popular && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2">
                    <span className="bg-chabaqa-primary text-white px-3 py-0.5 rounded-full text-xs sm:text-sm font-medium shadow">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6 sm:pb-8">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 mt-4 sm:mt-6">
                    {plan.name}
                  </CardTitle>

                  <div className="mt-3 sm:mt-4 flex items-end justify-center gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900 leading-none">
                      {typeof currentPrice === "number" ? (
                        <NumberFlow value={currentPrice} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
                      ) : (
                        currentPrice
                      )}
                    </span>
                    {period && <span className="text-gray-600 text-base sm:text-lg pb-1">{period}</span>}
                  </div>

                  {perMonth != null && (
                    <div className="mt-1 text-xs sm:text-sm text-gray-500">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">
                        ≈ <NumberFlow value={perMonth} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} /> /mo
                      </span>
                    </div>
                  )}

                  {plan.description && (
                    <CardDescription className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base line-clamp-2">
                      {plan.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 sm:space-y-6">
                  <ul className="space-y-2 sm:space-y-3">
                    {plan.features.map((f: string, idx: number) => (
                      <li key={idx} className="flex items-center">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-chabaqa-primary mr-2 sm:mr-3 flex-shrink-0" />
                        <span className="text-gray-700 text-sm sm:text-base">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full py-2.5 sm:py-3 text-sm sm:text-base ${
                      plan.popular
                        ? "bg-chabaqa-primary hover:bg-chabaqa-primary/90 text-white"
                        : "bg-chabaqa-accent hover:bg-chabaqa-accent/90 text-white"
                    }`}
                    onClick={() => window.open("#", "_blank")}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Mobile pagination dots + numeric indicator (fixed indication) */}
        <div className="md:hidden flex flex-col items-center gap-2 mt-4">
          <div className="flex justify-center gap-2">
            {plans.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1.5 w-4 rounded-full transition-all ${
                  active === i ? "bg-chabaqa-primary w-6" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          
        </div>
      </div>
    </section>
  )
}

function SaveBadge({ plans, billing }: { plans: any[]; billing: Billing }) {
  const best = useMemo(() => {
    const arr: number[] = []
    for (const p of plans) {
      if (p.prices?.monthly && p.prices?.yearly) {
        const m = p.prices.monthly
        const y = p.prices.yearly
        if (m > 0 && y > 0) {
          const pct = 1 - y / (m * 12)
          if (pct > 0 && isFinite(pct)) arr.push(pct)
        }
      }
    }
    if (!arr.length) return null
    return Math.round(Math.max(...arr) * 100)
  }, [plans])

  if (best == null) return null

  return (
    <div
      className={`ml-4 hidden sm:flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 transition ${
        billing === "yearly" ? "bg-green-50 text-green-700 ring-green-200" : "bg-gray-50 text-gray-600 ring-gray-200"
      }`}
    >
      {billing === "yearly" ? `You’re saving up to ${best}%` : `Save up to ${best}% with yearly`}
    </div>
  )
}

function MobileSaveBadge({ plans, billing }: { plans: any[]; billing: Billing }) {
  const best = useMemo(() => {
    const arr: number[] = []
    for (const p of plans) {
      if (p.prices?.monthly && p.prices?.yearly) {
        const m = p.prices.monthly
        const y = p.prices.yearly
        if (m > 0 && y > 0) {
          const pct = 1 - y / (m * 12)
          if (pct > 0 && isFinite(pct)) arr.push(pct)
        }
      }
    }
    if (!arr.length) return null
    return Math.round(Math.max(...arr) * 100)
  }, [plans])

  if (best == null) return null
  return (
    <div
      className={`sm:hidden flex w-fit mx-auto mb-3 items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition ${
        billing === "yearly"
          ? "bg-green-50 text-green-700 ring-green-200"
          : "bg-gray-50 text-gray-600 ring-gray-200"
      }`}
    >
      {billing === "yearly" ? `Saving up to ${best}%` : `Save up to ${best}% yearly`}
    </div>

  )
}
