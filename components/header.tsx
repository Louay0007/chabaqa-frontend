"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, LogOut, User as UserIcon, Plus, LayoutDashboard } from "lucide-react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { getUserProfileHandle } from "@/lib/profile-handle"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState("")
  const pathname = usePathname()
  const t = useTranslations("landing.header")
  const { user: authUser, loading, logout } = useAuth()
  const isAuthenticated = !!authUser
  const profileHandle = getUserProfileHandle(authUser)
  const withLocale = (href: string) => localizeHref(pathname, href)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setError("")

    try {
      await logout()
      // logout() in provider now handles redirection via window.location.href
    } catch (error) {
      setError(t("logoutError"))
      console.error("Logout failed:", error)
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)")
    const handleBreakpointChange = () => {
      if (mediaQuery.matches) {
        setIsMenuOpen(false)
      }
    }

    handleBreakpointChange()
    mediaQuery.addEventListener("change", handleBreakpointChange)
    return () => mediaQuery.removeEventListener("change", handleBreakpointChange)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-pink-100/70 bg-gradient-to-b from-pink-100/95 via-white/95 to-white/95 backdrop-blur-sm dark:border-white/10 dark:from-gray-900 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <nav aria-label={t("globalNavAria")} className="flex items-center justify-between ">
            {/* Left: Logo */}
            <div className="flex lg:flex-1">
              <Link href={withLocale("/")} className="-ml-3 p-0.5 flex items-center" aria-label={t("brandAriaLabel")}>
                <Image src="/Logos/PNG/frensh1.png" alt={t("brandLogoAlt")} width={150} height={28} priority style={{ objectFit: 'contain' }} />
              </Link>
            </div>

            {/* Middle: Desktop links */}
            <div className="hidden lg:flex lg:gap-x-8">
              <Link href={withLocale("/explore")} className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors">{t("explore")}</Link>
              <Link href={withLocale("/#pricing")} className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors">{t("pricing")}</Link>
              <Link href={withLocale("/#about")} className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors">{t("about")}</Link>
              <Link href={withLocale("/blogs")} className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors">{t("blog")}</Link>
              <Link href={withLocale("/#features")} className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors">{t("features")}</Link>
            </div>

            {/* Right: Desktop actions (auth-aware) */}
            <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-x-4">
              {loading ? null : !isAuthenticated ? (
                <>
                  <Link href={withLocale("/signin")} className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors">{t("signIn")}</Link>
                  <Link href={withLocale("/dashboard/create-community")} className="rounded-md bg-pink-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600">
                    {t("getStarted")}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={withLocale("/dashboard/create-community")}
                    aria-label={t("createCommunity")}
                    title={t("createCommunity")}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-900 hover:text-pink-600 hover:border-pink-300 transition-colors dark:border-gray-700 dark:text-white dark:hover:text-pink-400"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">{t("createCommunity")}</span>
                  </Link>
                  {authUser?.role === "creator" && (
                    <Link
                      href={withLocale("/creator/dashboard")}
                      aria-label={t("creatorDashboard")}
                      title={t("creatorDashboard")}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-900 hover:text-pink-600 hover:border-pink-300 transition-colors dark:border-gray-700 dark:text-white dark:hover:text-pink-400"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="sr-only">{t("creatorDashboard")}</span>
                    </Link>
                  )}
                  <Link href={withLocale(`/profile/${profileHandle}`)} className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    @{profileHandle}
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="rounded-md bg-pink-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 disabled:opacity-70"
                  >
                    {isLoggingOut ? t("loggingOut") : t("logout")}
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <div className="lg:hidden">
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-menu"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>
            </div>
          </nav>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          {/* Mobile navigation */}
          <SheetContent side="right" className="p-0" id="mobile-menu">
            <div className="h-full overflow-y-auto p-6">
              <SheetHeader>
                <SheetTitle>{t("menu")}</SheetTitle>
              </SheetHeader>

              <nav className="mt-6">
                <div className="mb-4">
                  <h3 className="text-chabaqa-primary font-semibold mb-2">{t("navigation")}</h3>
                  <div className="flex flex-col space-y-1">
                    <SheetClose asChild>
                      <Link href={withLocale("/explore")} className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 rounded transition-colors">
                        {t("explore")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href={withLocale("/#pricing")} className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 rounded transition-colors">
                        {t("pricing")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href={withLocale("/#about")} className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 rounded transition-colors">
                        {t("about")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href={withLocale("/blogs")} className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 rounded transition-colors">
                        {t("blog")}
                      </Link>
                    </SheetClose>
                  </div>
                </div>
                
                {/* Mobile CTA Buttons (auth-aware) */}
                <div className="pt-2 space-y-2">
                  {loading ? null : !isAuthenticated ? (
                    <>
                      <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link href={withLocale("/signin")}>{t("signIn")}</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white" asChild>
                          <Link href={withLocale("/dashboard/create-community")}>{t("getStarted")}</Link>
                        </Button>
                      </SheetClose>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start hover:text-pink-600" asChild>
                          <Link href={withLocale("/dashboard/create-community")}>{t("createCommunity")}</Link>
                        </Button>
                      </SheetClose>
                      {authUser?.role === "creator" && (
                        <SheetClose asChild>
                          <Button variant="ghost" className="w-full justify-start hover:text-pink-600" asChild>
                            <Link href={withLocale("/creator/dashboard")}>{t("creatorDashboard")}</Link>
                          </Button>
                        </SheetClose>
                      )}
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start flex items-center space-x-2 hover:text-pink-600 dark:hover:text-pink-400"
                          asChild
                        >
                          <Link href={withLocale(`/profile/${profileHandle}`)}>
                            <UserIcon className="w-4 h-4" />
                            <span>@{profileHandle}</span>
                          </Link>
                        </Button>
                      </SheetClose>
                      <Button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full justify-start bg-pink-500 hover:bg-pink-600 text-white"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {isLoggingOut ? t("loggingOut") : t("logout")}
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
