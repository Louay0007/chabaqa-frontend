"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Link as LinkIcon } from "lucide-react"
import { useProductForm } from "./product-form-context"

export function ProductFilesTab() {
  const { 
    formData, 
    handleAddFile, 
    handleFileChange, 
    handleRemoveFile 
  } = useProductForm()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Downloadable Files</CardTitle>
        <CardDescription>Files your customers will receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {formData.files.map((file: any, index: number) => (
          <div key={file.id} className="border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>File Name</Label>
                <Input
                  value={file.name}
                  onChange={(e) => handleFileChange(index, "name", e.target.value)}
                  placeholder="e.g., UI_Kit.fig"
                />
              </div>
              <div className="space-y-1">
                <Label>File Type</Label>
                <Input
                  value={file.type}
                  onChange={(e) => handleFileChange(index, "type", e.target.value)}
                  placeholder="e.g., Figma, PDF, ZIP"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Download URL</Label>
              <div className="flex space-x-2">
                <Input
                  value={file.url}
                  onChange={(e) => handleFileChange(index, "url", e.target.value)}
                  placeholder="https://example.com/download/file"
                />
                <Button variant="outline" size="icon">
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => handleRemoveFile(index)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove File
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={handleAddFile}>
          <Plus className="h-4 w-4 mr-2" />
          Add File
        </Button>
      </CardContent>
    </Card>
  )
}