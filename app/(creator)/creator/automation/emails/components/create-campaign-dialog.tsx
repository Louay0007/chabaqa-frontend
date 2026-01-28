"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { emailCampaignsApi } from "@/lib/api/email-campaigns.api"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
  title: z.string().min(1, "Campaign title is required"),
  type: z.enum(["announcement", "content-reminder", "inactive-users"]),
  subject: z.string().min(1, "Subject line is required"),
  content: z.string().min(1, "Email content is required"),
  sendingTime: z.enum(["now", "scheduled"]),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  inactivityPeriod: z.enum(["last_7_days", "last_15_days", "last_30_days", "last_60_days", "more_than_60_days"]).optional(),
  contentType: z.enum(["event", "challenge", "cours", "product", "session", "all"]).optional(),
  contentId: z.string().optional(),
  isHtml: z.boolean().optional(),
  trackOpens: z.boolean().optional(),
  trackClicks: z.boolean().optional(),
})

interface CreateCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCampaignCreated?: () => void
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  onCampaignCreated,
}: CreateCampaignDialogProps) {
  const { selectedCommunityId } = useCreatorCommunity()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "announcement",
      subject: "",
      content: "",
      sendingTime: "now",
      scheduledDate: "",
      scheduledTime: "",
      inactivityPeriod: undefined,
      contentType: undefined,
      contentId: "",
      isHtml: true,
      trackOpens: true,
      trackClicks: true,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedCommunityId) {
      toast({
        title: "Error",
        description: "No community selected",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      console.log('[CreateCampaign] submit values:', values)
      console.log('[CreateCampaign] selectedCommunityId:', selectedCommunityId)

      const baseData = {
        title: values.title,
        subject: values.subject,
        content: values.content,
        communityId: selectedCommunityId,
        isHtml: values.isHtml,
        trackOpens: values.trackOpens,
        trackClicks: values.trackClicks,
      }

      let scheduledAt: string | undefined
      if (values.sendingTime === "scheduled" && values.scheduledDate && values.scheduledTime) {
        scheduledAt = `${values.scheduledDate}T${values.scheduledTime}:00.000Z`
      }

      if (values.type === "inactive-users") {
        // Create inactive user campaign
        await emailCampaignsApi.createInactiveUserCampaign({
          ...baseData,
          inactivityPeriod: values.inactivityPeriod!,
          scheduledAt,
        })
        console.log('[CreateCampaign] inactive-users response OK')
      } else if (values.type === "content-reminder") {
        // Create content reminder campaign
        await emailCampaignsApi.createContentReminder({
          ...baseData,
          contentType: values.contentType!,
          contentId: values.contentId,
          scheduledAt,
        })
        console.log('[CreateCampaign] content-reminder response OK')
      } else {
        // Create regular campaign
        await emailCampaignsApi.createCampaign({
          ...baseData,
          type: values.type === "announcement" ? "announcement" : "custom",
          scheduledAt,
        })
        console.log('[CreateCampaign] announcement/custom response OK')
      }

      toast({
        title: "Success",
        description: "Campaign created successfully",
      })

      onOpenChange(false)
      onCampaignCreated?.()
      form.reset()
    } catch (error: any) {
      console.error("Error creating campaign:", error?.response || error)
      console.log("Error payload:", error?.response?.data || error?.message)
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Create a new email campaign for your community members
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter campaign title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select campaign type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="announcement">Regular Announcement</SelectItem>
                      <SelectItem value="content-reminder">Content Reminder</SelectItem>
                      <SelectItem value="inactive-users">Inactive Users</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the type of campaign you want to send
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Line</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email subject..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Available variables: &#123;&#123;userName&#125;&#125;, &#123;&#123;communityName&#125;&#125;, &#123;&#123;currentDate&#125;&#125;
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your email content..."
                      className="h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sendingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>When to send</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select when to send" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="now">Send Now</SelectItem>
                      <SelectItem value="scheduled">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("sendingTime") === "scheduled" && (
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {form.watch("type") === "inactive-users" && (
              <FormField
                control={form.control}
                name="inactivityPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inactive for</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select inactive period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="last_7_days">7 days</SelectItem>
                        <SelectItem value="last_15_days">15 days</SelectItem>
                        <SelectItem value="last_30_days">30 days</SelectItem>
                        <SelectItem value="last_60_days">60 days</SelectItem>
                        <SelectItem value="more_than_60_days">60+ days</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Target users who haven't been active for the selected period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("type") === "content-reminder" && (
              <>
                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="challenge">Challenge</SelectItem>
                          <SelectItem value="cours">Course</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="session">Session</SelectItem>
                          <SelectItem value="all">General Content</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the type of content to remind members about
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter specific content ID..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional: specify a particular content item to highlight
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                disabled={isSubmitting}
              >
                Preview
              </Button>
              <Button
                type="submit"
                className="bg-chabaqa-primary hover:bg-chabaqa-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}