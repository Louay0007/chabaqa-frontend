"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, StarOff, Edit, Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { CampaignBuilderDialog } from "./campaign-builder-dialog"
import { crmApi, EmailTemplate as CrmEmailTemplate } from "@/lib/api/crm.api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"

// ── Builtin template shape ──────────────────────────────────────────────────
interface BuiltinTemplate {
  source: 'builtin'
  id: string
  name: string
  description: string
  segment: string
  useCount: number
  isStarred: boolean
  preview: string
  subject: string
  fullContent: string
  type?: 'announcement' | 'inactive-users' | 'content-reminder' | 'course-progress'
  inactivityPeriod?: 'last_7_days' | 'last_15_days' | 'last_30_days' | 'last_60_days' | 'more_than_60_days'
  contentType?: 'event' | 'challenge' | 'cours' | 'product' | 'session' | 'all'
}

// ── CRM template shape for display ─────────────────────────────────────────
interface CrmDisplayTemplate {
  source: 'crm'
  id: string
  name: string
  subject: string
  content: string
  category: string
  usageCount: number
}

type DisplayTemplate = BuiltinTemplate | CrmDisplayTemplate

const builtinTemplates: BuiltinTemplate[] = [
  {
    source: 'builtin',
    id: "1",
    name: "Welcome New Member",
    description: "First welcome email for new community members",
    segment: "New Members",
    useCount: 1250,
    isStarred: true,
    type: "announcement",
    preview: "A premium onboarding welcome with clear value, next steps, and CTA.",
    subject: "Welcome to {{communityName}}, {{userName}}!",
    fullContent: `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="padding:20px 22px;background:linear-gradient(120deg,#f7f2ff 0%,#eef7ff 100%);border-bottom:1px solid #e5e7eb;">
          <p style="margin:0;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#7c3aed;font-weight:700;">New Member Journey</p>
          <h2 style="margin:8px 0 0 0;font-size:24px;line-height:1.25;color:#111827;">Welcome, {{userName}}.</h2>
        </div>
        <div style="padding:22px;color:#374151;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 14px 0;">You just joined <strong>{{communityName}}</strong>, and we are excited to build with you.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px 0;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">1. Discover fresh content created for your goals</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">2. Join conversations and get direct feedback</td>
            </tr>
            <tr>
              <td style="padding:10px 0;">3. Stay consistent with weekly community activities</td>
            </tr>
          </table>
          <div style="margin:20px 0 8px 0;">
            <a href="https://chabaqa.io/explore" style="display:inline-block;background:#6d28d9;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Start Exploring</a>
          </div>
          <p style="margin:12px 0 0 0;color:#6b7280;font-size:13px;">Sent on {{currentDate}} • {{currentYear}}</p>
        </div>
      </div>
    `
  },
  {
    source: 'builtin',
    id: "2",
    name: "Course Reminder",
    description: "Reminder for upcoming course sessions",
    segment: "Course Participants",
    useCount: 856,
    isStarred: true,
    type: "content-reminder",
    contentType: "cours",
    preview: "Structured reminder email with prep checklist and action button.",
    subject: "Your {{contentTypeLabel}} update from {{communityName}}",
    fullContent: `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="padding:18px 22px;background:#ecfeff;border-bottom:1px solid #bae6fd;">
          <p style="margin:0;font-size:11px;letter-spacing:1.3px;text-transform:uppercase;color:#0369a1;font-weight:700;">Session Reminder</p>
          <h2 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#0f172a;">Hello {{userName}}, your next {{contentTypeLabel}} is waiting.</h2>
        </div>
        <div style="padding:22px;color:#334155;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 14px 0;">Quick reminder from <strong>{{communityName}}</strong> so you stay on track and ready.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:14px;">
            <p style="margin:0 0 8px 0;font-weight:700;color:#0f172a;">Before you join:</p>
            <p style="margin:0;">Review your notes, prepare one question, and block focused time for your learning session.</p>
          </div>
          <div style="margin:20px 0 10px 0;">
            <a href="https://chabaqa.io/explore" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Open Chabaqa</a>
          </div>
          <p style="margin:0;color:#64748b;font-size:13px;">Reminder generated on {{currentDate}}</p>
        </div>
      </div>
    `
  },
  {
    source: 'builtin',
    id: "3",
    name: "Re-engagement - 30 Days",
    description: "Re-engage members inactive for 30 days",
    segment: "Inactive Members",
    useCount: 542,
    isStarred: false,
    type: "inactive-users",
    inactivityPeriod: "last_30_days",
    preview: "A recovery campaign focused on momentum, value recap, and return CTA.",
    subject: "We saved your spot in {{communityName}}, {{userName}}",
    fullContent: `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="padding:18px 22px;background:linear-gradient(120deg,#fff1f2 0%,#fef9c3 100%);border-bottom:1px solid #fde68a;">
          <p style="margin:0;font-size:11px;letter-spacing:1.3px;text-transform:uppercase;color:#b45309;font-weight:700;">Reactivation Campaign</p>
          <h2 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#7c2d12;">{{userName}}, your community has been moving fast.</h2>
        </div>
        <div style="padding:22px;color:#374151;font-size:15px;line-height:1.75;">
          <p style="margin:0 0 14px 0;">It has been around <strong>{{daysThreshold}}</strong> since your last visit to <strong>{{communityName}}</strong>. We would love to have you back.</p>
          <ul style="margin:0 0 16px 18px;padding:0;">
            <li style="margin:0 0 8px 0;">Fresh content drops and practical resources</li>
            <li style="margin:0 0 8px 0;">New conversations from members you follow</li>
            <li style="margin:0;">Upcoming activities you can join immediately</li>
          </ul>
          <a href="https://chabaqa.io/explore" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Come Back Today</a>
          <p style="margin:14px 0 0 0;color:#6b7280;font-size:13px;">Campaign period: {{inactivityPeriod}}</p>
        </div>
      </div>
    `
  },
  {
    source: 'builtin',
    id: "4",
    name: "Event Announcement",
    description: "Announce upcoming community events",
    segment: "All Members",
    useCount: 423,
    isStarred: true,
    type: "content-reminder",
    contentType: "event",
    preview: "Event launch template with spotlight card and direct CTA.",
    subject: "New {{contentTypeLabel}} announced in {{communityName}}",
    fullContent: `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="padding:18px 22px;background:linear-gradient(120deg,#eff6ff 0%,#f5f3ff 100%);border-bottom:1px solid #dbeafe;">
          <p style="margin:0;font-size:11px;letter-spacing:1.3px;text-transform:uppercase;color:#1d4ed8;font-weight:700;">Community Spotlight</p>
          <h2 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#1e3a8a;">{{communityName}} has a new {{contentTypeLabel}} for you.</h2>
        </div>
        <div style="padding:22px;color:#334155;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 12px 0;">Hi {{userName}}, we just published an update designed to help you learn, connect, and take action faster.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:16px;">
            <p style="margin:0 0 6px 0;font-weight:700;color:#0f172a;">Why this matters</p>
            <p style="margin:0;">Get tactical insights, concrete examples, and a clear next step you can apply right away.</p>
          </div>
          <a href="https://chabaqa.io/explore" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">View Update</a>
        </div>
      </div>
    `
  },
  {
    source: 'builtin',
    id: "5",
    name: "Monthly Newsletter",
    description: "Monthly community updates and highlights",
    segment: "All Members",
    useCount: 980,
    isStarred: false,
    type: "announcement",
    preview: "Magazine-style monthly digest with highlights and action-oriented CTA.",
    subject: "{{communityName}} Monthly Digest | {{currentDate}}",
    fullContent: `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="padding:18px 22px;background:linear-gradient(120deg,#ecfeff 0%,#eef2ff 100%);border-bottom:1px solid #c7d2fe;">
          <p style="margin:0;font-size:11px;letter-spacing:1.3px;text-transform:uppercase;color:#4338ca;font-weight:700;">Monthly Newsletter</p>
          <h2 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#1f2937;">Hello {{userName}}, here is your {{communityName}} digest.</h2>
        </div>
        <div style="padding:22px;color:#334155;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 14px 0;">A focused summary of what matters most this month so you can stay aligned and move faster.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><strong style="color:#111827;">Wins:</strong> Member milestones and top contributions</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><strong style="color:#111827;">Builds:</strong> New releases, updates, and improvements</td>
            </tr>
            <tr>
              <td style="padding:10px 0;"><strong style="color:#111827;">Next:</strong> Events and opportunities to participate</td>
            </tr>
          </table>
          <a href="https://chabaqa.io/explore" style="display:inline-block;background:#4338ca;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Read Full Update</a>
        </div>
      </div>
    `
  },
  {
    source: 'builtin',
    id: "6",
    name: "Content Update",
    description: "Notify about new content releases",
    segment: "Content Subscribers",
    useCount: 675,
    isStarred: false,
    type: "content-reminder",
    contentType: "all",
    preview: "High-converting content release email with clear value proposition.",
    subject: "Fresh {{contentTypeLabel}} now live in {{communityName}}",
    fullContent: `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="padding:18px 22px;background:linear-gradient(120deg,#eef2ff 0%,#fdf2f8 100%);border-bottom:1px solid #e9d5ff;">
          <p style="margin:0;font-size:11px;letter-spacing:1.3px;text-transform:uppercase;color:#7e22ce;font-weight:700;">New Release</p>
          <h2 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#1f2937;">New {{contentTypeLabel}} is available.</h2>
        </div>
        <div style="padding:22px;color:#334155;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 12px 0;">Hi {{userName}}, we just published fresh content in <strong>{{communityName}}</strong> to keep your progress consistent.</p>
          <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:14px 16px;margin:0 0 16px 0;">
            <p style="margin:0;font-weight:600;color:#581c87;">Expect practical lessons, useful examples, and immediate takeaways.</p>
          </div>
          <a href="https://chabaqa.io/explore" style="display:inline-block;background:#7e22ce;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Access New Content</a>
        </div>
      </div>
    `
  },
  {
    source: 'builtin',
    id: "7",
    name: "Course Progress Reminder",
    description: "Re-engage learners who haven't finished a course",
    segment: "Course Learners",
    useCount: 0,
    isStarred: true,
    type: "course-progress" as const,
    preview: "Motivational nudge email that highlights how close the learner is to finishing.",
    subject: "{{userName}}, you're {{progressPct}}% done — keep going!",
    fullContent: `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="padding:18px 22px;background:linear-gradient(120deg,#f0fdf4 0%,#ecfeff 100%);border-bottom:1px solid #a7f3d0;">
          <p style="margin:0;font-size:11px;letter-spacing:1.3px;text-transform:uppercase;color:#065f46;font-weight:700;">Course Progress</p>
          <h2 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#064e3b;">You're so close, {{userName}}.</h2>
        </div>
        <div style="padding:22px;color:#1f2937;font-size:15px;line-height:1.75;">
          <p style="margin:0 0 14px 0;">You've already completed <strong>{{progressPct}}%</strong> of the course in <strong>{{communityName}}</strong>. You've been enrolled for {{enrolledDays}} days — finish strong.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;margin-bottom:16px;">
            <div style="height:10px;background:#d1fae5;border-radius:999px;overflow:hidden;">
              <div style="height:100%;width:{{progressPct}}%;background:#10b981;border-radius:999px;"></div>
            </div>
            <p style="margin:8px 0 0 0;font-size:13px;color:#059669;"><strong>{{progressPct}}% complete</strong> — keep it up!</p>
          </div>
          <a href="https://chabaqa.io/explore" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Continue Learning</a>
          <p style="margin:14px 0 0 0;color:#6b7280;font-size:13px;">Sent on {{currentDate}}</p>
        </div>
      </div>
    `
  }
]

export function EmailTemplateCards(props: { onCampaignCreated?: () => void }) {
  const { onCampaignCreated } = props

  const { selectedCommunityId } = useCreatorCommunity()

  const [builderOpen, setBuilderOpen] = useState(false)
  const [builderSeed, setBuilderSeed] = useState<any>(null)
  const [isViewAllOpen, setIsViewAllOpen] = useState(false)

  const displayLimit = 4

  // ── Fetch CRM templates ──────────────────────────────────────────────────
  const { data: crmTemplatesRaw } = useQuery<CrmEmailTemplate[]>({
    queryKey: ["crm-email-templates", selectedCommunityId],
    queryFn: () => crmApi.listTemplates(selectedCommunityId!),
    enabled: !!selectedCommunityId,
    staleTime: 30_000,
  })

  // Map CRM templates to display shape
  const crmDisplayTemplates: CrmDisplayTemplate[] = (crmTemplatesRaw ?? []).map(
    (t) => ({
      source: 'crm' as const,
      id: t._id,
      name: t.name,
      subject: t.subject,
      content: t.content,
      category: t.category,
      usageCount: t.usageCount,
    })
  )

  // CRM templates first, then builtin
  const allTemplates: DisplayTemplate[] = [...crmDisplayTemplates, ...builtinTemplates]

  const handleUseTemplate = (template: DisplayTemplate) => {
    if (template.source === 'crm') {
      setBuilderSeed({
        title: `Campaign: ${template.name}`,
        kind: "announcement" as any,
        subject: template.subject,
        content: template.content,
        isHtml: true,
        trackOpens: true,
        trackClicks: true,
      })
    } else {
      setBuilderSeed({
        title: `Campaign: ${template.name}`,
        kind: (template.type || "announcement") as any,
        subject: template.subject,
        content: template.fullContent,
        isHtml: true,
        trackOpens: true,
        trackClicks: true,
        inactivityPeriod: template.inactivityPeriod as any,
        contentType: template.contentType as any,
      })
    }
    setBuilderOpen(true)
  }

  const displayedTemplates = isViewAllOpen ? allTemplates : allTemplates.slice(0, displayLimit)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Email Templates</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href="/creator/marketing/emails/templates/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Template
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsViewAllOpen(!isViewAllOpen)}
          >
            {isViewAllOpen ? "Show Less" : "View All Templates"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedTemplates.map((template) => (
          <Card key={`${template.source}-${template.id}`} className="p-4 flex flex-col hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  {template.source === 'crm' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200"
                    >
                      CRM
                    </Badge>
                  )}
                  <h3 className="font-medium text-sm truncate">{template.name}</h3>
                </div>
                {template.source === 'builtin' && (
                  <p className="text-gray-500 text-xs mt-1">{template.description}</p>
                )}
                {template.source === 'crm' && (
                  <p className="text-gray-500 text-xs mt-1 truncate">{template.subject}</p>
                )}
              </div>
              {template.source === 'builtin' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                >
                  {template.isStarred ? (
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              {template.source === 'builtin' && (
                <Badge variant="secondary" className="w-fit">
                  {template.segment}
                </Badge>
              )}
              {template.source === 'crm' && (
                <>
                  <Badge variant="secondary" className="w-fit capitalize">
                    {template.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="w-fit text-[10px] px-1.5 py-0 text-purple-600 border-purple-300"
                  >
                    My Templates
                  </Badge>
                </>
              )}
            </div>

            {template.source === 'builtin' && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-3 flex-grow">
                {template.preview}
              </p>
            )}

            <div className="flex flex-col gap-2 mt-auto pt-3 border-t">
              <span className="text-xs text-gray-500">
                Used {template.source === 'builtin' ? template.useCount : template.usageCount} times
              </span>
              <Button
                variant="default"
                size="sm"
                className="w-full bg-chabaqa-primary hover:bg-chabaqa-primary/90"
                onClick={() => handleUseTemplate(template)}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Use &amp; Edit Template
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <CampaignBuilderDialog
        open={builderOpen}
        onOpenChange={(next) => {
          setBuilderOpen(next)
          if (!next) setBuilderSeed(null)
        }}
        initialValues={builderSeed || undefined}
        onSuccess={onCampaignCreated}
      />
    </div>
  )
}
