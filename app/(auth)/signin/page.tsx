"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import SignInForm from "../components/signin-form"
import { useAuthContext } from "@/app/providers/auth-provider"

export default function SignInPage() {
  const { user, isAuthenticated } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role?.toLowerCase()
      if (role === 'creator') {
        router.push('/creator/dashboard')
      } else {
        router.push('/explore')
      }
    }
  }, [isAuthenticated, user, router])


  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background avec fallback */}
      <div className="absolute inset-0 gradient-fallback">
        <Image src="/gradient-background.png" alt="Gradient Background" fill className="object-cover" priority />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center">
              <Image
                src="/logo_chabaqa.png"
                alt="Chabaqa Logo"
                width={280}
                height={112}
                className="drop-shadow-lg"
                priority
              />
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-[#8e78fb] to-[#86e4fd] mx-auto rounded-full"></div>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8 animate-fade-in-delay-200">
            <p className="text-xl text-gray-700 font-light drop-shadow-sm">Sign in to your Chabaqa space</p>
            <p className="text-sm text-gray-600 mt-2 drop-shadow-sm">Create, educate and manage your digital communities</p>
          </div>

          {/* Sign In Form */}
          <SignInForm />

          {/* Footer */}
          <div className="text-center mt-8 animate-fade-in-delay-1200">
            <p className="text-xs text-gray-600 drop-shadow-sm">© 2024 Chabaqa. Build the future of communities.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
