"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Zap, Calendar, Clock, DollarSign, Trophy, CheckCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface ChallengeSelectionModalProps {
  challenge: any
  setSelectedChallenge: (id: string | null) => void
}

export default function ChallengeSelectionModal({ challenge, setSelectedChallenge }: ChallengeSelectionModalProps) {
  if (!challenge) return null

  const handleJoin = () => {
    console.log("Joining challenge:", challenge.id)
    setSelectedChallenge(null)
  }

  return (
    <Dialog open={!!challenge} onOpenChange={() => setSelectedChallenge(null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="relative">
          <div className="bg-gradient-to-r from-challenges-500 to-orange-500 p-8 text-white rounded-t-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="h-8 w-8" />
              <h2 className="text-3xl font-bold">{challenge.title}</h2>
            </div>
            <p className="text-challenges-100 text-lg">{challenge.description}</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-challenges-500" />
                <div className="font-semibold">{formatDate(challenge.startDate)}</div>
                <div className="text-sm text-muted-foreground">Start Date</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-challenges-500" />
                <div className="font-semibold">{challenge.duration}</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-challenges-500" />
                <div className="font-semibold">${challenge.depositAmount}</div>
                <div className="text-sm text-muted-foreground">Deposit</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-challenges-500" />
                <div className="font-semibold">${challenge.completionReward}</div>
                <div className="text-sm text-muted-foreground">Reward</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">What You'll Get</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Daily structured tasks</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Community support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Progress tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Completion rewards</span>
                </div>
              </div>
            </div>

            {challenge.notes && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Important Notes</h4>
                <p className="text-sm text-muted-foreground">{challenge.notes}</p>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-yellow-800">Payment Information</h4>
              <p className="text-sm text-yellow-700">
                You'll pay a ${challenge.depositAmount} deposit to join. Complete the challenge to get $
                {challenge.completionReward} back plus bonuses!
              </p>
            </div>

            <div className="flex space-x-4">
              <Button
                className="flex-1 bg-challenges-500 hover:bg-challenges-600"
                onClick={handleJoin}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Pay ${challenge.depositAmount} & Join Challenge
              </Button>
              <Button variant="outline" onClick={() => setSelectedChallenge(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}