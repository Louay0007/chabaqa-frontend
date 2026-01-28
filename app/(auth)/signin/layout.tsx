import type React from "react"
import type { Metadata } from "next"
import "../../globals.css"

export const metadata: Metadata = {
  title: "Sign In - Chabaqa",
  description: "Create, educate and manage your digital communities"
}

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
