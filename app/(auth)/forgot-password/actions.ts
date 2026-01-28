"use server"

interface ForgotPasswordResult {
  success: boolean
  error?: string
  message?: string
}

export async function forgotPasswordAction(data: { email: string }): Promise<ForgotPasswordResult> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/user/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
      }),
    })

    const result = await response.json()

    if (response.ok && result.success) {
      return { 
        success: true, 
        message: result.message 
      }
    } else {
      return { 
        success: false, 
        error: result.message || "Une erreur s'est produite" 
      }
    }
  } catch (error) {
    return { success: false, error: "Erreur de connexion. Veuillez réessayer." }
  }
}
