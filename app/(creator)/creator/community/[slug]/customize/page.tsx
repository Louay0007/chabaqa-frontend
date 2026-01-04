"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Eye, Smartphone, Tablet, Monitor, Palette, Type, Layout, Zap } from "lucide-react"
import { ImageUpload } from "@/app/(dashboard)/components/image-upload"
import { ColorPicker } from "@/app/(dashboard)/components/color-picker"
import { cn } from "@/lib/utils"
import FeaturePreview from "@/app/(creator)/creator/community/[slug]/customize/components/feature-preview"
import { communitiesApi } from "@/lib/api/communities.api"
import { Select, SelectItem, SelectValue, SelectTrigger, SelectContent } from "@radix-ui/react-select"

export default function CustomizeCommunityPage() {
  const params = useParams()
  const router = useRouter()
  const [community, setCommunity] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [activeTab, setActiveTab] = useState("design")
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setLoading(true)
        setError(null)
        const slug = params.slug as string
        if (!slug) {
          setError("Community slug not found")
          return
        }
        
        const response = await communitiesApi.getBySlug(slug)
        if (response && response.data) {
          setCommunity(response.data)
        } else {
          setError("Community not found")
        }
      } catch (err) {
        console.error("Error fetching community:", err)
        setError("Failed to load community. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchCommunity()
  }, [params.slug])

  const handleSave = async () => {
    try {
      setLoading(true)
      const { id } = community

      if (!id) {
        setError("Community ID not found")
        return
      }

      // The community state has the correct structure, just remove fields that shouldn't be sent.
      const { _id, id: communityId, ...updateData } = community

      const response = await communitiesApi.update(id, updateData)
      if (response && response.data) {
        setCommunity(response.data)
        setHasChanges(false)
        // Show success toast/notification
        console.log("Community updated successfully")
      }
    } catch (err) {
      console.error("Error saving community:", err)
      setError("Failed to save changes. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setCommunity((prev: any) => ({
      ...prev,
      [field]: value,
    }))
    setHasChanges(true)
  }

  const handleSettingsChange = (field: string, value: any) => {
    setCommunity((prev: any) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }))
    setHasChanges(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Community not found"}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const deviceIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
  }


  return (
    
      <div className="space-y-8 p-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customize {community.name}</h1>
              <p className="text-gray-600 mt-1">Personalize your community's appearance and settings</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Device Preview Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {(["desktop", "tablet", "mobile"] as const).map((device) => {
                const Icon = deviceIcons[device]
                return (
                  <Button
                    key={device}
                    variant={previewDevice === device ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewDevice(device)}
                    className={cn(
                      "px-3 py-2 transition-all duration-200",
                      previewDevice === device ? "bg-white shadow-sm" : "hover:bg-gray-200",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="ml-2 hidden sm:inline capitalize">{device}</span>
                  </Button>
                )
              })}
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowPreview(true)} className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </Button>

              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center space-x-2"
                style={{
                  backgroundColor: hasChanges ? community.settings.primaryColor : undefined,
                  opacity: hasChanges ? 1 : 0.5,
                }}
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </Button>
            </div>
          </div>
        </div>

        {hasChanges && (
          <div
            className="border rounded-lg p-4"
            style={{
              backgroundColor: `${community.settings.primaryColor}10`,
              borderColor: `${community.settings.primaryColor}30`,
            }}
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: community.settings.primaryColor }}
              ></div>
              <p className="font-medium" style={{ color: community.settings.primaryColor }}>
                You have unsaved changes
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Customization Panel */}
          <div className="xl:col-span-3">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b" style={{ borderColor: `${community.settings.primaryColor}20` }}>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" style={{ color: community.settings.primaryColor }} />
                  <span>Customization Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-50 rounded-none border-b">
                    <TabsTrigger value="design" className="flex items-center space-x-2">
                      <Palette className="w-4 h-4" />
                      <span>Design</span>
                    </TabsTrigger>
                    <TabsTrigger value="content" className="flex items-center space-x-2">
                      <Type className="w-4 h-4" />
                      <span>Content</span>
                    </TabsTrigger>
                    <TabsTrigger value="layout" className="flex items-center space-x-2">
                      <Layout className="w-4 h-4" />
                      <span>Layout</span>
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="flex items-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>Advanced</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="design" className="p-6 sm:p-8 space-y-8">


                    {/* Color Customization */}
                    <div className="space-y-6">
                      <Label className="text-lg font-semibold">Brand Colors</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label>Primary Color</Label>
                          <ColorPicker
                            color={community.settings.primaryColor}
                            onChange={(color) => handleSettingsChange("primaryColor", color)}
                          />
                          <p className="text-xs text-gray-500">Used for buttons, accents, and primary elements</p>
                        </div>
                        <div className="space-y-3">
                          <Label>Secondary Color</Label>
                          <ColorPicker
                            color={community.settings.secondaryColor}
                            onChange={(color) => handleSettingsChange("secondaryColor", color)}
                          />
                          <p className="text-xs text-gray-500">Used for gradients and secondary elements</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Images */}
                    <div className="space-y-6">
                      <Label className="text-lg font-semibold">Images</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label>Cover Image</Label>
                          <ImageUpload
                            currentImage={community.coverImage}
                            onImageChange={(image) => handleInputChange("coverImage", image)}
                            aspectRatio="wide"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label>Logo</Label>
                          <ImageUpload
                            currentImage={community.settings.logo}
                            onImageChange={(image) => handleSettingsChange("logo", image)}
                            aspectRatio="square"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="p-6 sm:p-8 space-y-8">
                    {/* Basic Information */}
                    <div className="space-y-6">
                      <Label className="text-lg font-semibold">Basic Information</Label>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Community Name</Label>
                          <Input
                            id="name"
                            value={community.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Short Description</Label>
                          <Input
                            id="description"
                            value={community.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="longDescription">Long Description</Label>
                          <Textarea
                            id="longDescription"
                            value={community.longDescription || ''}
                            onChange={(e) => handleInputChange("longDescription", e.target.value)}
                            rows={4}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={community.category || ''}
                            onChange={(e) => handleInputChange("category", e.target.value)}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Tags */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {(community.tags || []).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-2 pl-3 pr-1">
                            {tag}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full"
                              onClick={() => {
                                const newTags = [...community.tags]
                                newTags.splice(index, 1)
                                handleInputChange("tags", newTags)
                              }}
                            >
                              &times;
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="newTagInput"
                          placeholder="Add a tag and press Enter"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.currentTarget.value) {
                              e.preventDefault()
                              const newTags = [...(community.tags || []), e.currentTarget.value]
                              handleInputChange("tags", newTags)
                              e.currentTarget.value = ""
                            }
                          }}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Welcome Message */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Welcome Message</Label>
                      <Textarea
                        value={community.settings.welcomeMessage}
                        onChange={(e) => handleSettingsChange("welcomeMessage", e.target.value)}
                        rows={3}
                        placeholder="Welcome new members with a personalized message..."
                      />
                    </div>

                    <Separator />

                    {/* Features */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Community Features</Label>
                      <div className="space-y-3">
                        {community.settings.features.map((feature: string, index: number) => (
                          <div key={index} className="flex items-center space-x-3">
                            <Input
                              value={feature}
                              onChange={(e) => {
                                const newFeatures = [...community.settings.features]
                                newFeatures[index] = e.target.value
                                handleSettingsChange("features", newFeatures)
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newFeatures = community.settings.features.filter(
                                  (_: any, i: number) => i !== index,
                                )
                                handleSettingsChange("features", newFeatures)
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newFeatures = [...community.settings.features, "New Feature"]
                            handleSettingsChange("features", newFeatures)
                          }}
                          style={{
                            borderColor: community.settings.primaryColor,
                            color: community.settings.primaryColor,
                          }}
                        >
                          Add Feature
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Benefits */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Member Benefits</Label>
                      <div className="space-y-3">
                        {community.settings.benefits.map((benefit: string, index: number) => (
                          <div key={index} className="flex items-center space-x-3">
                            <Textarea
                              value={benefit}
                              onChange={(e) => {
                                const newBenefits = [...community.settings.benefits]
                                newBenefits[index] = e.target.value
                                handleSettingsChange("benefits", newBenefits)
                              }}
                              rows={2}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newBenefits = community.settings.benefits.filter(
                                  (_: any, i: number) => i !== index,
                                )
                                handleSettingsChange("benefits", newBenefits)
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newBenefits = [...community.settings.benefits, "New benefit for members"]
                            handleSettingsChange("benefits", newBenefits)
                          }}
                          style={{
                            borderColor: community.settings.primaryColor,
                            color: community.settings.primaryColor,
                          }}
                        >
                          Add Benefit
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="layout" className="p-6 sm:p-8 space-y-8">
                    {/* Section Toggles */}
                    <div className="space-y-6">
                      <Label className="text-lg font-semibold">Page Sections</Label>
                      <div className="space-y-4">
                        {[
                          { key: "showHero", label: "Hero Section", description: "Main banner with community info" },
                          {
                            key: "showFeatures",
                            label: "Features Section",
                            description: "Highlight community features",
                          },
                          { key: "showPosts", label: "Posts Section", description: "Recent community updates" },
                          { key: "showBenefits", label: "Benefits Section", description: "Member benefits and perks" },
                          { key: "showTestimonials", label: "Testimonials", description: "Member success stories" },
                          { key: "showStats", label: "Statistics", description: "Community metrics and numbers" },
                        ].map((section) => (
                          <div
                            key={section.key}
                            className="flex items-center justify-between p-4 border rounded-lg"
                            style={{ borderColor: `${community.settings.primaryColor}20` }}
                          >
                            <div>
                              <Label className="font-medium">{section.label}</Label>
                              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                            </div>
                            <Switch
                              checked={community.settings[section.key] !== false}
                              onCheckedChange={(checked) => handleSettingsChange(section.key, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Layout Options */}
                    <div className="space-y-6">
                      <Label className="text-lg font-semibold">Layout Options</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label>Header Style</Label>
                          <select
                            value={community.settings.headerStyle || "default"}
                            onChange={(e) => handleSettingsChange("headerStyle", e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="default">Default</option>
                            <option value="centered">Centered</option>
                            <option value="minimal">Minimal</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <Label>Content Width</Label>
                          <select
                            value={community.settings.contentWidth || "normal"}
                            onChange={(e) => handleSettingsChange("contentWidth", e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="narrow">Narrow</option>
                            <option value="normal">Normal</option>
                            <option value="wide">Wide</option>
                            <option value="full">Full Width</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="p-6 sm:p-8 space-y-8">
                    {/* Pricing */}
                    <div className="space-y-6">
                      <Label className="text-lg font-semibold">Pricing</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price</Label>
                          <Input
                            id="price"
                            type="number"
                            value={community.price || 0}
                            onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priceType">Price Type</Label>
                          <Select
                            value={community.priceType || "free"}
                            onValueChange={(value) => handleInputChange("priceType", value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select price type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="one-time">One-time</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="per session">Per Session</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Community Type */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Community Type</Label>
                      <Select
                        value={community.type || "community"}
                        onValueChange={(value) => handleInputChange("type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="community">Community</SelectItem>
                          <SelectItem value="course">Course</SelectItem>
                          <SelectItem value="challenge">Challenge</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="oneToOne">One-to-One</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Other Advanced Settings from original file would go here */}
                    <div className="space-y-6">
                      <Label className="text-lg font-semibold">Custom Domain</Label>
                      <div className="space-y-2">
                        <Label htmlFor="customDomain">Domain Name</Label>
                        <Input
                          id="customDomain"
                          placeholder="e.g., community.yourdomain.com"
                          value={community.settings?.customDomain || ''}
                          onChange={(e) => handleSettingsChange("customDomain", e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <Label className="text-lg font-semibold">Custom Scripts</Label>
                      <div className="space-y-2">
                        <Label htmlFor="headerScripts">Header Scripts</Label>
                        <Textarea
                          id="headerScripts"
                          rows={4}
                          placeholder={`<script>...</script>`}
                          value={community.settings?.headerScripts || ''}
                          onChange={(e) => handleSettingsChange("headerScripts", e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview Sidebar */}
          <div className="xl:col-span-1">
            <Card className="border-0 shadow-lg sticky top-8">
              <CardHeader className="border-b" style={{ borderColor: `${community.settings.primaryColor}20` }}>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" style={{ color: community.settings.primaryColor }} />
                    <span>Live Preview</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs capitalize"
                    style={{
                      borderColor: community.settings.primaryColor,
                      color: community.settings.primaryColor,
                    }}
                  >
                    {previewDevice}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div
                  className={cn(
                    "border rounded-lg overflow-hidden bg-white transition-all duration-300 shadow-lg",
                    previewDevice === "desktop" && "aspect-video",
                    previewDevice === "tablet" && "aspect-[4/5] max-w-md mx-auto",
                    previewDevice === "mobile" && "aspect-[9/16] max-w-xs mx-auto",
                  )}
                  style={{ borderColor: `${community.settings.primaryColor}30` }}
                >
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="w-full h-full">
                      <FeaturePreview community={community} previewDevice={previewDevice} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    className="w-full"
                    style={{
                      borderColor: community.settings.primaryColor,
                      color: community.settings.primaryColor,
                    }}
                  >
                    Full Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


    
  )
}
