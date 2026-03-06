"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react"
import { siteData } from "@/lib/data"
import { COOKIE_OPEN_PREFERENCES_EVENT } from "@/components/cookie-consent-provider"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref } from "@/lib/i18n/client"

const iconMap = {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
}

export function Footer() {
  const t = useTranslations("landing.footer")
  const pathname = usePathname()
  const withLocale = (href: string) => localizeHref(pathname, href)
  const isArabic = pathname === "/ar" || pathname.startsWith("/ar/")

  const openCookiePreferences = () => {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent(COOKIE_OPEN_PREFERENCES_EVENT))
  }

  const productLinks = [
    { href: "/explore", label: t("links.product.explore") },
    { href: "/#features", label: t("links.product.features") },
    { href: "/#pricing", label: t("links.product.pricing") },
  ]

  const companyLinks = [
    { href: "/#about", label: t("links.company.about") },
    { href: "/terms-of-service", label: t("links.company.terms") },
    { href: "/privacy-policy", label: t("links.company.privacy") },
  ]

  const legalLinks = companyLinks.filter((link) =>
    ["/terms-of-service", "/privacy-policy"].includes(link.href)
  )

  return (
    <footer className="bg-gradient-to-t from-pink-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Brand - Mobile First */}
        <div className="mb-8 text-center lg:hidden">
          <Link href={withLocale("/")} className="mb-3 inline-block" aria-label={siteData.brand.name}>
            <Image
              src="/Logos/PNG/frensh1.png"
              alt="Chabaqa Logo"
              width={120}
              height={22}
              priority
              style={{ objectFit: "contain" }}
            />
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {/* Brand - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <Link href={withLocale("/")} className="mb-4 block" aria-label={siteData.brand.name}>
              <Image
                src="/Logos/PNG/frensh1.png"
                alt="Chabaqa Logo"
                width={150}
                height={28}
                priority
                style={{ objectFit: "contain" }}
              />
            </Link>
            <p className="mt-1 text-gray-600 dark:text-gray-400 max-w-md">
              {t("description")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold mb-3 sm:mb-4">{t("sections.product")}</h3>
            <ul className="space-y-2 sm:space-y-3" role="list">
              {productLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={withLocale(link.href)}
                    className="text-sm sm:text-base text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-3 sm:mb-4">{t("sections.company")}</h3>
            <ul className="space-y-2 sm:space-y-3" role="list">
              {companyLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={withLocale(link.href)}
                    className="text-sm sm:text-base text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className={isArabic ? "text-sm font-semibold mb-3 sm:mb-4 text-center lg:text-right" : "text-sm font-semibold mb-3 sm:mb-4 text-center lg:text-left"}>{t("sections.followUs")}</h3>
            <div className="flex justify-center lg:justify-start gap-4" dir="ltr">
              {siteData.footer.social.map((social, index) => {
                const Icon = iconMap[social.icon as keyof typeof iconMap]
                return (
                  <Link
                    key={index}
                    href={social.href}
                    className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    aria-label={social.icon}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-8 sm:mt-12 border-t border-gray-900/10 dark:border-white/10 pt-6 sm:pt-8 text-center">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400" dir={isArabic ? "rtl" : "ltr"}>
            {isArabic ? (
              <>
                {t("copyrightReserved")} <span dir="ltr">{new Date().getFullYear()}</span> {siteData.brand.name}
              </>
            ) : (
              t("copyright", { year: new Date().getFullYear(), brand: siteData.brand.name })
            )}
          </p>
          {legalLinks.length > 0 && (
            <div
              className="mt-2 sm:mt-3 flex flex-wrap items-center justify-center gap-4 sm:gap-5"
              dir={isArabic ? "rtl" : "ltr"}
            >
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={withLocale(link.href)}
                  className="text-xs sm:text-sm text-gray-500 underline-offset-4 hover:text-gray-800 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={openCookiePreferences}
                className="text-xs sm:text-sm text-gray-500 underline-offset-4 hover:text-gray-800 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
              >
                {t("manageCookies")}
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
