"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Upload, X, ArrowLeft, Plus, Eye, Save, Palette, Type, Layout, Zap } from "lucide-react"
import Image from "next/image"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  name: z.string().min(3, "Community name must be at least 3 characters").max(50),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  longDescription: z.string().min(50, "Long description must be at least 50 characters").optional(),
  isPrivate: z.boolean(),
  categories: z.array(z.string()),
  guidelines: z.string(),
  settings: z.object({
    primaryColor: z.string().default("#6366F1"),
    secondaryColor: z.string().default("#10B981"),
    logo: z.string().optional(),
    welcomeMessage: z.string().optional(),
    features: z.array(z.string()).default([]),
    benefits: z.array(z.string()).default([]),
    showHero: z.boolean().default(true),
    showFeatures: z.boolean().default(true),
    showPosts: z.boolean().default(true),
    showBenefits: z.boolean().default(true),
    showTestimonials: z.boolean().default(false),
    showStats: z.boolean().default(true),
    enableAnimations: z.boolean().default(true),
    customCSS: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }).default({}),
  coverImage: z.string().optional(),
})

export default function CreateCommunityPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("basic")
  const [hasChanges, setHasChanges] = useState(false)
  const [bannerPreview, setBannerPreview] = useState<string>("")
  const [iconPreview, setIconPreview] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [iconFile, setIconFile] = useState<File | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      longDescription: "",
      isPrivate: false,
      categories: [],
      guidelines: "",
      settings: {
        primaryColor: "#6366F1",
        secondaryColor: "#10B981",
        welcomeMessage: "",
        features: [],
        benefits: [],
        showHero: true,
        showFeatures: true,
        showPosts: true,
        showBenefits: true,
        showTestimonials: false,
        showStats: true,
        enableAnimations: true,
      }
    },
  })

  const slugify = (s: string) => s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true)
      const slug = slugify(values.name)
      const category = values.categories?.[0] || "general"

      // Upload files if selected
      let coverUrl: string | undefined = bannerPreview || values.coverImage
      let iconUrl: string | undefined = iconPreview || values.settings.logo
      try {
        if (bannerFile) {
          const up = await api.storage.upload(bannerFile as any).catch(() => null as any)
          coverUrl = up?.data?.url || up?.url || coverUrl
        }
        if (iconFile) {
          const up = await api.storage.upload(iconFile as any).catch(() => null as any)
          iconUrl = up?.data?.url || up?.url || iconUrl
        }
      } catch {}

      const payload = {
        name: values.name,
        slug,
        description: values.description,
        longDescription: values.longDescription,
        category,
        tags: values.categories || [],
        priceType: 'free' as const,
        price: undefined as number | undefined,
        image: iconUrl,
        coverImage: coverUrl,
      }
      const created = await api.communities.create(payload as any)
      const comm = (created as any)?.data || created
      const to = `/community/${comm?.slug || slug}/dashboard`
      toast({ title: "Community created", description: `${values.name} is live.` })
      router.push(to)
    } catch (e) {
      // Optionally show a toast; for now, keep console
      console.error('Create community failed', e)
      toast({ title: "Failed to create community", description: (e as any)?.message || 'Please try again.', variant: 'destructive' as any })
    } finally {
      setSubmitting(false)
    }
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
        setHasChanges(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIconFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result as string)
        setHasChanges(true)
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    const sub = form.watch(() => setHasChanges(true))
    return () => sub.unsubscribe?.()
  }, [form])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Community</h1>
            <p className="text-gray-600 mt-1">Set up a new community for your audience to connect and engage</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setHasChanges(false)} className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </Button>

          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={!hasChanges || submitting}
            className="flex items-center space-x-2"
            style={{
              backgroundColor: form.getValues("settings.primaryColor"),
              opacity: hasChanges ? 1 : 0.5,
            }}
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Creating...' : 'Create Community'}</span>
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div
          className="border rounded-lg p-4 mb-8"
          style={{
            backgroundColor: `${form.getValues("settings.primaryColor")}10`,
            borderColor: `${form.getValues("settings.primaryColor")}30`,
          }}
        >
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: form.getValues("settings.primaryColor") }}
            ></div>
            <p className="font-medium" style={{ color: form.getValues("settings.primaryColor") }}>
              You have unsaved changes
            </p>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <EnhancedCard>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide the essential details about your community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Web Development Masters" {...field} />
                    </FormControl>
                    <FormDescription>
                      Choose a unique name that represents your community
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What is your community about?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what members can expect from your community
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Private Community</FormLabel>
                      <FormDescription>
                        Require approval for new members to join
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </EnhancedCard>

          {/* Media Upload */}
          <EnhancedCard>
            <CardHeader>
              <CardTitle>Community Media</CardTitle>
              <CardDescription>
                Upload visual assets for your community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Banner Upload */}
              <div className="space-y-4">
                <Label>Community Banner</Label>
                <div className="relative">
                  {bannerPreview ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden">
                      <Image
                        src={bannerPreview}
                        alt="Banner preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setBannerPreview("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Upload banner image</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleBannerUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Icon Upload */}
              <div className="space-y-4">
                <Label>Community Icon</Label>
                <div className="relative">
                  {iconPreview ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden">
                      <Image
                        src={iconPreview}
                        alt="Icon preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-0 right-0"
                        onClick={() => setIconPreview("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">Icon</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleIconUpload}
                      />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </EnhancedCard>

          {/* Guidelines */}
          <EnhancedCard>
            <CardHeader>
              <CardTitle>Community Guidelines</CardTitle>
              <CardDescription>
                Set the rules and expectations for your community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="guidelines"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Enter community guidelines..."
                        className="resize-none min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Clear guidelines help maintain a healthy community environment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </EnhancedCard>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline">
              Save as Draft
            </Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Community'}</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}