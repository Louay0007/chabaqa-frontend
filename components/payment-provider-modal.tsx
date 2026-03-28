"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Loader2, ShieldCheck } from "lucide-react"

export type PaymentProvider = "stripe" | "konnect"

interface PaymentProviderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (provider: PaymentProvider) => Promise<void>
  title?: string
  description?: string
}

function StripeLogo() {
  return (
    <svg viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
      <path
        d="M5.454 9.415c0-.9.74-1.25 1.963-1.25 1.754 0 3.97.53 5.724 1.478V4.95C11.363 4.19 9.638 3.9 7.9 3.9 3.546 3.9.5 6.16.5 9.665c0 5.527 7.614 4.645 7.614 7.033 0 1.063-.924 1.407-2.211 1.407-1.914 0-4.362-.787-6.298-1.847V21.1c2.147.924 4.312 1.31 6.298 1.31 4.476 0 7.554-2.21 7.554-5.754-.016-5.966-7.003-4.902-7.003-7.241z"
        fill="#6772E5"
      />
      <path
        d="M22.11 1.5l-4.245.9-.016 13.937c0 2.573 1.93 4.47 4.503 4.47 1.427 0 2.47-.262 3.047-.573v-3.432c-.557.225-3.308 1.027-3.308-1.546V8.08h3.308V4.273H22.11V1.5z"
        fill="#6772E5"
      />
      <path
        d="M32.695 5.386l-.27-1.113h-3.818v16.023h4.423V9.94c1.044-1.366 2.81-1.12 3.367-.924V4.273c-.573-.21-2.66-.594-3.702 1.113z"
        fill="#6772E5"
      />
      <path
        d="M40.938 2.02l-4.44.94v3.608l4.44-.94V2.02zm-4.44 2.253h4.44v16.023h-4.44V4.273z"
        fill="#6772E5"
      />
      <path
        d="M51.62 4.02c-1.61 0-2.654.757-3.226 1.283l-.214-1.03h-3.608v21.228l4.44-.94V20.63c.588.427 1.459 1.034 2.9 1.034 2.933 0 5.607-2.35 5.607-7.516-.016-4.726-2.706-7.127-5.9-7.127zm-1.036 10.97c-.966 0-1.538-.346-1.93-.773V9.44c.427-.46 1.014-.789 1.93-.789 1.476 0 2.49 1.657 2.49 3.655 0 2.05-1.014 3.683-2.49 3.683z"
        fill="#6772E5"
      />
    </svg>
  )
}

function KonnectLogo() {
  return (
    <svg viewBox="0 0 120 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
      <rect width="34" height="34" rx="8" fill="#FF6B35" />
      <path
        d="M8 8h4.5v7.2l6.3-7.2H24l-7 7.8 7.4 10.2h-5.3l-5.1-7.2-1 1.1V26H8V8z"
        fill="white"
      />
      <text x="39" y="24" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="15" fill="#1a1a2e">
        konnect
      </text>
    </svg>
  )
}

export function PaymentProviderModal({
  open,
  onOpenChange,
  onSelect,
  title = "Choose Payment Method",
  description = "Select your preferred payment provider to complete your purchase.",
}: PaymentProviderModalProps) {
  const [processingProvider, setProcessingProvider] = useState<PaymentProvider | null>(null)

  const handleSelect = async (provider: PaymentProvider) => {
    if (processingProvider) return
    setProcessingProvider(provider)
    try {
      await onSelect(provider)
    } catch {
      setProcessingProvider(null)
    }
  }

  const isLoading = processingProvider !== null

  const providers: { id: PaymentProvider; label: string; sublabel: string; Logo: () => React.ReactElement; borderColor: string; hoverBg: string }[] = [
    {
      id: "stripe",
      label: "Stripe",
      sublabel: "Credit / Debit card · International",
      Logo: StripeLogo,
      borderColor: "border-[#6772E5]",
      hoverBg: "hover:bg-[#6772E5]/5",
    },
    {
      id: "konnect",
      label: "Konnect",
      sublabel: "D17 · Flouci · Local cards · Tunisia",
      Logo: KonnectLogo,
      borderColor: "border-[#FF6B35]",
      hoverBg: "hover:bg-[#FF6B35]/5",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isLoading) onOpenChange(v) }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-[var(--t2)]">{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-1">
          {providers.map(({ id, label, sublabel, Logo, borderColor, hoverBg }) => {
            const isThis = processingProvider === id
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                disabled={isLoading}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-xl border-2 bg-white px-5 py-4 text-start transition-all duration-200",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  isThis
                    ? cn(borderColor, "shadow-md scale-[0.99]")
                    : cn("border-[var(--bd)]", hoverBg, "hover:border-opacity-80 cursor-pointer hover:shadow-sm"),
                )}
              >
                <div className="flex flex-col gap-1">
                  <Logo />
                  <span className="text-xs text-[var(--t3)] mt-1">{sublabel}</span>
                </div>
                {isThis ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--t2)] shrink-0" />
                ) : (
                  <span className="text-sm font-medium text-[var(--t1)] shrink-0">{label} →</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-[var(--t3)]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secure &amp; encrypted payment</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
