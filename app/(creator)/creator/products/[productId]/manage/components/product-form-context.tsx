"use client"

import { createContext, useContext, useState } from "react"
import { useRouter } from "next/navigation"
import { updateProduct } from "@/lib/mock-data"

type ProductFormContextType = {
  formData: any
  isSaving: boolean
  handleInputChange: (field: string, value: any) => void
  handleArrayChange: (field: string, index: number, value: string) => void
  addArrayItem: (field: string) => void
  removeArrayItem: (field: string, index: number) => void
  handleAddFile: () => void
  handleFileChange: (index: number, field: string, value: string) => void
  handleRemoveFile: (index: number) => void
  handleSave: () => Promise<void>
}

const ProductFormContext = createContext<ProductFormContextType | undefined>(undefined)

export function ProductFormProvider({ 
  children, 
  product 
}: { 
  children: React.ReactNode 
  product: any 
}) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: product?.title || "",
    description: product?.description || "",
    price: product?.price || 0,
    isPublished: product?.isPublished || false,
    category: product?.category || "",
    licenseTerms: product?.licenseTerms || "",
    features: product?.features || [""],
    files: product?.files || [],
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].map((item: string, i: number) => 
        i === index ? value : item
      ),
    }))
  }

  const addArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev], ""],
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].filter((_: any, i: number) => i !== index),
    }))
  }

  const handleAddFile = () => {
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, { id: `file-${Date.now()}`, name: "", url: "", type: "PDF" }],
    }))
  }

  const handleFileChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.map((file: any, i: number) => 
        i === index ? { ...file, [field]: value } : file
      ),
    }))
  }

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_: any, i: number) => i !== index),
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProduct(product.id, formData)
      router.push("/creator/products")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ProductFormContext.Provider value={{
      formData,
      isSaving,
      handleInputChange,
      handleArrayChange,
      addArrayItem,
      removeArrayItem,
      handleAddFile,
      handleFileChange,
      handleRemoveFile,
      handleSave
    }}>
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