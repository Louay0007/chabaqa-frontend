"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref } from "@/lib/i18n/client"
import { Users, Zap, Heart, ArrowRight } from "lucide-react"

export function CommunitiesCTA() {
  const t = useTranslations("landing.explore.ctaCard")
  const pathname = usePathname()
  const withLocale = (href: string) => localizeHref(pathname, href)

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="border-0 shadow-2xl bg-gradient-to-r from-[#8e78fb] to-[#f65887] text-white overflow-hidden rounded-3xl">
            <div className="p-8 sm:p-12 text-center space-y-8">
              {/* Heading */}
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-bold">{t("title")}</h2>
                <p className="text-xl opacity-90 max-w-2xl mx-auto">
                  {t("subtitle")}
                </p>
              </div>

              {/* Three Pillars */}
              <div className="grid md:grid-cols-3 gap-6 my-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-2">{t("pillars.build.title")}</h3>
                  <p className="text-sm opacity-80">{t("pillars.build.subtitle")}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-2">{t("pillars.engage.title")}</h3>
                  <p className="text-sm opacity-80">{t("pillars.engage.subtitle")}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-2">{t("pillars.monetize.title")}</h3>
                  <p className="text-sm opacity-80">{t("pillars.monetize.subtitle")}</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={withLocale("/dashboard/create-community")}
                  className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-purple-600 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  {t("createCommunity")}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href={withLocale("/explore")}
                  className="inline-flex items-center justify-center border-2 border-white text-white hover:bg-white hover:text-purple-600 px-8 py-4 text-lg font-semibold rounded-xl bg-transparent backdrop-blur-sm transition-all duration-300"
                >
                  {t("learnMore")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
