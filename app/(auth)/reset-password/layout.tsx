import type React from "react"
import type { Metadata } from "next"
import "../../globals.css"

export const metadata: Metadata = {
  title: "Reset Password - Chabaqa",
  description: "Create a new password for your Chabaqa account.",
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
