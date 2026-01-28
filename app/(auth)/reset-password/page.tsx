import { redirect } from "next/navigation"
import { getProfileServer } from "@/lib/auth.server"
import ResetPasswordForm from "../components/reset-password-form"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from 'lucide-react'

interface ResetPasswordPageProps {
  searchParams: {
    email?: string
  }
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const user = await getProfileServer()

  if (user) {
    redirect("/")
  }

  const email = searchParams.email || ""

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 gradient-fallback">
        <Image src="/gradient-background.png" alt="Gradient Background" fill className="object-cover" priority />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in-delay-200">
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
            <div className="w-16 h-1 bg-gradient-to-r from-[#8e78fb] to-[#47c7ea] mx-auto mt-2 rounded-full"></div>
          </div>

          {/* Reset Password Form */}
          <ResetPasswordForm email={email} />

          {/* Footer */}
          <div className="text-center mt-8 animate-fade-in-delay-1400">
            <p className="text-xs text-gray-600 drop-shadow-sm">© 2024 Chabaqa. Build the future of communities.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
