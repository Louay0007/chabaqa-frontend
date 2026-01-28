import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ChallengeRewardsTab({
  formData,
  onInputChange,
  totalParticipants,
}: {
  formData: any
  onInputChange: (field: string, value: any) => void
  totalParticipants: number
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <EnhancedCard>
        <CardHeader>
          <CardTitle>Deposit & Rewards</CardTitle>
          <CardDescription>Configure challenge financial incentives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="depositAmount">Deposit Amount ($)</Label>
            <Input
              id="depositAmount"
              type="number"
              placeholder="50"
              value={formData.depositAmount}
              onChange={(e) => onInputChange("depositAmount", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Amount participants pay to join the challenge</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completionReward">Completion Reward ($)</Label>
            <Input
              id="completionReward"
              type="number"
              placeholder="25"
              value={formData.completionReward}
              onChange={(e) => onInputChange("completionReward", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Reward for completing the challenge</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topPerformerBonus">Top Performer Bonus ($)</Label>
            <Input
              id="topPerformerBonus"
              type="number"
              placeholder="100"
              value={formData.topPerformerBonus}
              onChange={(e) => onInputChange("topPerformerBonus", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Additional bonus for the top performer</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="streakBonus">Daily Streak Bonus ($)</Label>
            <Input
              id="streakBonus"
              type="number"
              placeholder="10"
              value={formData.streakBonus}
              onChange={(e) => onInputChange("streakBonus", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Bonus for maintaining daily streaks</p>
          </div>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard>
        <CardHeader>
          <CardTitle>Reward Summary</CardTitle>
          <CardDescription>Overview of challenge economics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Deposits</span>
            <span className="font-semibold">${(Number(formData.depositAmount) || 0) * totalParticipants}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Completion Rewards</span>
            <span className="font-semibold">${(Number(formData.completionReward) || 0) * totalParticipants}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Top Performer Bonus</span>
            <span className="font-semibold">${Number(formData.topPerformerBonus) || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated Streak Bonuses</span>
            <span className="font-semibold">${(Number(formData.streakBonus) || 0) * 10}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Net Revenue</span>
              <span className="font-bold text-green-600">
                $
                {(Number(formData.depositAmount) || 0) * totalParticipants -
                  (Number(formData.completionReward) || 0) * totalParticipants -
                  (Number(formData.topPerformerBonus) || 0) -
                  (Number(formData.streakBonus) || 0) * 10}
              </span>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}