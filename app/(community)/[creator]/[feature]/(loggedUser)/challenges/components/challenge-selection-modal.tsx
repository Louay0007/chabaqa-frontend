"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Zap, Calendar, Clock, DollarSign, Trophy, CheckCircle, Users, Target } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { tokenStorage } from "@/lib/token-storage"
import { useState, useMemo } from "react"

interface ChallengeSelectionModalProps {
  challenge: any
  setSelectedChallenge: (id: string | null) => void
}

export default function ChallengeSelectionModal({ challenge, setSelectedChallenge }: ChallengeSelectionModalProps) {
  const { toast } = useToast()
  
  const [promoCode, setPromoCode] = useState("")
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!challenge) return null

  const depositAmount = challenge?.depositAmount ?? 0
  const completionReward = challenge?.completionReward ?? 0

  const handleJoin = async () => {
    setIsSubmitting(true)
    try {
      const accessToken = tokenStorage.getAccessToken()
      if (!accessToken) {
        toast({
          title: "Authentication required",
          description: "Please sign in to join this challenge.",
          variant: "destructive",
        })
        return
      }

      if (depositAmount > 0 && !paymentProof) {
        toast({
          title: "Payment proof required",
          description: "Please upload a payment proof to submit your request.",
          variant: "destructive",
        })
        return
      }

      const challengeId = String(challenge.id || challenge._id)
      console.log('[Join Challenge] Challenge ID:', challengeId)
      console.log('[Join Challenge] Deposit Amount:', depositAmount)
      console.log('[Join Challenge] Has Payment Proof:', !!paymentProof)

      const promoQuery = promoCode.trim()
        ? `?promoCode=${encodeURIComponent(promoCode.trim())}`
        : ""

      const formData = new FormData()
      formData.append('challengeId', challengeId)
      if (paymentProof) {
        formData.append('proof', paymentProof)
      }

      const initResponse = await fetch(`/api/payments/manual/init/challenge${promoQuery}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: formData,
      })

      const initData = await initResponse.json().catch(() => null)
      console.log('[Join Challenge] Response:', initResponse.status, initData)
      
      if (!initResponse.ok) {
        // Check if user is already participating
        const errorMessage = initData?.error?.error?.message || initData?.message || initData?.error || 'Failed to join challenge'
        if (errorMessage.includes('already participating')) {
          toast({
            title: "Already Joined!",
            description: "You are already participating in this challenge. Redirecting...",
          })
          // Reload to show updated state
          window.location.reload()
          return
        }
        throw new Error(errorMessage)
      }

      toast({
        title: 'Success!',
        description: initData?.message || (depositAmount > 0 
          ? 'Payment proof submitted! Please wait for verification.' 
          : 'You have joined the challenge successfully!'),
      })

      // Reload the page to show updated participation status
      window.location.reload()
    } catch (error: any) {
      console.error('[Join Challenge] Error:', error)
      toast({
        title: "Failed to join",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={!!challenge} onOpenChange={() => setSelectedChallenge(null)}>
      <DialogContent className="w-[95vw] max-w-lg sm:w-full">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-challenges-500 to-orange-500">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-base font-bold line-clamp-1">{challenge.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
              <Calendar className="h-4 w-4 text-challenges-500" />
              <p className="text-[10px] text-muted-foreground">Start</p>
              <p className="text-xs font-semibold">{formatDate(challenge.startDate).split(',')[0]}</p>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
              <Clock className="h-4 w-4 text-challenges-500" />
              <p className="text-[10px] text-muted-foreground">Duration</p>
              <p className="text-xs font-semibold">{challenge.duration || '30d'}</p>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
              <DollarSign className="h-4 w-4 text-challenges-500" />
              <p className="text-[10px] text-muted-foreground">Deposit</p>
              <p className="text-xs font-semibold">{depositAmount > 0 ? `$${depositAmount}` : 'Free'}</p>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <p className="text-[10px] text-muted-foreground">Reward</p>
              <p className="text-xs font-semibold">${completionReward}</p>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-2.5 rounded-lg border">
            <h3 className="text-xs font-bold mb-1.5 flex items-center gap-1">
              <Target className="h-3 w-3 text-green-600" />
              What You'll Get
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { text: "Daily tasks", icon: CheckCircle },
                { text: "Support", icon: Users },
                { text: "Tracking", icon: Target },
                { text: "Rewards", icon: Trophy }
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-1.5 text-[11px]">
                  <item.icon className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Information */}
          {depositAmount > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-[11px] text-amber-800">
                Pay <strong>${depositAmount}</strong> to join. Complete to get <strong>${completionReward}</strong> back!
              </p>
            </div>
          )}

          {/* Form Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="promoCode" className="text-xs">Promo code</Label>
              <Input
                id="promoCode"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter code"
                disabled={isSubmitting}
                className="h-8 text-xs"
              />
            </div>

            {depositAmount > 0 && (
              <div className="space-y-1">
                <Label htmlFor="paymentProof" className="text-xs">Payment proof *</Label>
                <Input
                  id="paymentProof"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                  disabled={isSubmitting}
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 h-9 text-xs font-semibold bg-gradient-to-r from-challenges-500 to-orange-500 hover:from-challenges-600 hover:to-orange-600"
              onClick={handleJoin}
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? "Processing..." 
                : depositAmount > 0 
                  ? `Pay $${depositAmount} & Join` 
                  : "Join Free"
              }
            </Button>
            <Button 
              variant="outline" 
              className="h-9 px-4 text-xs" 
              onClick={() => setSelectedChallenge(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}