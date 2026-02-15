"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff, X } from "lucide-react"
import { signupAction } from "../signup/actions"
import { signUpSchema, validatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from "@/lib/validation/auth.validation"

interface SignUpFormProps {
  onSuccess?: () => void
}

export default function SignUpForm({ onSuccess }: SignUpFormProps = {}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [numtel, setNumtel] = useState("")
  const [dateNaissance, setDateNaissance] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] })
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (password) {
      setPasswordStrength(validatePasswordStrength(password))
    } else {
      setPasswordStrength({ score: 0, feedback: [] })
    }
  }, [password])

  const validateForm = (): boolean => {
    setFieldErrors({})
    try {
      signUpSchema.parse({
        name,
        email,
        password,
        confirmPassword,
        numtel,
        dateNaissance,
        agreeToTerms,
      })
      return true
    } catch (err: any) {
      const errors: Record<string, string> = {}
      if (err.errors) {
        err.errors.forEach((error: any) => {
          const path = error.path[0]
          errors[path] = error.message
        })
      }
      setFieldErrors(errors)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await signupAction({ 
        name, 
        email, 
        password, 
        numtel, 
        date_naissance: dateNaissance 
      })

      if (result.success) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/signin?message=Account created successfully")
        }
      } else {
        setError(result.error || "An error occurred")
      }
    } catch (error) {
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="backdrop-blur-xl bg-white/25 border border-white/40 p-8 rounded-3xl shadow-2xl animate-fade-in-delay-400">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-100/80 backdrop-blur-sm border border-red-200 rounded-2xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Name Field */}
        <div className="space-y-2 animate-fade-in-delay-600">
          <Label htmlFor="name" className="text-sm font-medium text-gray-800 block">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' })
            }}
            placeholder="John Doe"
            required
            disabled={isLoading}
            className={`w-full px-4 py-4 rounded-2xl border-2 transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white/70 backdrop-blur-sm disabled:opacity-50 ${
              fieldErrors.name
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                : 'border-white/50 focus:border-[#86e4fd] focus:ring-4 focus:ring-[#86e4fd]/20'
            }`}
          />
          {fieldErrors.name && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {fieldErrors.name}
            </div>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2 animate-fade-in-delay-700">
          <Label htmlFor="email" className="text-sm font-medium text-gray-800 block">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
            }}
            placeholder="your@email.com"
            required
            disabled={isLoading}
            className={`w-full px-4 py-4 rounded-2xl border-2 transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white/70 backdrop-blur-sm disabled:opacity-50 ${
              fieldErrors.email
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                : 'border-white/50 focus:border-[#86e4fd] focus:ring-4 focus:ring-[#86e4fd]/20'
            }`}
          />
          {fieldErrors.email && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {fieldErrors.email}
            </div>
          )}
        </div>

        {/* Phone Field */}
        <div className="space-y-2 animate-fade-in-delay-750">
          <Label htmlFor="numtel" className="text-sm font-medium text-gray-800 block">
            Phone Number (Optional)
          </Label>
          <Input
            id="numtel"
            type="tel"
            value={numtel}
            onChange={(e) => {
              setNumtel(e.target.value)
              if (fieldErrors.numtel) setFieldErrors({ ...fieldErrors, numtel: '' })
            }}
            placeholder="+216 XX XXX XXX"
            disabled={isLoading}
            className={`w-full px-4 py-4 rounded-2xl border-2 transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white/70 backdrop-blur-sm disabled:opacity-50 ${
              fieldErrors.numtel
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                : 'border-white/50 focus:border-[#86e4fd] focus:ring-4 focus:ring-[#86e4fd]/20'
            }`}
          />
          {fieldErrors.numtel && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {fieldErrors.numtel}
            </div>
          )}
        </div>

        {/* Date of Birth Field */}
        <div className="space-y-2 animate-fade-in-delay-775">
          <Label htmlFor="dateNaissance" className="text-sm font-medium text-gray-800 block">
            Date of Birth (Optional)
          </Label>
          <Input
            id="dateNaissance"
            type="date"
            value={dateNaissance}
            onChange={(e) => {
              setDateNaissance(e.target.value)
              if (fieldErrors.dateNaissance) setFieldErrors({ ...fieldErrors, dateNaissance: '' })
            }}
            disabled={isLoading}
            className={`w-full px-4 py-4 rounded-2xl border-2 transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white/70 backdrop-blur-sm disabled:opacity-50 ${
              fieldErrors.dateNaissance
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                : 'border-white/50 focus:border-[#86e4fd] focus:ring-4 focus:ring-[#86e4fd]/20'
            }`}
          />
          {fieldErrors.dateNaissance && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {fieldErrors.dateNaissance}
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2 animate-fade-in-delay-800">
          <Label htmlFor="password" className="text-sm font-medium text-gray-800 block">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
              }}
              placeholder="••••••••••"
              required
              disabled={isLoading}
              className={`w-full px-4 py-4 pr-12 rounded-2xl border-2 transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white/70 backdrop-blur-sm disabled:opacity-50 ${
                fieldErrors.password
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                  : 'border-white/50 focus:border-[#86e4fd] focus:ring-4 focus:ring-[#86e4fd]/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#86e4fd] transition-colors duration-200 disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Password strength:</span>
                <span className="text-xs font-semibold text-gray-700">{getPasswordStrengthLabel(passwordStrength.score)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                  style={{ width: `${Math.min(100, (passwordStrength.score / 6) * 100)}%` }}
                />
              </div>
              {passwordStrength.feedback.length > 0 && (
                <ul className="text-xs text-gray-600 space-y-1">
                  {passwordStrength.feedback.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {fieldErrors.password && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {fieldErrors.password}
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2 animate-fade-in-delay-850">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-800 block">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' })
              }}
              placeholder="••••••••••"
              required
              disabled={isLoading}
              className={`w-full px-4 py-4 pr-12 rounded-2xl border-2 transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white/70 backdrop-blur-sm disabled:opacity-50 ${
                fieldErrors.confirmPassword
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                  : 'border-white/50 focus:border-[#86e4fd] focus:ring-4 focus:ring-[#86e4fd]/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#86e4fd] transition-colors duration-200 disabled:opacity-50"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {fieldErrors.confirmPassword}
            </div>
          )}
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start space-x-2 animate-fade-in-delay-900">
          <input
            type="checkbox"
            id="agreeToTerms"
            aria-label="Agree to terms and conditions"
            checked={agreeToTerms}
            onChange={(e) => {
              setAgreeToTerms(e.target.checked)
              if (fieldErrors.agreeToTerms) setFieldErrors({ ...fieldErrors, agreeToTerms: '' })
            }}
            disabled={isLoading}
            className="w-4 h-4 rounded border-gray-300 text-[#86e4fd] focus:ring-[#86e4fd] mt-1"
          />
          <Label htmlFor="agreeToTerms" className="text-sm text-gray-700 cursor-pointer">
            I agree to the{" "}
            <Link href="/terms" className="text-[#86e4fd] hover:text-[#74d4f0] font-medium">
              Terms and Conditions
            </Link>
            {" "}and{" "}
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="text-[#86e4fd] hover:text-[#74d4f0] font-medium underline"
            >
              Privacy Policy
            </button>
          </Label>
        </div>
        {fieldErrors.agreeToTerms && (
          <div className="flex items-center text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            {fieldErrors.agreeToTerms}
          </div>
        )}

        {/* Create Account Button */}
        <div className="animate-fade-in-delay-900">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8e78fb] to-[#86e4fd] text-white font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 border-0 relative overflow-hidden group hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span className="relative z-10">Create my account</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#7c66e9] to-[#74d4f0] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Sign in link */}
      <div className="mt-8 text-center animate-fade-in-delay-1000">
        <div className="text-sm text-gray-700 drop-shadow-sm">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-[#86e4fd] hover:text-[#74d4f0] font-medium transition-all duration-200 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-[95vw] max-w-[1400px] max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-white p-8 flex items-center justify-between border-b-4 border-gray-900">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Privacy Policy</h2>
                <p className="text-gray-600 text-base mt-2">Effective Date: January 25, 2026</p>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-900" />
              </button>
            </div>

            {/* Content */}
            <div className="p-10 overflow-y-auto max-h-[calc(90vh-180px)] bg-gray-50">
              <div className="space-y-10 text-gray-800 max-w-5xl mx-auto">
                <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-gray-900">
                  <p className="text-lg leading-relaxed text-gray-700">
                    By using <span className="font-bold text-gray-900">Chabaqa</span>, you agree to our data practices. We collect and use your information to provide our services, improve your experience, and keep your account secure.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Section 1 */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                      What We Collect
                    </h3>
                    <div className="text-base space-y-3 text-gray-700 ml-11">
                      <p><strong className="text-gray-900">Account info:</strong> name, email, phone, profile details</p>
                      <p><strong className="text-gray-900">Content:</strong> posts, messages, uploaded media</p>
                      <p><strong className="text-gray-900">Usage data:</strong> device info, analytics via Google Analytics</p>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                      How We Use It
                    </h3>
                    <div className="text-base text-gray-700 ml-11">
                      <p>To manage your account, enable community features, process bookings, send notifications, improve the app, and maintain security.</p>
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">4</span>
                      Your Rights
                    </h3>
                    <div className="text-base space-y-3 text-gray-700 ml-11">
                      <p>• Update your profile anytime</p>
                      <p>• Delete your account anytime</p>
                      <p>• Control notification settings</p>
                    </div>
                  </div>

                  {/* Section 5 */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center mr-3 text-sm">5</span>
                      Data Security
                    </h3>
                    <div className="text-base text-gray-700 ml-11">
                      <p>We use industry-standard security measures to protect your data and retain information for legal compliance.</p>
                    </div>
                  </div>
                </div>

                {/* Section 3 - Full Width Highlight */}
                <div className="bg-gray-900 text-white p-8 rounded-lg shadow-lg">
                  <h3 className="text-2xl font-bold mb-5 flex items-center">
                    <span className="w-10 h-10 bg-white text-gray-900 rounded-full flex items-center justify-center mr-3">3</span>
                    Your Privacy Matters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-13">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="text-gray-900 font-bold">✓</span>
                      </div>
                      <p className="text-lg font-semibold">We don't sell your data</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="text-gray-900 font-bold">✓</span>
                      </div>
                      <p className="text-lg font-semibold">No ads or tracking</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="text-gray-900 font-bold">✓</span>
                      </div>
                      <p className="text-lg font-semibold">You control your info</p>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gray-400">
                  <p className="text-base text-gray-700"><strong className="text-gray-900">Important:</strong> Chabaqa is not intended for children under 13. We may update this policy occasionally.</p>
                </div>

                {/* Contact */}
                <div className="text-center pt-6">
                  <p className="text-lg text-gray-700">
                    Questions? Contact us at <a href="mailto:support@chabaqa.com" className="text-gray-900 font-bold underline hover:text-gray-700 transition-colors">support@chabaqa.com</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white p-8 border-t-4 border-gray-900 flex justify-center">
              <Button
                onClick={() => setShowPrivacyModal(false)}
                className="px-16 py-4 bg-gray-900 text-white text-lg font-bold hover:bg-gray-800 transition-all hover:scale-105 shadow-lg"
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
