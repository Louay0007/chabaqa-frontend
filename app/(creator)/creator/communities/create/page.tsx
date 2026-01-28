"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Camera,
  Play,
  ArrowRight,
  Users,
  Lock,
  Globe,
  DollarSign,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Check,
  Globe2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { communitiesApi, type CreateCommunityData } from "@/lib/api/communities.api"
import { ImageUpload } from "@/app/(dashboard)/components/image-upload"
import { storageApi } from "@/lib/api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"

export default function CreateCommunityPage() {
  const router = useRouter()
  const { refreshCommunities, setSelectedCommunityId } = useCreatorCommunity()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    country: "",
    logo: "",
    coverImage: "",
    status: "public",
    joinFee: "free",
    feeAmount: "0",
    currency: "TND",
    socialLinks: {
      instagram: "",
      tiktok: "",
      facebook: "",
      youtube: "",
      linkedin: "",
      website: "",
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const updateFormData = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  // Submit community to backend using typed API client
  const submitCommunity = async () => {
    setIsSubmitting(true)
    setError("")

    try {
      // Map form data to API format matching backend DTO exactly
      const communityData: CreateCommunityData = {
        // Required fields
        name: formData.name,
        country: formData.country,
        status: formData.status as 'public' | 'private',
        joinFee: formData.joinFee as 'free' | 'paid',
        feeAmount: formData.feeAmount,
        currency: formData.currency as 'USD' | 'TND' | 'EUR',
        socialLinks: formData.socialLinks,

        // Optional fields using backend DTO field names
        bio: formData.bio || undefined,
        logo: formData.logo || undefined,
        coverImage: formData.coverImage || undefined,
        category: 'General',
        tags: [],
      }

      // Call API using typed client
      const response = await communitiesApi.create(communityData)

      setSuccess(true)
      console.log("Community created successfully:", response.data)

      // Get the new community ID from response
      const newCommunity = response.data as any
      const newCommunityId = newCommunity?._id || newCommunity?.id

      // Refresh communities list in context and select the new one
      await refreshCommunities()
      if (newCommunityId) {
        setSelectedCommunityId(newCommunityId)
      }

      // Redirect to creator dashboard after short delay
      setTimeout(() => {
        router.push('/creator/dashboard')
      }, 1000)

    } catch (err: any) {
      setError(err.message || "Failed to create community. Please try again.")
      console.error("Error creating community:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== "" && formData.country.trim() !== ""
      case 2:
        if (formData.joinFee === "paid") {
          return formData.feeAmount && parseFloat(formData.feeAmount) > 0
        }
        return true
      case 3:
        const socialLinks = formData.socialLinks
        return Object.values(socialLinks).some(link => link.trim() !== "")
      default:
        return false
    }
  }

  const nextStep = () => {
    if (canContinue() && currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Name your community</h2>
              <p className="text-gray-600 mb-6">You can always change this later.</p>

              {/* Community Logo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Community Logo</label>
                <div className="max-w-xs">
                  <ImageUpload
                    currentImage={formData.logo}
                    onImageChange={(url) => updateFormData("logo", url)}
                    aspectRatio="square"
                    maxSize={2}
                    showPreview={true}
                  />
                </div>
              </div>

              {/* Community Cover Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image (optional)</label>
                <ImageUpload
                  currentImage={formData.coverImage}
                  onImageChange={(url) => updateFormData("coverImage", url)}
                  aspectRatio="wide"
                  maxSize={5}
                  showPreview={true}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Community Name *</label>
                <Input
                  placeholder="e.g Creators Club"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="text-lg py-3 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
              <Input
                placeholder="e.g Tunis, France, Morocco..."
                value={formData.country}
                onChange={(e) => updateFormData("country", e.target.value)}
                className="text-lg py-3 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio (optional)</label>
              <Textarea
                placeholder="Tell people what your community is about..."
                value={formData.bio}
                onChange={(e) => updateFormData("bio", e.target.value)}
                className="min-h-[120px] border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] resize-none"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Settings</h2>
              <p className="text-gray-600 mb-6">Configure your community access and pricing.</p>

              <div className="space-y-6">
                {/* Status Selection */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">Community Status</label>
                  <RadioGroup
                    value={formData.status}
                    onValueChange={(value) => updateFormData("status", value)}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#8e78fb] transition-colors">
                      <RadioGroupItem value="public" id="public" className="text-[#8e78fb]" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <Label htmlFor="public" className="text-base font-medium cursor-pointer">
                            Public
                          </Label>
                          <p className="text-sm text-gray-500">Anyone can find and join your community</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#8e78fb] transition-colors">
                      <RadioGroupItem value="private" id="private" className="text-[#8e78fb]" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <Label htmlFor="private" className="text-base font-medium cursor-pointer">
                            Private
                          </Label>
                          <p className="text-sm text-gray-500">Only invited members can join</p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Join Fee Selection */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">Join Fee</label>
                  <RadioGroup
                    value={formData.joinFee}
                    onValueChange={(value) => updateFormData("joinFee", value)}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#8e78fb] transition-colors">
                      <RadioGroupItem value="free" id="free" className="text-[#8e78fb]" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <Label htmlFor="free" className="text-base font-medium cursor-pointer">
                            Free
                          </Label>
                          <p className="text-sm text-gray-500">No cost to join your community</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#8e78fb] transition-colors">
                      <RadioGroupItem value="paid" id="paid" className="text-[#8e78fb]" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="paid" className="text-base font-medium cursor-pointer">
                            Paid
                          </Label>
                          <p className="text-sm text-gray-500 mb-3">Set a membership fee</p>
                          {formData.joinFee === "paid" && (
                            <div className="space-y-2">
                              <Select value={formData.currency} onValueChange={(value) => updateFormData("currency", value)}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TND">🇹🇳 TND - Tunisian Dinar</SelectItem>
                                  <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                                  <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                placeholder="Amount (e.g. 25.50)"
                                value={formData.feeAmount}
                                onChange={(e) => updateFormData("feeAmount", e.target.value)}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Social Media Links</h2>
              <p className="text-gray-600 mb-6">Connect your community with social platforms. At least one is required.</p>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                  <Input
                    placeholder="Instagram username or URL"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => updateFormData("socialLinks.instagram", e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center">
                    <div className="text-white font-bold text-sm">TT</div>
                  </div>
                  <Input
                    placeholder="TikTok username or URL"
                    value={formData.socialLinks.tiktok}
                    onChange={(e) => updateFormData("socialLinks.tiktok", e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                    <Facebook className="w-6 h-6 text-white" />
                  </div>
                  <Input
                    placeholder="Facebook page URL"
                    value={formData.socialLinks.facebook}
                    onChange={(e) => updateFormData("socialLinks.facebook", e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Youtube className="w-6 h-6 text-white" />
                  </div>
                  <Input
                    placeholder="YouTube channel URL"
                    value={formData.socialLinks.youtube}
                    onChange={(e) => updateFormData("socialLinks.youtube", e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <Linkedin className="w-6 h-6 text-white" />
                  </div>
                  <Input
                    placeholder="LinkedIn page URL"
                    value={formData.socialLinks.linkedin}
                    onChange={(e) => updateFormData("socialLinks.linkedin", e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center">
                    <Globe2 className="w-6 h-6 text-white" />
                  </div>
                  <Input
                    placeholder="Your website URL"
                    value={formData.socialLinks.website}
                    onChange={(e) => updateFormData("socialLinks.website", e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-[#8e78fb] focus:ring-[#8e78fb] rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold text-gray-900">Create New Community</h1>
        <p className="text-gray-600 mt-2">Set up your community in 3 easy steps</p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${step === currentStep
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                : step < currentStep
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-gray-200 text-gray-500"
                }`}
            >
              {step < currentStep ? <Check className="w-5 h-5" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${step < currentStep ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-200"
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-700 text-sm">Your community has been created successfully! Redirecting...</p>
        </div>
      )}

      {/* Form Content */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        {currentStep > 1 ? (
          <Button variant="outline" onClick={prevStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        ) : (
          <div></div>
        )}

        <Button
          onClick={currentStep === 3 ? submitCommunity : nextStep}
          disabled={!canContinue() || isSubmitting}
          className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${canContinue() && !isSubmitting
            ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg hover:shadow-xl hover:scale-105"
            : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </div>
          ) : currentStep === 3 ? (
            "Create Community"
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}