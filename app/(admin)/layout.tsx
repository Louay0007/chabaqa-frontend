import { AdminAuthProvider } from "./providers/admin-auth-provider"
import { Toaster } from "@/components/ui/sonner"

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
      <Toaster />
    </>
  )
}
