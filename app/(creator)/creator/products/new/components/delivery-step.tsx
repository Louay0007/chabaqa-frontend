"use client"

import { useRef, useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, X, Package, Upload, FileText } from "lucide-react"
import { useProductForm } from "./product-form-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function DeliveryStep() {
    const { formData, handleInputChange, handleArrayChange, addArrayItem, removeArrayItem } = useProductForm()
    const { toast } = useToast()
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)

    const onPick = () => inputRef.current?.click()

    const onFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        const file = files[0]

        // Accept various file types for digital products
        const validTypes = /\.(pdf|zip|mp4|mp3|epub|mobi|docx?|xlsx?|pptx?|png|jpg|jpeg|svg)$/i
        if (!validTypes.test(file.name)) {
            toast({
                title: "Invalid file type",
                description: "Please upload a valid digital product file.",
                variant: "destructive" as any
            })
            return
        }

        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            toast({ title: "File too large", description: "Max 100MB.", variant: "destructive" as any })
            return
        }

        try {
            setUploading(true)
            const res = await api.storage.upload(file).catch(() => null as any)
            const url = (res as any)?.data?.url || (res as any)?.url
            if (!url) throw new Error("Upload failed")

            // Add to files array
            const newFile = {
                name: file.name,
                url: url,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                type: file.type || file.name.split('.').pop() || 'file'
            }

            const currentFiles = formData.files || []
            handleInputChange("files", [...currentFiles, newFile])
            toast({ title: "File uploaded successfully" })
        } catch (e: any) {
            toast({
                title: "Upload failed",
                description: e?.message || "Try again.",
                variant: "destructive" as any
            })
        } finally {
            setUploading(false)
        }
    }

    const removeFile = (index: number) => {
        const currentFiles = formData.files || []
        const updatedFiles = currentFiles.filter((_: any, i: number) => i !== index)
        handleInputChange("files", updatedFiles)
    }

    return (
        <EnhancedCard>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-primary-500" />
                    Delivery & Files
                </CardTitle>
                <CardDescription>Upload the files customers will receive after purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="licenseTerms">License Terms</Label>
                    <Textarea
                        id="licenseTerms"
                        placeholder="Describe how customers can use this product (e.g., Personal use only, Commercial license included, etc.)"
                        rows={3}
                        value={formData.licenseTerms || ""}
                        onChange={(e) => handleInputChange("licenseTerms", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Specify usage rights and restrictions for your product
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Product Files *</Label>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".pdf,.zip,.mp4,.mp3,.epub,.mobi,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.svg"
                            className="hidden"
                            onChange={(e) => onFiles(e.target.files)}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onPick}
                            disabled={uploading}
                        >
                            <Upload className="h-4 w-4 mr-1" />
                            {uploading ? "Uploading..." : "Upload File"}
                        </Button>
                    </div>

                    {formData.files && formData.files.length > 0 ? (
                        <div className="space-y-2">
                            {formData.files.map((file: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                                >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <FileText className="h-5 w-5 text-primary-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{file.size}</p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-sm text-gray-600">No files uploaded yet</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Upload the digital files customers will receive
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
                    <Textarea
                        id="deliveryInstructions"
                        placeholder="Any special instructions for accessing or using the files..."
                        rows={3}
                        value={formData.deliveryInstructions || ""}
                        onChange={(e) => handleInputChange("deliveryInstructions", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Help customers understand how to access and use their purchase
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <Package className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900">Delivery Information</p>
                            <p className="text-xs text-blue-700">
                                Files will be automatically delivered to customers via email after successful payment.
                                They'll also be available in their account dashboard for download.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </EnhancedCard>
    )
}
