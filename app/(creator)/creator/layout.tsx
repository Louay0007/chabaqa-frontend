import type React from "react"
import type { Metadata } from "next"
import "../../globals.css"
import { Inter } from "next/font/google"
import CreatorClientLayout from "@/app/(creator)/creator/creator-client-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Chabaqa - Creator Dashboard",
  description: "Manage your creator content, analytics, and community",
  generator: "v0.dev",
}

import { AuthProvider } from "@/app/providers/auth-provider"
import { CommunityProvider } from "@/app/providers/community-context"

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CommunityProvider>
            <CreatorClientLayout>
              {children}
            </CreatorClientLayout>
          </CommunityProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
