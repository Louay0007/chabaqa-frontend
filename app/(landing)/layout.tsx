import type React from "react"
import type { Metadata } from "next"
import "../globals.css"
import { AuthProvider } from "../providers/auth-provider"

export const metadata: Metadata = {
  title: "Chabaqa - Turn your passion into buisness",
  description:
    "The ultimate platform for creators to build engaged communities, monetize their expertise, and scale their impact.",
  icons: {
    icon: "/Logos/ICO/brandmark.ico", // default favicon
    apple: "/Logos/ICO/brandmark.ico", // optional
    shortcut: "/Logos/ICO/brandmark.ico", // optional
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
