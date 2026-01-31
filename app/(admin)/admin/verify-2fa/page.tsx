"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAdminAuth } from "../../providers/admin-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { CheckCircle2, Shield, AlertCircle, Copy } from "lucide-react"

const twoFASchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
})

type TwoFAFormData = z.infer<typeof twoFASchema>

export default function AdminVerify2FAPage() {
  const router = useRouter()
  const { verify2FA, loading: authLoading, isAuthenticated } = useAdminAuth()
  const [email, setEmail] = useState<string>("")
  const [twoFACode, setTwoFACode] = useState<string | null>(null)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const twoFAForm = useForm<TwoFAFormData>({
    resolver: zodResolver(twoFASchema),
    defaultValues: { code: "" },
  })

  useEffect(() => {
    setIsDevelopment(
      process.env.NODE_ENV === "development" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1",
    )
  }, [])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/admin/dashboard")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedEmail = sessionStorage.getItem("admin_2fa_email") || ""
    const storedCode = sessionStorage.getItem("admin_2fa_code")
    setEmail(storedEmail)
    setTwoFACode(storedCode)
  }, [])

  const handleCopyCode = () => {
    if (!twoFACode) return
    navigator.clipboard.writeText(twoFACode)
    toast.success("Code Copied", {
      description: "Paste it in the verification field",
    })
  }

  const handleUseDevelopmentCode = () => {
    if (!twoFACode) return
    twoFAForm.setValue("code", twoFACode)
    toast.success("Code Auto-filled", {
      description: "Click Verify & Login to continue",
    })
  }

  const on2FASubmit = async (data: TwoFAFormData) => {
    try {
      setIsSubmitting(true)
      if (!email) {
        toast.error("Missing email", {
          description: "Please sign in again to receive a verification code.",
        })
        router.push("/admin/login")
        return
      }
      await verify2FA(email, data.code)
      toast.success("Verification Successful", {
        description: "Redirecting to dashboard...",
      })
      router.push("/admin/dashboard")
    } catch (error: any) {
      toast.error("Verification Failed", {
        description: error.message || "Invalid verification code. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
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
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-center text-base">
            Enter the 6-digit verification code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && twoFACode && (
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

          {!email && (
            <Alert className="border-amber-200 bg-amber-50/50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800 ml-2">
                Please sign in again to receive a verification code.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={twoFAForm.handleSubmit(on2FASubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                className="text-center text-3xl tracking-widest font-mono h-14"
                {...twoFAForm.register("code")}
                disabled={isSubmitting}
                autoFocus
              />
              {twoFAForm.formState.errors.code && (
                <p className="text-sm text-red-600 text-center">
                  {twoFAForm.formState.errors.code.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center pt-1">
                {isDevelopment ? "Use the code above" : "Check your email for the verification code"}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg"
              disabled={isSubmitting || !email}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify & Login
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/admin/login")}
              disabled={isSubmitting}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
