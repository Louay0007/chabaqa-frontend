import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, DollarSign, Users } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Dispatch, SetStateAction } from "react"

interface TimelinePricingStepProps {
  formData: {
    depositAmount: string
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
            <Label htmlFor="depositAmount">Deposit Amount (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="depositAmount"
                type="number"
                placeholder="50"
                className="pl-10"
                value={formData.depositAmount}
                onChange={(e) => handleInputChange("depositAmount", e.target.value)}
              />
            </div>
          </div>

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
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="completionReward"
                  type="number"
                  placeholder="25"
                  className="pl-10"
                  value={formData.rewards.completionReward}
                  onChange={(e) => handleInputChange("rewards.completionReward", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topPerformerBonus" className="text-sm">
                Top Performer Bonus
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="topPerformerBonus"
                  type="number"
                  placeholder="100"
                  className="pl-10"
                  value={formData.rewards.topPerformerBonus}
                  onChange={(e) => handleInputChange("rewards.topPerformerBonus", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="streakBonus" className="text-sm">
                Streak Bonus
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="streakBonus"
                  type="number"
                  placeholder="10"
                  className="pl-10"
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