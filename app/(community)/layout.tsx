import type React from "react"
import type { Metadata } from "next"
import "../globals.css"
import { AuthProvider } from "@/app/providers/auth-provider"
import { CommunityProvider } from "@/app/providers/community-context"

export const metadata: Metadata = {
  title: "Chabaqa - Turn your passion into buisness",
  description:
    "The ultimate platform for creators to build engaged communities, monetize their expertise, and scale their impact.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <CommunityProvider>
            {children}
          </CommunityProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
