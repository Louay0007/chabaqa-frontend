"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "../../providers/admin-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle, CheckCircle2, Copy } from "lucide-react"

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// 2FA form validation schema
const twoFASchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
})

type LoginFormData = z.infer<typeof loginSchema>
type TwoFAFormData = z.infer<typeof twoFASchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const { loading: authLoading, login, verify2FA, isAuthenticated } = useAdminAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [twoFACode, setTwoFACode] = useState<string | null>(null)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const show2FAForm = requires2FA || (!!twoFACode && isDevelopment)

  // Check if we're in development mode
  useEffect(() => {
    setIsDevelopment(
      process.env.NODE_ENV === 'development' || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    )
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/admin/dashboard')
    }
  }, [authLoading, isAuthenticated, router])

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // 2FA form
  const twoFAForm = useForm<TwoFAFormData>({
    resolver: zodResolver(twoFASchema),
    defaultValues: {
      code: "",
    },
  })

  // Handle login submission
  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true)
      setEmail(data.email)
      
      const result = await login(data.email, data.password)
      
      if (result.requires2FA) {
        setRequires2FA(true)
        if (typeof window !== "undefined") {
          sessionStorage.setItem("admin_2fa_email", data.email)
        }
        
        // Extract 2FA code from message if in development
        const message = result.message || ''
        const codeMatch = message.match(/Code de vérification: (\d{6})/)
        if (codeMatch && isDevelopment) {
          setTwoFACode(codeMatch[1])
          setRequires2FA(true)
          if (typeof window !== "undefined") {
            sessionStorage.setItem("admin_2fa_code", codeMatch[1])
          }
          toast.success("2FA Code Generated", {
            description: `Development Mode: Code is ${codeMatch[1]}`,
            duration: 10000,
          })
        } else {
          toast.info("2FA Required", {
            description: "Please check your email or backend console for the verification code",
            duration: 5000,
          })
        }

        router.push("/admin/verify-2fa")
      } else {
        toast.success("Login Successful", {
          description: "Redirecting to dashboard...",
        })
        router.push('/admin/dashboard')
      }
    } catch (error: any) {
      console.error('[AdminLogin] Login error:', error)
      toast.error("Login Failed", {
        description: error.message || "Invalid credentials. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle 2FA submission
  const on2FASubmit = async (data: TwoFAFormData) => {
    try {
      setIsSubmitting(true)
      
      await verify2FA(email, data.code)
      
      toast.success("Verification Successful", {
        description: "Redirecting to dashboard...",
      })
      
      // Redirect will be handled by the auth provider
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 500)
    } catch (error: any) {
      console.error('[AdminLogin] 2FA error:', error)
      toast.error("Verification Failed", {
        description: error.message || "Invalid verification code. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle back to login
  const handleBackToLogin = () => {
    setRequires2FA(false)
    setEmail("")
    setTwoFACode(null)
    loginForm.reset()
    twoFAForm.reset()
  }

  // Auto-fill 2FA code in development
  const handleUseDevelopmentCode = () => {
    if (twoFACode) {
      twoFAForm.setValue('code', twoFACode)
      toast.success("Code Auto-filled", {
        description: "Click 'Verify & Login' to continue",
      })
    }
  }

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (twoFACode) {
      navigator.clipboard.writeText(twoFACode)
      toast.success("Code Copied", {
        description: "Paste it in the verification field",
      })
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center justify-center mb-2">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {show2FAForm ? "Two-Factor Authentication" : "Admin Portal"}
          </CardTitle>
          <CardDescription className="text-center text-base">
            {show2FAForm
              ? "Enter the 6-digit verification code"
              : "Sign in to access the admin dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Development Mode Alert */}
          {isDevelopment && !requires2FA && (
            <Alert className="border-blue-200 bg-blue-50/50 backdrop-blur">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800 ml-2">
                <strong>Development Mode:</strong> 2FA code will be displayed after login
              </AlertDescription>
            </Alert>
          )}

          {/* 2FA Code Display in Development */}
          {isDevelopment && requires2FA && twoFACode && (
            <Alert className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="ml-2">
                <div className="flex flex-col gap-3">
                  <strong className="text-green-800 text-sm">🔐 Development 2FA Code:</strong>
                  <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-green-200">
                    <code className="text-3xl font-mono font-bold text-green-900 tracking-wider flex-1 text-center">
                      {twoFACode}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCode}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleUseDevelopmentCode}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Auto-fill Code
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form 
            onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
            className="space-y-4"
          >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@chabaqa.com"
                    className="pl-10 h-11"
                    {...loginForm.register("email")}
                    disabled={isSubmitting}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11"
                    {...loginForm.register("password")}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {isDevelopment && (
                <Alert className="border-amber-200 bg-amber-50/50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-800 ml-2">
                    <strong>Test Credentials:</strong><br />
                    <span className="font-mono">admin@local.com</span> / <span className="font-mono">Admin@123456</span>
                  </AlertDescription>
                </Alert>
              )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
