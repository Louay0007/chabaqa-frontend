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
    // Convert date to ISO 8601 format if provided
    let formattedDate: string | undefined = undefined
    if (data.date_naissance) {
      try {
        const date = new Date(data.date_naissance)
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString()
        }
      } catch (e) {
        // Ignore date conversion errors, let backend handle validation
      }
    }

    const response: any = await authApi.register({
      name: data.name,
      email: data.email,
      password: data.password,
      numtel: data.numtel,
      date_naissance: formattedDate,
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
    
    // Handle AuthApiError with custom messages
    if (error?.statusCode === 409) {
      return { success: false, error: "This email is already registered. Please use another email or sign in." }
    }
    
    if (error?.statusCode === 400) {
      return { success: false, error: "Invalid registration information. Please check your details." }
    }
    
    if (error?.statusCode === 500) {
      return { success: false, error: "Server error. Please try again later." }
    }
    
    // Extract validation errors from backend
    let errorMessage = "Connection error. Please try again."
    
    // Try to extract message from error object
    if (error?.message && typeof error.message === 'object') {
      // Handle nested error message object
      if (error.message.message && typeof error.message.message === 'string') {
        errorMessage = error.message.message
      }
    } else if (error?.error && typeof error.error === 'object') {
      // Handle error.error object
      if (error.error.message && typeof error.error.message === 'string') {
        errorMessage = error.error.message
      }
    } else if (typeof error?.message === 'string') {
      errorMessage = error.message
    } else if (typeof error?.error === 'string') {
      errorMessage = error.error
    }
    
    // Clean up validation error messages
    if (errorMessage.includes('Validation failed')) {
      // Extract field-specific validation errors
      if (errorMessage.includes('date_naissance')) {
        return { success: false, error: "Please enter a valid birth date." }
      }
      if (errorMessage.includes('email')) {
        return { success: false, error: "Please enter a valid email address." }
      }
      if (errorMessage.includes('password')) {
        return { success: false, error: "Password does not meet requirements." }
      }
      return { success: false, error: "Please check your information and try again." }
    }
    
    // Check for specific error patterns in the message
    if (errorMessage.toLowerCase().includes("already exists") || errorMessage.toLowerCase().includes("already registered")) {
      return { success: false, error: "This email is already registered. Please use another email or sign in." }
    }
    
    if (errorMessage.toLowerCase().includes("invalid")) {
      return { success: false, error: "Invalid registration information. Please check your details." }
    }
    
    if (errorMessage.toLowerCase().includes("network") || errorMessage.toLowerCase().includes("fetch")) {
      return { success: false, error: "Network error. Please check your connection and try again." }
    }
    
    return { success: false, error: errorMessage }
  }
}
