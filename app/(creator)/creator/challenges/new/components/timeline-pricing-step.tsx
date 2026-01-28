import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Users } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Dispatch, SetStateAction } from "react"

interface TimelinePricingStepProps {
  formData: {
    currency?: string
    depositAmount: string
    participationFee?: string
    maxParticipants: string
    rewards: {
      completionReward: string
      topPerformerBonus: string
      streakBonus: string
    }
  }
  setFormData: (data: any) => void
  startDate?: Date
  setStartDate: Dispatch<SetStateAction<Date | undefined>>
  endDate?: Date
  setEndDate: Dispatch<SetStateAction<Date | undefined>>
}

export function TimelinePricingStep({
  formData,
  setFormData,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: TimelinePricingStepProps) {
  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev: any) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }))
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }))
    }
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-challenges-500" />
          Timeline & Pricing
        </CardTitle>
        <CardDescription>Set your challenge dates, deposit, and reward structure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar 
                  mode="single" 
                  selected={startDate} 
                  onSelect={setStartDate} 
                  initialFocus 
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar 
                  mode="single" 
                  selected={endDate} 
                  onSelect={setEndDate} 
                  initialFocus 
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="participationFee">Participation Fee (Price to Join)</Label>
            <div className="flex">
              <Select value={formData.currency || 'TND'} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TND">TND</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="participationFee"
                type="number"
                placeholder="0 (Free)"
                className="rounded-l-none"
                value={formData.participationFee || ''}
                onChange={(e) => handleInputChange("participationFee", e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Set to 0 or leave empty for free challenges</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="depositAmount">Deposit Amount (Refundable)</Label>
            <div className="flex">
              <Select value={formData.currency || 'TND'} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TND">TND</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="depositAmount"
                type="number"
                placeholder="0"
                className="rounded-l-none"
                value={formData.depositAmount}
                onChange={(e) => handleInputChange("depositAmount", e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Optional deposit returned on completion</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Max Participants</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="maxParticipants"
                type="number"
                placeholder="100"
                className="pl-10"
                value={formData.maxParticipants}
                onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Reward Structure</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="completionReward" className="text-sm">
                Completion Reward
              </Label>
              <div className="flex">
                <Select value={formData.currency || 'USD'} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="TND">TND</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="completionReward"
                  type="number"
                  placeholder="25"
                  className="rounded-l-none"
                  value={formData.rewards.completionReward}
                  onChange={(e) => handleInputChange("rewards.completionReward", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topPerformerBonus" className="text-sm">
                Top Performer Bonus
              </Label>
              <div className="flex">
                <Select value={formData.currency || 'USD'} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="TND">TND</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="topPerformerBonus"
                  type="number"
                  placeholder="100"
                  className="rounded-l-none"
                  value={formData.rewards.topPerformerBonus}
                  onChange={(e) => handleInputChange("rewards.topPerformerBonus", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="streakBonus" className="text-sm">
                Streak Bonus
              </Label>
              <div className="flex">
                <Select value={formData.currency || 'USD'} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="TND">TND</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="streakBonus"
                  type="number"
                  placeholder="10"
                  className="rounded-l-none"
                  value={formData.rewards.streakBonus}
                  onChange={(e) => handleInputChange("rewards.streakBonus", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  )
}