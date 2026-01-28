import { redirect } from "next/navigation"
import { getProfileServer } from "@/lib/auth.server"
import Image from "next/image"
import SignUpForm from "../components/signup-form"

export default async function SignUpPage() {
  const user = await getProfileServer()

  if (user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 gradient-fallback">
        <Image src="/gradient-background.png" alt="Gradient Background" fill className="object-cover" priority />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-5xl font-bold text-[#8e78fb] tracking-tight drop-shadow-lg">Chabaqa</h1>
            <div className="w-16 h-1 bg-gradient-to-r from-[#8e78fb] to-[#86e4fd] mx-auto mt-2 rounded-full"></div>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8 animate-fade-in-delay-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 drop-shadow-sm">Create your Chabaqa space</h2>
            <p className="text-gray-700 drop-shadow-sm">Join the community and start building your digital presence</p>
          </div>

          {/* Signup Form */}
          <SignUpForm />

          {/* Footer */}
          <div className="text-center mt-8 animate-fade-in-delay-1100">
            <p className="text-xs text-gray-600 drop-shadow-sm">© 2024 Chabaqa. Build the future of communities.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
