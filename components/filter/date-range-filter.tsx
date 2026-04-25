"use client"
import { useState } from "react"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select"

interface DateRangeFilterProps {
  value?: { from?: string; to?: string }
  onChange: (value: { from?: string; to?: string }) => void
  presets?: Array<{ id: string; label: string; value: { from: string; to: string } }>
}

const DEFAULT_PRESETS = [
  {
    id: "today",
    label: "Today",
    value: {
      from: new Date().toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
  },
  {
    id: "last7days",
    label: "Last 7 days",
    value: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
  },
  {
    id: "last30days",
    label: "Last 30 days",
    value: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
  },
  {
    id: "thisMonth",
    label: "This Month",
    value: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
  },
  { id: "custom", label: "Custom", value: { from: "", to: "" } },
]

export function DateRangeFilter({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-[240px] justify-start">
          <Calendar className="mr-2 h-4 w-4" />
          {value?.from && value?.to
            ? `${value.from} → ${value.to}`
            : "Select date range"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Select
            value={selectedPreset}
            onValueChange={(val) => {
              setSelectedPreset(val)
              const preset = presets.find((p) => p.id === val)
              if (preset && preset.value.from) {
                onChange(preset.value)
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Quick select" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">From</label>
              <input
                type="date"
                className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                value={value?.from || ""}
                onChange={(e) => onChange({ ...value, from: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">To</label>
              <input
                type="date"
                className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                value={value?.to || ""}
                onChange={(e) => onChange({ ...value, to: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                onChange({})
                setSelectedPreset("")
                setIsOpen(false)
              }}
            >
              Clear
            </Button>
            <Button size="sm" className="flex-1" onClick={() => setIsOpen(false)}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
