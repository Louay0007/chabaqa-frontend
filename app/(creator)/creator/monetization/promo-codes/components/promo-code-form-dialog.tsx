'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { useAuthContext } from '@/app/providers/auth-provider'
import {
  CreatePromoCodeDto,
  UpdatePromoCodeDto,
  PromoCodeResponseDto,
  TrackableContentType,
} from '@/lib/api'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const ALL_CONTENT_TYPE_VALUE = 'all'
const ALL_ITEMS_VALUE = '__all_items__'
const UNSUPPORTED_TARGET_TYPES = new Set<TrackableContentType>(['resource', 'subscription'])
const SUPPORTED_SELECT_TYPES = new Set<TrackableContentType>([
  'course',
  'chapter',
  'challenge',
  'session',
  'event',
  'product',
  'post',
  'community',
])

const promoCodeSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be at most 50 characters'),
  percentOff: z.union([z.number().min(0).max(100), z.nan()]).optional(),
  amountOffDT: z.union([z.number().min(0), z.nan()]).optional(),
  appliesToType: z.string().optional(),
  appliesToId: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  maxRedemptions: z.union([z.number().min(1), z.nan()]).optional(),
  isActive: z.boolean(),
  allowedEmails: z.string().optional(),
}).refine(data => {
  const pct = typeof data.percentOff === 'number' && !isNaN(data.percentOff) && data.percentOff > 0
  const amt = typeof data.amountOffDT === 'number' && !isNaN(data.amountOffDT) && data.amountOffDT > 0
  return pct || amt
}, {
  message: 'At least one discount (percentage or fixed amount) is required',
  path: ['percentOff'],
}).refine(data => {
  if (data.startsAt && data.endsAt) {
    return new Date(data.startsAt) < new Date(data.endsAt)
  }
  return true
}, {
  message: 'Start date must be before end date',
  path: ['endsAt'],
})

type FormData = z.infer<typeof promoCodeSchema>

interface PromoCodeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCode: PromoCodeResponseDto | null
  communityId: string | null
  onSuccess: () => void
}

interface ContentOption {
  value: string
  label: string
  communityId?: string
}

const TYPE_LABELS: Record<TrackableContentType, string> = {
  course: 'Course',
  chapter: 'Chapter',
  challenge: 'Challenge',
  session: 'Session',
  post: 'Post',
  event: 'Event',
  product: 'Product',
  resource: 'Resource',
  community: 'Community',
  subscription: 'Subscription',
}

function normalizeEntityId(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    const nested = value._id ?? value.id ?? value.value
    if (nested) return normalizeEntityId(nested)
  }
  return ''
}

function truncateText(value: string, max = 60): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

function extractCollection(response: any, preferredKeys: string[] = []): any[] {
  const roots = [response, response?.data, response?.data?.data]

  for (const root of roots) {
    if (Array.isArray(root)) return root

    for (const key of ['items', 'results', ...preferredKeys]) {
      if (Array.isArray(root?.[key])) return root[key]
    }
  }

  return []
}

function extractCommunityId(item: any): string | undefined {
  const communityCandidate =
    item?.communityId ??
    item?.community?._id ??
    item?.community?.id ??
    item?.community

  const normalized = normalizeEntityId(communityCandidate)
  return normalized || undefined
}

function normalizeOptionFromItem(item: any, type: TrackableContentType): ContentOption | null {
  const value = normalizeEntityId(
    item?._id ?? item?.id ?? item?.postId ?? item?.productId ?? item?.eventId ?? item?.sessionId,
  )
  if (!value) return null

  let label = ''
  switch (type) {
    case 'community':
      label = item?.name || item?.title || `Community ${value}`
      break
    case 'post':
      label = item?.title || truncateText(item?.content || item?.text || item?.body || `Post ${value}`)
      break
    default:
      label = item?.title || item?.name || item?.titre || `${TYPE_LABELS[type]} ${value}`
      break
  }

  return {
    value,
    label,
    communityId: extractCommunityId(item),
  }
}

function dedupeOptions(options: ContentOption[]): ContentOption[] {
  const seen = new Set<string>()
  return options.filter((option) => {
    if (!option.value || seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })
}

async function loadCoursesForCreator(userId: string) {
  const response = await api.courses.getByCreator(userId, { page: 1, limit: 100 }).catch(() => null as any)
  return extractCollection(response, ['courses'])
}

export function PromoCodeFormDialog({
  open, onOpenChange, editingCode, communityId, onSuccess,
}: PromoCodeFormDialogProps) {
  const { toast } = useToast()
  const { user } = useAuthContext()
  const isEditing = !!editingCode
  const [contentOptions, setContentOptions] = useState<ContentOption[]>([])
  const [loadingContentOptions, setLoadingContentOptions] = useState(false)
  const [contentOptionsError, setContentOptionsError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: '',
      percentOff: undefined,
      amountOffDT: undefined,
      appliesToType: '',
      appliesToId: '',
      startsAt: '',
      endsAt: '',
      maxRedemptions: undefined,
      isActive: true,
      allowedEmails: '',
    },
  })

  useEffect(() => {
    if (editingCode) {
      form.reset({
        code: editingCode.code,
        percentOff: editingCode.percentOff ?? undefined,
        amountOffDT: editingCode.amountOffDT ?? undefined,
        appliesToType: editingCode.appliesToType || '',
        appliesToId: editingCode.appliesToId || '',
        startsAt: editingCode.startsAt
          ? new Date(editingCode.startsAt).toISOString().split('T')[0]
          : '',
        endsAt: editingCode.endsAt
          ? new Date(editingCode.endsAt).toISOString().split('T')[0]
          : '',
        maxRedemptions: editingCode.maxRedemptions ?? undefined,
        isActive: editingCode.isActive,
        allowedEmails: editingCode.allowedEmails?.join(', ') || '',
      })
    } else {
      form.reset({
        code: '', percentOff: undefined, amountOffDT: undefined,
        appliesToType: '', appliesToId: '', startsAt: '', endsAt: '',
        maxRedemptions: undefined, isActive: true, allowedEmails: '',
      })
    }
  }, [editingCode, open, form])

  const selectedType = form.watch('appliesToType') as TrackableContentType | ''
  const selectedContentId = form.watch('appliesToId')
  const creatorId = user?._id || user?.id || ''
  const supportsSpecificSelection = !!selectedType && SUPPORTED_SELECT_TYPES.has(selectedType)
  const isUnsupportedSelectionType = !!selectedType && UNSUPPORTED_TARGET_TYPES.has(selectedType)

  useEffect(() => {
    let cancelled = false

    const loadContentOptions = async () => {
      if (!open || !selectedType || !supportsSpecificSelection) {
        setContentOptions([])
        setContentOptionsError(null)
        setLoadingContentOptions(false)
        return
      }

      if (!creatorId && selectedType !== 'community') {
        setContentOptions([])
        setContentOptionsError('Unable to identify the current creator to load content.')
        return
      }

      setLoadingContentOptions(true)
      setContentOptionsError(null)

      try {
        let options: ContentOption[] = []

        switch (selectedType) {
          case 'course': {
            const items = await loadCoursesForCreator(creatorId)
            options = items.map((item: any) => normalizeOptionFromItem(item, 'course')).filter(Boolean) as ContentOption[]
            break
          }

          case 'chapter': {
            const courses = await loadCoursesForCreator(creatorId)
            const courseOptions = courses
              .map((item: any) => normalizeOptionFromItem(item, 'course'))
              .filter(Boolean) as ContentOption[]

            const chapterCollections = await Promise.all(
              courseOptions.map(async (course) => {
                const details = await api.courses.getCoursById(course.value).catch(() => null as any)
                const payload = details?.data ?? details
                const courseRecord = payload?.data ?? payload?.course ?? payload
                const sections = Array.isArray(courseRecord?.sections)
                  ? courseRecord.sections
                  : Array.isArray(courseRecord?.data?.sections)
                    ? courseRecord.data.sections
                    : []

                return sections.flatMap((section: any) => {
                  const chapters = Array.isArray(section?.chapitres)
                    ? section.chapitres
                    : Array.isArray(section?.chapters)
                      ? section.chapters
                      : []

                  return chapters.map((chapter: any) => {
                    const chapterId = normalizeEntityId(chapter?._id ?? chapter?.id)
                    if (!chapterId) return null
                    const chapterTitle = chapter?.title || chapter?.titre || `Chapter ${chapterId}`
                    const sectionTitle = section?.title || section?.titre || 'Section'
                    return {
                      value: chapterId,
                      label: `${course.label} / ${sectionTitle} / ${chapterTitle}`,
                      communityId: course.communityId,
                    } satisfies ContentOption
                  }).filter(Boolean) as ContentOption[]
                })
              }),
            )

            options = chapterCollections.flat()
            break
          }

          case 'challenge': {
            const response = await api.challenges.getByCreator(creatorId, {
              page: 1,
              limit: 100,
              ...(communityId ? { communityId } : {}),
            }).catch(() => null as any)
            const items = extractCollection(response, ['challenges'])
            options = items.map((item: any) => normalizeOptionFromItem(item, 'challenge')).filter(Boolean) as ContentOption[]
            break
          }

          case 'session': {
            const response = await api.sessions.getByCreator(creatorId, { page: 1, limit: 100 }).catch(() => null as any)
            const items = extractCollection(response, ['sessions'])
            options = items.map((item: any) => normalizeOptionFromItem(item, 'session')).filter(Boolean) as ContentOption[]
            break
          }

          case 'event': {
            const response = await api.events.getByCreator(creatorId, { page: 1, limit: 100 }).catch(() => null as any)
            const items = extractCollection(response, ['events'])
            options = items.map((item: any) => normalizeOptionFromItem(item, 'event')).filter(Boolean) as ContentOption[]
            break
          }

          case 'product': {
            const response = await api.products.getByCreator(creatorId, {
              page: 1,
              limit: 100,
              ...(communityId ? { communityId } : {}),
            }).catch(() => null as any)
            const items = extractCollection(response, ['products'])
            options = items.map((item: any) => normalizeOptionFromItem(item, 'product')).filter(Boolean) as ContentOption[]
            break
          }

          case 'post': {
            const response = await api.posts.getByCreator(creatorId, {
              page: 1,
              limit: 100,
              ...(communityId ? { communityId } : {}),
              currentUserId: creatorId,
            }).catch(() => null as any)
            const items = extractCollection(response, ['posts'])
            options = items.map((item: any) => normalizeOptionFromItem(item, 'post')).filter(Boolean) as ContentOption[]
            break
          }

          case 'community': {
            const response = await api.communities.getMyManageable().catch(() => null as any)
            const items = extractCollection(response, ['communities'])
            options = items.map((item: any) => normalizeOptionFromItem(item, 'community')).filter(Boolean) as ContentOption[]
            break
          }
        }

        const filteredByCommunity = communityId
          ? options.filter((option) => !option.communityId || option.communityId === communityId)
          : options

        if (!cancelled) {
          setContentOptions(dedupeOptions(filteredByCommunity))
        }
      } catch {
        if (!cancelled) {
          setContentOptions([])
          setContentOptionsError('Failed to load your content. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setLoadingContentOptions(false)
        }
      }
    }

    loadContentOptions()

    return () => {
      cancelled = true
    }
  }, [open, selectedType, supportsSpecificSelection, creatorId, communityId])

  const displayedContentOptions = useMemo(() => {
    if (!selectedContentId || contentOptions.some((option) => option.value === selectedContentId)) {
      return contentOptions
    }

    return [
      {
        value: selectedContentId,
        label: `Current selection (${selectedContentId})`,
      },
      ...contentOptions,
    ]
  }, [contentOptions, selectedContentId])

  const onSubmit = async (data: FormData) => {
    try {
      const cleanNumber = (v: number | undefined) =>
        typeof v === 'number' && !isNaN(v) && v > 0 ? v : undefined

      const emails = data.allowedEmails
        ? data.allowedEmails.split(',').map(e => e.trim()).filter(Boolean)
        : undefined

      if (isEditing) {
        const payload: UpdatePromoCodeDto = {
          percentOff: cleanNumber(data.percentOff),
          amountOffDT: cleanNumber(data.amountOffDT),
          appliesToType: (data.appliesToType || undefined) as UpdatePromoCodeDto['appliesToType'],
          appliesToId: data.appliesToId || undefined,
          startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : undefined,
          endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
          maxRedemptions: cleanNumber(data.maxRedemptions),
          isActive: data.isActive,
          allowedEmails: emails,
        }
        await api.promoCodes.update(editingCode!.code, payload)
        toast({ title: 'Success', description: 'Promo code updated successfully' })
      } else {
        const payload: CreatePromoCodeDto = {
          code: data.code.toUpperCase().trim(),
          percentOff: cleanNumber(data.percentOff),
          amountOffDT: cleanNumber(data.amountOffDT),
          appliesToType: (data.appliesToType || undefined) as CreatePromoCodeDto['appliesToType'],
          appliesToId: data.appliesToId || undefined,
          communityId: communityId || undefined,
          startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : undefined,
          endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
          maxRedemptions: cleanNumber(data.maxRedemptions),
          isActive: data.isActive,
          allowedEmails: emails,
        }
        await api.promoCodes.create(payload)
        toast({ title: 'Success', description: 'Promo code created successfully' })
      }

      onSuccess()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save promo code',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Create'} Promo Code</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the promo code details'
              : 'Create a new discount code for your content'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Promo Code *</Label>
            <Input
              id="code"
              placeholder="SUMMER25"
              {...form.register('code')}
              disabled={isEditing}
              className="font-mono uppercase"
            />
            {form.formState.errors.code && (
              <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="percentOff">Percentage Off (%)</Label>
              <Input
                id="percentOff"
                type="number"
                step="1"
                min="0"
                max="100"
                placeholder="e.g. 25"
                {...form.register('percentOff', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountOffDT">Fixed Amount Off (DT)</Label>
              <Input
                id="amountOffDT"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 10"
                {...form.register('amountOffDT', { valueAsNumber: true })}
              />
            </div>
          </div>
          {form.formState.errors.percentOff && (
            <p className="text-sm text-red-500">{form.formState.errors.percentOff.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            You can set both — they are additive (e.g. 10% off + 5 DT off).
          </p>

          <div className="space-y-2">
            <Label>Applies To</Label>
            <Select
              value={selectedType || ALL_CONTENT_TYPE_VALUE}
              onValueChange={(value) => {
                const nextType = value === ALL_CONTENT_TYPE_VALUE ? '' : value
                form.setValue('appliesToType', nextType)
                form.setValue('appliesToId', '')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Content" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CONTENT_TYPE_VALUE}>All Content</SelectItem>
                <SelectItem value="course">Courses</SelectItem>
                <SelectItem value="chapter">Chapters</SelectItem>
                <SelectItem value="challenge">Challenges</SelectItem>
                <SelectItem value="session">Sessions</SelectItem>
                <SelectItem value="event">Events</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="resource">Resources</SelectItem>
                <SelectItem value="community">Communities</SelectItem>
                <SelectItem value="subscription">Subscriptions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedType && supportsSpecificSelection && (
            <div className="space-y-2">
              <Label>Specific {TYPE_LABELS[selectedType]} (Optional)</Label>
              <Select
                value={selectedContentId || ALL_ITEMS_VALUE}
                onValueChange={(value) => form.setValue('appliesToId', value === ALL_ITEMS_VALUE ? '' : value)}
                disabled={loadingContentOptions}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingContentOptions ? `Loading ${TYPE_LABELS[selectedType].toLowerCase()}s...` : `All ${TYPE_LABELS[selectedType]}s`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ITEMS_VALUE}>All {TYPE_LABELS[selectedType]}s</SelectItem>
                  {displayedContentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingContentOptions && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading your available {TYPE_LABELS[selectedType].toLowerCase()}s...
                </div>
              )}
              {!loadingContentOptions && !contentOptionsError && displayedContentOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No {TYPE_LABELS[selectedType].toLowerCase()}s were found for this creator{communityId ? ' in the selected community' : ''}. Leave this empty to apply the promo code to all {TYPE_LABELS[selectedType].toLowerCase()}s.
                </p>
              )}
              {contentOptionsError && (
                <p className="text-xs text-amber-600">{contentOptionsError}</p>
              )}
            </div>
          )}

          {selectedType && isUnsupportedSelectionType && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Specific {TYPE_LABELS[selectedType].toLowerCase()} selection is not available yet in the creator dashboard because this content type does not currently expose a reliable creator-owned list API. Leave this empty to apply the promo code to all {TYPE_LABELS[selectedType].toLowerCase()}s.
              {selectedContentId && (
                <div className="mt-2 text-xs text-amber-800">
                  Existing saved target preserved: <span className="font-mono">{selectedContentId}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startsAt">Start Date</Label>
              <Input
                id="startsAt"
                type="date"
                {...form.register('startsAt')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endsAt">End Date</Label>
              <Input
                id="endsAt"
                type="date"
                {...form.register('endsAt')}
              />
              {form.formState.errors.endsAt && (
                <p className="text-sm text-red-500">{form.formState.errors.endsAt.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxRedemptions">Max Redemptions</Label>
            <Input
              id="maxRedemptions"
              type="number"
              min="1"
              placeholder="Unlimited"
              {...form.register('maxRedemptions', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowedEmails">Allowed Emails</Label>
            <Textarea
              id="allowedEmails"
              placeholder="user1@example.com, user2@example.com"
              {...form.register('allowedEmails')}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated. Leave empty to allow everyone.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update' : 'Create'} Promo Code
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
