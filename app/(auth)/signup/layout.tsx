import type React from "react"
import type { Metadata } from "next"
import "../../globals.css"

export const metadata: Metadata = {
  title: "Sign Up - Chabaqa",
  description: "Create your Chabaqa account and join our community platform.",
}

export default function SignUpLayout({
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
