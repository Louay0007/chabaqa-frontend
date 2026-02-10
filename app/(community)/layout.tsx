import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import "../globals.css"
import { AuthProvider } from "@/app/providers/auth-provider"
import { CommunityProvider } from "@/app/providers/community-context"
import { Toaster } from "@/components/ui/toaster"

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
      <head>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  send_page_view: true
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <CommunityProvider>
            {children}
            <Toaster />
          </CommunityProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
