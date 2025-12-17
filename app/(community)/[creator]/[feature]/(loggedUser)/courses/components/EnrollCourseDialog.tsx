"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { coursesApi } from "@/lib/api/courses.api"
import { tokenStorage } from "@/lib/token-storage"

type EnrollCourseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: any | null
  isEnrolled: boolean
  onEnrolled: (enrollment: any) => void
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") {
      return message
    }
  }
  if (typeof error === "string") {
    return error
  }
  return "Something went wrong. Please try again."
}

export default function EnrollCourseDialog({
  open,
  onOpenChange,
  course,
  isEnrolled,
  onEnrolled,
}: EnrollCourseDialogProps) {
  const { toast } = useToast()
  const [promoCode, setPromoCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const priceLabel = useMemo(() => {
    if (!course) return ""
    const price = Number(course.price ?? 0)
    if (price <= 0) return "Free"
    return `${price} ${course.devise || ""}`.trim()
  }, [course])

  const canEnroll = Boolean(course) && !isEnrolled

  const isPaidCourse = Boolean(course && Number(course.price ?? 0) > 0)

  const handleConfirm = async () => {
    if (!course || !canEnroll) {
      return
    }

    setIsSubmitting(true)
    try {
      // Paid course: go through checkout first
      if (isPaidCourse) {
        const accessToken = tokenStorage.getAccessToken()
        if (!accessToken) {
          toast({
            title: "Authentication required",
            description: "Please sign in to purchase this course.",
            variant: "destructive",
          })
          return
        }

        const promoQuery = promoCode.trim()
          ? `?promoCode=${encodeURIComponent(promoCode.trim())}`
          : ""

        const initResponse = await fetch(`/api/payments/init/stripe-link-course${promoQuery}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify({ courseId: String(course.id) }),
        })

        const initData = await initResponse.json().catch(() => null)

        if (!initResponse.ok) {
          const message = initData?.message || initData?.error || "Failed to initiate checkout"
          throw new Error(message)
        }

        const checkoutUrl = initData?.checkoutUrl
        if (!checkoutUrl) {
          throw new Error("Checkout URL missing from payment init response")
        }

        // Close dialog before redirect
        onOpenChange(false)
        setPromoCode("")
        window.location.href = checkoutUrl
        return
      }

      // Free course: enroll directly
      const response = await coursesApi.enroll(String(course.id), promoCode.trim() || undefined)
      onEnrolled(response.enrollment)

      toast({
        title: "Enrolled successfully",
        description: response.message || "You now have access to this course.",
      })

      onOpenChange(false)
      setPromoCode("")
    } catch (error) {
      toast({
        title: isPaidCourse ? "Checkout failed" : "Enrollment failed",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course?.title || "Enroll"}</DialogTitle>
          <DialogDescription>
            {isEnrolled
              ? "You are already enrolled in this course."
              : isPaidCourse
                ? "Proceed to checkout to purchase this course. After successful payment, you will be enrolled automatically."
                : "Confirm enrollment to access this free course."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price</span>
            <span className="font-medium">{priceLabel}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promoCode">Promo code (optional)</Label>
            <Input
              id="promoCode"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="e.g. WELCOME10"
              disabled={!canEnroll || isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!canEnroll || isSubmitting}>
            {isSubmitting ? "Processing..." : isPaidCourse ? "Proceed to checkout" : "Confirm enrollment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
