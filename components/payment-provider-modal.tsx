"use client"

import React, { useState } from "react"
import Image from "next/image"
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
    <Image
      src="/Logos/PNG/stripe.png"
      alt="Stripe"
      width={80}
      height={40}
      className="h-7 w-auto object-contain"
      unoptimized
    />
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

        {/* Stripe test cards */}
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Test Cards</p>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
            <div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">✓ Success</p>
              <p className="text-xs font-mono font-semibold text-emerald-800 mt-0.5">4242 4242 4242 4242</p>
            </div>
            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-300">TEST CARD</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <div>
              <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide">✕ Declined</p>
              <p className="text-xs font-mono font-semibold text-red-800 mt-0.5">4000 0000 0000 0002</p>
            </div>
            <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-300">TEST CARD</span>
          </div>
          <p className="text-[9px] text-gray-400 text-center">Any future expiry · any CVC · any ZIP</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
