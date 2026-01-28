"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { CheckCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { resetPasswordAction } from "../reset-password/actions"

interface ResetPasswordFormProps {
  email: string
}

export default function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    if (verificationCode.length !== 6) {
      setError("Le code de vérification doit contenir 6 chiffres")
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPasswordAction({
        email,
        verificationCode,
        newPassword,
      })

      if (result.success) {
        setIsSuccess(true)
      } else {
        setError(result.error || "Une erreur s'est produite")
      }
    } catch (error) {
      setError("Erreur de connexion. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Header Message */}
      <div className="text-center mb-8 animate-fade-in-delay-400">
        {!isSuccess ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 drop-shadow-sm">Reset your password</h2>
            <p className="text-gray-700 drop-shadow-sm">
              Enter the code sent to <strong>{email}</strong> and your new password.
            </p>
            <p className="text-sm text-gray-600 mt-2 drop-shadow-sm">The code expires in 15 minutes.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-gradient-to-r from-[#8e78fb] to-[#47c7ea] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 drop-shadow-sm">Password reset successful!</h2>
            <p className="text-gray-700 drop-shadow-sm">Your password has been successfully updated.</p>
            <p className="text-sm text-gray-600 mt-2 drop-shadow-sm">Click the button below to sign in with your new password.</p>
          </>
        )}
      </div>

      {/* Reset Card */}
      <div className="backdrop-blur-xl bg-white/25 border border-white/40 p-8 rounded-3xl shadow-2xl animate-fade-in-delay-600">
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-100/80 backdrop-blur-sm border border-red-200 rounded-2xl">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Verification Code Field */}
            <div className="space-y-2 animate-fade-in-delay-800">
              <Label htmlFor="verificationCode" className="text-sm font-medium text-gray-800 block">
                Verification Code
              </Label>
              <div className="relative">
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-4 rounded-2xl border-2 border-white/60 focus:border-[#8e78fb] focus:ring-4 focus:ring-[#8e78fb]/20 transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white/80 backdrop-blur-sm disabled:opacity-50 text-center text-2xl tracking-widest shadow-sm"
                  maxLength={6}
                />
              </div>
            </div>

            {/* New Password Field */}
            <div className="space-y-2 animate-fade-in-delay-900">
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-800 block">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-4 pr-12 rounded-2xl border-2 border-white/60 focus:border-[#8e78fb] focus:ring-4 focus:ring-[#8e78fb]/20 transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white/80 backdrop-blur-sm disabled:opacity-50 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#8e78fb] transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2 animate-fade-in-delay-1000">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-800 block">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-4 pr-12 rounded-2xl border-2 border-white/60 focus:border-[#8e78fb] focus:ring-4 focus:ring-[#8e78fb]/20 transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white/80 backdrop-blur-sm disabled:opacity-50 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#8e78fb] transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <div className="animate-fade-in-delay-1100">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8e78fb] to-[#47c7ea] text-white font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 border-0 relative overflow-hidden group hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Reset Password</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#7c66e9] to-[#3bb5d6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <p className="text-gray-700 drop-shadow-sm">You can now sign in with your new password.</p>
            </div>

            <Link href="/signin">
              <Button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8e78fb] to-[#47c7ea] text-white font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 border-0 relative overflow-hidden group hover:scale-105">
                <span className="relative z-10">Go to Sign In</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#7c66e9] to-[#3bb5d6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </Link>
          </div>
        )}

        {/* Back to Login Link */}
        {!isSuccess && (
          <div className="mt-8 text-center animate-fade-in-delay-1200">
            <div className="text-sm text-gray-700 drop-shadow-sm">
              Remember your password?{" "}
              <Link
                href="/signin"
                className="text-[#47c7ea] hover:text-[#3bb5d6] font-medium transition-all duration-200 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
