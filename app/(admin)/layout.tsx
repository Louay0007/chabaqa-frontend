import "@/app/globals.css"
import { Inter } from "next/font/google"
import { AdminAuthProvider } from "./providers/admin-auth-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AdminAuthProvider>
          {children}
        </AdminAuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
