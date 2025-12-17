"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { productsApi, type CreateProductData } from "@/lib/api/products.api"

interface ProductVariantForm {
  id: string
  name: string
  price: number
  description?: string
}

interface DownloadFileForm {
  id: string
  name: string
  url: string
  type: string
  size?: string
}

interface ProductFormContextType {
  currentStep: number
  setCurrentStep: (step: number) => void
  formData: any
  handleInputChange: (field: string, value: any) => void
  handleArrayChange: (field: string, index: number, value: string) => void
  addArrayItem: (field: string) => void
  removeArrayItem: (field: string, index: number) => void
  addVariant: () => void
  updateVariant: (variantId: string, field: string, value: any) => void
  removeVariant: (variantId: string) => void
  addFile: () => void
  updateFile: (fileId: string, field: string, value: any) => void
  removeFile: (fileId: string) => void
  handleSubmit: () => void
}

const ProductFormContext = createContext<ProductFormContextType | undefined>(undefined)

export function ProductFormProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [communityId, setCommunityId] = useState<string>("")
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    price: 0,
    currency: "USD",
    category: "",
    type: "digital",
    isPublished: false,
    tags: [] as string[],
    features: [""],
    requirements: [""],
    variants: [] as ProductVariantForm[],
    files: [] as DownloadFileForm[],
    licenseTerms: "",
    isRecurring: false,
    recurringInterval: "month",
  })

  useEffect(() => {
    const load = async () => {
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) return
        const myComms = await api.communities.getMyCreated().catch(() => null as any)
        const first = (myComms?.data || [])[0]
        if (first?.id || first?._id) setCommunityId(first.id || first._id)
      } catch {}
    }
    load()
  }, [])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

const handleArrayChange = (field: string, index: number, value: string) => {
  setFormData((prev) => {
    const fieldValue = prev[field as keyof typeof prev];

    // Only allow array fields
    if (Array.isArray(fieldValue)) {
      return {
        ...prev,
        [field]: (fieldValue as string[]).map((item, i) => (i === index ? value : item)),
      };
    }

    // If it's not an array, return unchanged
    return prev;
  });
};


  const addArrayItem = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), ""],
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => {
      const arr = prev[field as keyof typeof prev];
      if (Array.isArray(arr)) {
        return {
          ...prev,
          [field]: arr.filter((_: any, i: number) => i !== index),
        };
      }
      return prev;
    });
  }

  const addVariant = () => {
    const newVariant: ProductVariantForm = {
      id: `variant-${Date.now()}`,
      name: "",
      price: 0,
      description: "",
    }
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }))
  }

  const updateVariant = (variantId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId ? { ...variant, [field]: value } : variant
      ),
    }))
  }

  const removeVariant = (variantId: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((variant) => variant.id !== variantId),
    }))
  }

  const addFile = () => {
    const newFile: DownloadFileForm = {
      id: `file-${Date.now()}`,
      name: "",
      url: "",
      type: "PDF",
    }
    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, newFile],
    }))
  }

  const updateFile = (fileId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.map((file) =>
        file.id === fileId ? { ...file, [field]: value } : file
      ),
    }))
  }

  const removeFile = (fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((file) => file.id !== fileId),
    }))
  }

  const handleSubmit = async () => {
    try {
      if (!communityId) {
        toast({ title: 'Missing community', description: 'No community found for this creator.', variant: 'destructive' as any })
        return
      }
      if (!formData.title?.trim() || !formData.description?.trim()) {
        toast({ title: 'Missing fields', description: 'Title and description are required.', variant: 'destructive' as any })
        return
      }
      if (Number(formData.price) < 0) {
        toast({ title: 'Invalid price', description: 'Price must be >= 0.', variant: 'destructive' as any })
        return
      }

      // Map UI form to CreateProductDto / CreateProductData
      const payload: CreateProductData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price || 0),
        currency: (formData.currency || 'USD') as CreateProductData['currency'],
        communityId,
        category: formData.category || 'General',
        type: formData.type as 'digital' | 'physical',
        ...(formData.thumbnail && { images: [formData.thumbnail] }),
        ...(formData.variants && formData.variants.length > 0 && {
          variants: formData.variants.map((v: any) => ({
            name: v.name.trim(),
            price: Number(v.price || 0),
            ...(v.description && { description: v.description.trim() }),
            ...(v.inventory !== undefined && v.inventory !== null && { inventory: Number(v.inventory) }),
          }))
        }),
        ...(formData.files && formData.files.length > 0 && {
          files: formData.files.map((f: any, idx: number) => ({
            name: (f.name || `File ${idx+1}`).trim(),
            url: f.url,
            type: f.type || 'OTHER',
            ...(f.size && { size: f.size }),
            ...(f.description && { description: f.description.trim() }),
            order: idx,
            isActive: true,
          }))
        }),
        ...(formData.licenseTerms && { licenseTerms: formData.licenseTerms.trim() }),
        ...(formData.isRecurring && { isRecurring: true }),
        ...(formData.isRecurring && formData.recurringInterval && { recurringInterval: formData.recurringInterval as CreateProductData['recurringInterval'] }),
        ...(Array.isArray(formData.features) && formData.features.filter(Boolean).length > 0 && {
          features: formData.features.filter(Boolean).map((f: string) => f.trim())
        }),
      }

      console.log('📦 Creating product with payload:', { ...payload, communityId })
      const res = await productsApi.create(payload)
      const created = (res as any)?.data || res
      console.log('✅ Product created:', created)
      toast({ title: 'Product created', description: payload.title })
      const id = created?.id || created?._id || created?.product?.id || created?.product?._id
      if (id) router.push(`/creator/products/${id}`)
      else router.push('/creator/products')
    } catch (e: any) {
      console.error('❌ Product creation error:', e)
      toast({ title: 'Failed to create product', description: e?.message || 'Please review required fields.', variant: 'destructive' as any })
    }
  }

  return (
    <ProductFormContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        formData,
        handleInputChange,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
        addVariant,
        updateVariant,
        removeVariant,
        addFile,
        updateFile,
        removeFile,
        handleSubmit,
      }}
    >
      {children}
    </ProductFormContext.Provider>
  )
}

export function useProductForm() {
  const context = useContext(ProductFormContext)
  if (!context) {
    throw new Error("useProductForm must be used within a ProductFormProvider")
  }
  return context
}