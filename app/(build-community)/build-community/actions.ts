"use server"

import { communitiesApi } from "@/lib/api/communities.api"

interface CommunityFormData {
  name: string
  bio: string
  status: string
  joinFee: string
  customFee: string
  socialLinks: {
    instagram: string
    twitter: string
    facebook: string
    youtube: string
    linkedin: string
  }
}

export async function createCommunity(formData: CommunityFormData) {
  try {
    // Validate data
    if (!formData.name.trim()) {
      return {
        success: false,
        error: "Community name is required",
      }
    }

    if (formData.name.trim().length < 3) {
      return {
        success: false,
        error: "Community name must be at least 3 characters",
      }
    }

    if (formData.joinFee === "paid" && !formData.customFee) {
      return {
        success: false,
        error: "Custom fee is required for paid communities",
      }
    }

    if (formData.joinFee === "paid") {
      const fee = parseFloat(formData.customFee)
      if (isNaN(fee) || fee <= 0) {
        return {
          success: false,
          error: "Custom fee must be a positive number",
        }
      }
    }

    // Save to database via API
    const result = await communitiesApi.create({
      name: formData.name.trim(),
      country: "TN", // Default country, should be configurable
      status: "public",
      joinFee: formData.joinFee === "paid" ? "paid" : "free",
      feeAmount: formData.joinFee === "paid" ? formData.customFee : "0",
      currency: "TND",
      socialLinks: {
        instagram: formData.socialLinks.instagram,
        tiktok: formData.socialLinks.twitter,
        facebook: formData.socialLinks.facebook,
        youtube: formData.socialLinks.youtube,
        linkedin: formData.socialLinks.linkedin,
      },
    })

    return {
      success: true,
      message: "Community created successfully!",
      communityId: result?.data?._id || result?.data?.id || `community_${Date.now()}`,
    }
  } catch (error) {
    console.error("Error creating community:", error)
    return {
      success: false,
      error: "Failed to create community. Please try again.",
    }
  }
}

export async function uploadCommunityImage(formData: FormData) {
  try {
    const file = formData.get("image") as File
    
    if (!file) {
      return {
        success: false,
        error: "No image file provided",
      }
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
      }
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File size too large. Please upload an image smaller than 5MB.",
      }
    }

    // Upload to storage service via media API
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api"
    const uploadRes = await fetch(`${apiBase}/media/upload`, {
      method: "POST",
      body: (() => {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("purpose", "community_logo")
        return fd
      })(),
    })

    if (!uploadRes.ok) {
      throw new Error(`Upload failed with status ${uploadRes.status}`)
    }

    const uploadData = await uploadRes.json()
    const imageUrl = uploadData?.data?.url || uploadData?.url || uploadData?.data?.file?.url

    return {
      success: true,
      imageUrl: imageUrl || `/placeholder-community-${Date.now()}.jpg`,
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    return {
      success: false,
      error: "Failed to upload image. Please try again.",
    }
  }
}
