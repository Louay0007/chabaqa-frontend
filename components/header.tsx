"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, ChevronDown, LogOut, User as UserIcon } from "lucide-react"
import { siteData } from "@/lib/data"
import { useRouter } from "next/navigation"
import { logoutAction } from "@/app/(auth)/signin/actions"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { user: authUser, loading, logout } = useAuth()
  const isAuthenticated = !!authUser
  const profileHandle = ((authUser?.email || "").split("@")[0]) || "user"

  const groups = siteData.navigationGroups

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setError("")

    try {
      await logout()
      // logout() in provider now handles redirection via window.location.href
    } catch (error) {
      setError("Erreur de connexion")
      console.error('Erreur lors de la déconnexion:', error)
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
    <header className="w-full bg-gradient-to-b from-pink-100 to-white dark:from-gray-900 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <nav aria-label="Global" className="flex items-center justify-between ">
            {/* Left: Logo */}
            <div className="flex lg:flex-1">
              <Link href="/" className="-ml-3 p-0.5 flex items-center" aria-label="Chabaqa">
                <Image src="/Logos/PNG/frensh1.png" alt="Chabaqa Logo" width={150} height={28} priority style={{ objectFit: 'contain' }} />
              </Link>
            </div>

            {/* Middle: Desktop links */}
            <div className="hidden lg:flex lg:gap-x-8">
              <Link href="/explore" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Explore</Link>
              <Link href="/pricing" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Pricing</Link>
              <Link href="/about" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors">About</Link>
              <button className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center gap-x-1" type="button">
                Features
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Desktop actions (auth-aware) */}
            <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-x-4">
              {loading ? null : !isAuthenticated ? (
                <>
                  <Link href="/signin" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Sign in</Link>
                  <Link href="/build-community" className="rounded-md bg-pink-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600">
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <Link href={`/profile/${profileHandle}`} className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    @{profileHandle}
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="rounded-md bg-pink-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 disabled:opacity-70"
                  >
                    {isLoggingOut ? 'Déconnexion...' : 'Logout'}
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
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
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
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <nav className="mt-6">
                {groups.map((group) => (
                  <div key={group.title} className="mb-4">
                    <h3 className="text-chabaqa-primary font-semibold mb-2">{group.title}</h3>
                    <div className="flex flex-col space-y-1">
                      {group.items.map((item) => (
                        <SheetClose asChild key={item.name}>
                          <Link
                            href={item.href}
                            className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 rounded transition-colors whitespace-normal break-words"
                          >
                            {item.name}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Mobile CTA Buttons (auth-aware) */}
                <div className="pt-2 space-y-2">
                  {loading ? null : !isAuthenticated ? (
                    <>
                      <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link href="/signin">Sign In</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white" asChild>
                          <Link href="/build-community">Get Started</Link>
                        </Button>
                      </SheetClose>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start flex items-center space-x-2 hover:text-pink-600 dark:hover:text-pink-400"
                          asChild
                        >
                          <Link href={`/profile/${profileHandle}`}>
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
                        {isLoggingOut ? 'Déconnexion...' : 'Logout'}
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
