"use server"

import { cookies } from "next/headers"
import { authApi } from "@/lib/api"

interface SignupResult {
  success: boolean
  error?: string
  user?: {
    _id: string
    name: string
    email: string
    role: string
    createdAt: string
  }
}

export async function signupAction(data: { 
  name: string
  email: string
  password: string
  numtel?: string
  date_naissance?: string
}): Promise<SignupResult> {
  try {
    const response: any = await authApi.register({
      name: data.name,
      email: data.email,
      password: data.password,
      numtel: data.numtel,
      date_naissance: data.date_naissance,
    })
    // Accept response either wrapped in .data or top-level
    const payload = response?.data ?? response
    if (payload?.user) {
      const cookieStore = await cookies()
      if (payload.accessToken) {
        cookieStore.set('accessToken', payload.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        })
      }
      if (payload.refreshToken) {
        cookieStore.set('refreshToken', payload.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
        })
      }

      const u = payload.user
      return {
        success: true,
        user: {
          _id: u?._id || u?.id || '',
          name: u?.name || data.name,
          email: u?.email || data.email,
          role: u?.role || 'user',
          createdAt: u?.createdAt || new Date().toISOString(),
        },
      }
    }

    return { success: false, error: "Registration failed" }
  } catch (error: any) {
    console.error("Signup error:", error)
    
    // Convert error to string safely
    const errorMessageRaw = error?.message || error?.error || error
    const errorMessage = typeof errorMessageRaw === 'string' ? errorMessageRaw : (JSON.stringify(errorMessageRaw) || "Connection error. Please try again.")
    
    if (errorMessage.includes("409") || errorMessage.includes("already exists")) {
      return { success: false, error: "Email already in use" }
    } else if (errorMessage.includes("400") || errorMessage.includes("Invalid")) {
      return { success: false, error: "Invalid data provided" }
    }
    
    return { success: false, error: errorMessage }
  }
}
