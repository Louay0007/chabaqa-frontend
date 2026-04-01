'use client'

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CreditCard, HardDrive, Receipt, ArrowUpCircle, Wallet } from "lucide-react"
import { PageShell } from "@/components/creator-dashboard"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "Overview", href: "/creator/plan", icon: CreditCard },
  { label: "Storage", href: "/creator/plan/storage", icon: HardDrive },
  { label: "Invoices", href: "/creator/plan/invoices", icon: Receipt },
  { label: "Billing", href: "/creator/plan/billing/manage", icon: Wallet },
  { label: "Upgrade", href: "/creator/plan/upgrade", icon: ArrowUpCircle },
]

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <PageShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Plan &amp; Billing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your Chabaqa subscription, storage, and billing
          </p>
        </div>
      </div>

      <nav className="flex gap-1 border-b">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/creator/plan"
              ? pathname === tab.href
              : pathname.startsWith(tab.href) || (tab.href.includes('/billing/') && pathname.startsWith('/creator/plan/billing'))

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-sm transition-colors -mb-px",
                isActive
                  ? "border-b-2 border-primary text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </nav>

      <div>{children}</div>
    </PageShell>
  )
}
