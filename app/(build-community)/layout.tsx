import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "../providers/auth-provider"

export const metadata: Metadata = {
  title: "Build Community - Chabaqa",
  description: "Create and customize your community with our step-by-step builder",
  keywords: ["community", "build", "create", "social", "platform"],
}

export default function BuildCommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
