"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { Course } from "@/lib/models"
import { CourseHeader } from "./course-header"
import { CourseTabs } from "./course-tabs"
import { DetailsTab } from "./tabs/details-tab"
import { ContentTab } from "./tabs/content-tab"
import { PricingTab } from "./tabs/pricing-tab"
import { ResourcesTab } from "./tabs/resources-tab"
import { AnalyticsTab } from "./tabs/analytics-tab"
import { SettingsTab } from "./tabs/settings-tab"

export function CourseManager({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("details")
  const [isLoading, setIsLoading] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCourse = async () => {
    const response = await apiClient.get<any>(`/cours/${courseId}`)

    const transformedCourse: Course = {
      mongoId: response.mongoId || response._id || response.id,
      id: response.id,
      titre: response.titre,
      title: response.titre,
      description: response.description,
      thumbnail: response.thumbnail || "",
      prix: response.prix,
      price: response.prix,
      devise: response.devise,
      currency: response.devise,
      category: response.category || "",
      niveau: response.niveau || "",
      level: response.niveau || "",
      duree: response.duree || "",
      duration: response.duree || "",
      isPublished: Boolean(response.isPublished),
      learningObjectives: response.learningObjectives || [],
      requirements: response.requirements || [],
      notes: response.notes || "",
      sections: (response.sections || []).map((section: any) => ({
        id: section.id,
        title: section.titre,
        description: section.description || "",
        courseId: section.courseId,
        order: section.ordre,
        chapters: (section.chapitres || []).map((chapitre: any) => ({
          id: chapitre.id,
          title: chapitre.titre,
          content: chapitre.description || "",
          videoUrl: chapitre.videoUrl || "",
          duration: Number(chapitre.duree ?? 0) || 0,
          sectionId: chapitre.sectionId || section.id,
          order: chapitre.ordre,
          isPreview: !Boolean(chapitre.isPaidChapter ?? chapitre.isPaid),
          price: chapitre.prix || 0,
          notes: chapitre.notes || "",
          createdAt: chapitre.createdAt ? new Date(chapitre.createdAt) : new Date(),
        })),
        createdAt: section.createdAt ? new Date(section.createdAt) : new Date(),
      })),
      enrollments: [],
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      communityId: response.communityId,
      creatorId: response.creatorId,
      creator: response.creator,
    }

    setCourse(transformedCourse)
  }

  useEffect(() => {
    const run = async () => {
      try {
        await fetchCourse()
      } catch (error) {
        console.error('Failed to fetch course:', error)
        // If course not found, redirect to courses list
        router.push('/creator/courses')
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [courseId, router])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    longDescription: "",
    price: "",
    currency: "USD",
    category: "",
    level: "",
    duration: "",
    isPublished: false,
    learningObjectives: [""],
    requirements: [""],
    notes: "",
  })

  // Update formData when course loads
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || course.titre || "",
        description: course.description || "",
        longDescription: course.description || "",
        price: String(course.price ?? course.prix ?? ""),
        currency: course.currency || course.devise || "USD",
        category: course.category || "",
        level: course.level || course.niveau || "",
        duration: course.duration || course.duree || "",
        isPublished: course.isPublished || false,
        learningObjectives: course.learningObjectives || [""],
        requirements: course.requirements || [""],
        notes: course.notes || "",
      })
    }
  }, [course])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev]) 
        ? (prev[field as keyof typeof prev] as string[]).map((item: string, i: number) => 
            i === index ? value : item)
        : prev[field as keyof typeof prev],
    }))
  }

  const addArrayItem = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), ""],
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev]) 
        ? (prev[field as keyof typeof prev] as string[]).filter((_: string, i: number) => i !== index)
        : prev[field as keyof typeof prev],
    }))
  }

  const handleSave = async () => {
    if (!course) return
    const targetId = course.mongoId || course.id
    setIsLoading(true)
    try {
      await apiClient.patch(`/cours/${targetId}`, {
        titre: formData.title,
        description: formData.description,
        prix: formData.price === "" ? 0 : Number(formData.price),
        devise: formData.currency,
        category: formData.category,
        niveau: formData.level,
        duree: formData.duration,
        learningObjectives: (formData.learningObjectives || []).filter(Boolean),
        requirements: (formData.requirements || []).filter(Boolean),
        notes: formData.notes,
        isPublished: Boolean(formData.isPublished),
        thumbnail: course.thumbnail,
      })

      await fetchCourse()
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSection = async (payload: { titre: string; description?: string }) => {
    if (!course) return
    const targetId = course.mongoId || course.id
    const nextOrder = (course.sections?.length || 0) + 1
    await apiClient.post(`/cours/${targetId}/add-section`, {
      titre: payload.titre,
      description: payload.description || "",
      ordre: nextOrder,
    })
    await fetchCourse()
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!course) return
    const targetId = course.mongoId || course.id
    await apiClient.delete(`/cours/${targetId}/sections/${sectionId}`)
    await fetchCourse()
  }

  const handleDeleteChapter = async (sectionId: string, chapterId: string) => {
    if (!course) return
    const targetId = course.mongoId || course.id
    await apiClient.delete(`/cours/${targetId}/sections/${sectionId}/chapitres/${chapterId}`)
    await fetchCourse()
  }

  const handleUpdateSection = async (sectionId: string, payload: { title: string; description: string }) => {
    if (!course) return
    const targetId = course.mongoId || course.id
    await apiClient.patch(`/cours/${targetId}/sections/${sectionId}`, {
      titre: payload.title,
      description: payload.description,
    })
    await fetchCourse()
  }

  const handleUpdateChapter = async (
    sectionId: string,
    chapterId: string,
    payload: {
      title: string
      content: string
      videoUrl: string
      duration: string
      isPreview: boolean
      price: string
      notes: string
    },
  ) => {
    if (!course) return
    const targetId = course.mongoId || course.id
    await apiClient.patch(`/cours/${targetId}/sections/${sectionId}/chapitres/${chapterId}`, {
      titre: payload.title,
      description: payload.content,
      videoUrl: payload.videoUrl || undefined,
      duree: payload.duration ? toHHMM(Number(payload.duration)) : undefined,
      isPaid: !Boolean(payload.isPreview),
      prix: payload.isPreview ? 0 : payload.price === "" ? 0 : Number(payload.price),
      notes: payload.notes || undefined,
    })
    await fetchCourse()
  }

  const toHHMM = (minutesValue: number): string => {
    const safe = Number.isFinite(minutesValue) ? minutesValue : 0
    const hours = Math.floor(safe / 60)
    const minutes = safe % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  }

  const handleAddChapter = async (sectionId: string, payload: any) => {
    if (!course) return
    const targetId = course.mongoId || course.id
    const section = course.sections?.find((s) => s.id === sectionId)
    const nextOrder = (section?.chapters?.length || 0) + 1
    await apiClient.post(`/cours/${targetId}/sections/${sectionId}/add-chapitre`, {
      titre: payload.title,
      description: payload.content,
      videoUrl: payload.videoUrl || undefined,
      isPaid: !Boolean(payload.isPreview),
      ordre: nextOrder,
      duree: payload.duration ? toHHMM(Number(payload.duration)) : undefined,
      notes: payload.notes || undefined,
    })
    await fetchCourse()
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!course) {
    return <div>Course not found</div>
  }

  const totalChapters = course.sections?.reduce((acc, s) => acc + s.chapters.length, 0) || 0
  const previewChapters = course.sections?.reduce((acc, s) => acc + s.chapters.filter((c) => c.isPreview).length, 0) || 0
  const totalRevenue = (course.enrollments?.length || 0) * (course.price || 0)

  return (
    <div className="space-y-8 p-5">
      <CourseHeader 
        course={course} 
        onSave={handleSave} 
        isLoading={isLoading} 
      />

      <CourseTabs activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === "details" && (
          <DetailsTab
            formData={formData}
            course={course}
            onInputChange={handleInputChange}
            onArrayChange={handleArrayChange}
            onAddArrayItem={addArrayItem}
            onRemoveArrayItem={removeArrayItem}
            totalChapters={totalChapters}
            previewChapters={previewChapters}
            totalRevenue={totalRevenue}
          />
        )}

        {activeTab === "content" && (
          <ContentTab
            course={course}
            onAddSection={handleAddSection}
            onAddChapter={handleAddChapter}
            onDeleteSection={handleDeleteSection}
            onDeleteChapter={handleDeleteChapter}
            onUpdateSection={handleUpdateSection}
            onUpdateChapter={handleUpdateChapter}
          />
        )}

        {activeTab === "pricing" && (
          <PricingTab 
            formData={formData} 
            course={course} 
            onInputChange={handleInputChange} 
          />
        )}

        {activeTab === "resources" && (
          <ResourcesTab course={course} />
        )}

        {activeTab === "analytics" && (
          <AnalyticsTab 
            course={course} 
            totalRevenue={totalRevenue} 
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab />
        )}
      </CourseTabs>
    </div>
  )
}
