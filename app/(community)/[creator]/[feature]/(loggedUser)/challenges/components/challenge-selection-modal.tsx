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
import { useState, useMemo } from "react"
import { challengesApi } from "@/lib/api/challenges.api"

interface ChallengeSelectionModalProps {
  challenge: any
  setSelectedChallenge: (id: string | null) => void
}

export default function ChallengeSelectionModal({ challenge, setSelectedChallenge }: ChallengeSelectionModalProps) {
  const { toast } = useToast()
  
  const [promoCode, setPromoCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!challenge) return null

  const paymentAmount = challenge?.depositAmount ?? challenge?.pricing?.depositAmount ?? challenge?.participationFee ?? challenge?.pricing?.participationFee ?? challenge?.pricing?.price ?? 0
  const completionReward = challenge?.completionReward ?? challenge?.pricing?.completionReward ?? 0

  const handleJoin = async () => {
    setIsSubmitting(true)
    try {
      const challengeId = String(challenge.id || challenge._id)
      console.log('[Join Challenge] Challenge ID:', challengeId)
      console.log('[Join Challenge] Deposit Amount:', paymentAmount)

      if (!paymentAmount || paymentAmount <= 0) {
        const response = await challengesApi.join(challengeId)
        toast({
          title: "Success!",
          description: response?.message || "You have joined the challenge successfully!",
        })
        window.location.reload()
        return
      }

      const result = await (challengesApi as any).initStripePayment(challengeId, promoCode.trim() || undefined)
      const checkoutUrl = result?.data?.checkoutUrl || result?.checkoutUrl
      if (!checkoutUrl) {
        throw new Error('Unable to start checkout. Please try again.')
      }
      window.location.href = checkoutUrl
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
              <p className="text-xs font-semibold">{paymentAmount > 0 ? `$${paymentAmount}` : 'Free'}</p>
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
          {paymentAmount > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-[11px] text-amber-800">
                Pay <strong>${paymentAmount}</strong> to join. Complete to get <strong>${completionReward}</strong> back!
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
                : paymentAmount > 0 
                  ? `Proceed to payment`
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
