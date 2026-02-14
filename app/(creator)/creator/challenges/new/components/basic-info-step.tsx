"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, Upload } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface BasicInfoStepProps {
  formData: {
    title: string
    description: string
    thumbnail: string
    category: string
    difficulty: string
    duration: string
  }
  setFormData: (data: any) => void
  validationErrors?: Record<string, boolean>
}

const categories = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Design",
  "Marketing",
  "Fitness",
  "Productivity",
  "Learning",
]

const difficulties = ["Beginner", "Intermediate", "Advanced", "All Levels"]
const durations = ["7 days", "14 days", "21 days", "30 days", "60 days", "90 days"]

export function BasicInfoStep({ formData, setFormData, validationErrors = {} }: BasicInfoStepProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const max = 2 * 1024 * 1024
    if (file.size > max) {
      toast({ title: 'File too large', description: 'Please upload an image up to 2MB.', variant: 'destructive' as any })
      return
    }
    setUploading(true)
    try {
      const res = await api.storage.upload(file)
      const uploaded = (res as any)?.data || res
      const url = uploaded?.url || uploaded?.data?.url
      if (!url) throw new Error('Upload did not return a URL')
      setFormData((prev: any) => ({ ...prev, thumbnail: url }))
      toast({ title: 'Thumbnail uploaded', description: file.name })
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message || 'Try again later.', variant: 'destructive' as any })
    } finally {
      setUploading(false)
    }
  }, [setFormData])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onPick = useCallback(() => fileInputRef.current?.click(), [])

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2 text-challenges-500" />
          Basic Challenge Information
        </CardTitle>
        <CardDescription>Start with the fundamentals of your challenge</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Challenge Title *</Label>
          <Input
            id="title"
            placeholder="e.g., 30-Day Coding Challenge"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className={validationErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {validationErrors.title && (
            <p className="text-sm text-red-500">Title must be at least 3 characters</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Challenge Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe what participants will achieve in this challenge..."
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className={validationErrors.description ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {validationErrors.description && (
            <p className="text-sm text-red-500">Description must be at least 10 characters</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange("category", value)}
            >
              <SelectTrigger className={validationErrors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.category && (
              <p className="text-sm text-red-500">Please select a category</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level *</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) => handleInputChange("difficulty", value)}
            >
              <SelectTrigger className={validationErrors.difficulty ? "border-red-500" : ""}>
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.difficulty && (
              <p className="text-sm text-red-500">Please select a difficulty level</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Challenge Duration *</Label>
          <Select
            value={formData.duration}
            onValueChange={(value) => handleInputChange("duration", value)}
          >
            <SelectTrigger className={validationErrors.duration ? "border-red-500" : ""}>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {durations.map((duration) => (
                <SelectItem key={duration} value={duration}>
                  {duration}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.duration && (
            <p className="text-sm text-red-500">Please select a duration</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Challenge Thumbnail</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            aria-label="Upload challenge thumbnail"
          />
          <div
            onClick={onPick}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
            onDrop={onDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden text-center hover:border-challenges-500 transition-colors cursor-pointer"
          >
            {formData.thumbnail ? (
              <div className="relative w-full aspect-video">
                <img src={formData.thumbnail} alt="Challenge thumbnail" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="p-8">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB (1920x1080 recommended - 16:9)</p>
              </div>
            )}
          </div>
          {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}