'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCommunityGuard } from '@/hooks/use-community-guard'
import { PageShell } from '@/components/creator-dashboard'
import { api } from '@/lib/api'
import type { PromoCodeResponseDto } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

import { PromoCodesHeader } from './components/promo-codes-header'
import { PromoCodesStats } from './components/promo-codes-stats'
import { PromoCodesTable } from './components/promo-codes-table'
import { PromoCodeFormDialog } from './components/promo-code-form-dialog'
import { PromoCodeStatsDialog } from './components/promo-code-stats-dialog'
import { PromoCodeUsageDialog } from './components/promo-code-usage-dialog'

export default function PromoCodesPage() {
  const { guard, selectedCommunityId, isLoading: communityLoading } = useCommunityGuard()
  const { toast } = useToast()

  const [promoCodes, setPromoCodes] = useState<PromoCodeResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCode, setEditingCode] = useState<PromoCodeResponseDto | null>(null)
  const [statsCode, setStatsCode] = useState<string | null>(null)
  const [usageCode, setUsageCode] = useState<string | null>(null)

  const loadPromoCodes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.promoCodes.getMyCodes().catch(() => null as any)
      const list: PromoCodeResponseDto[] = Array.isArray(res) ? res : (res?.data || [])
      const filtered = selectedCommunityId
        ? list.filter(c => !c.communityId || c.communityId === selectedCommunityId)
        : list
      setPromoCodes(filtered)
    } catch {
      toast({ title: 'Error', description: 'Failed to load promo codes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [selectedCommunityId, toast])

  useEffect(() => {
    if (communityLoading) return
    if (!selectedCommunityId) {
      setPromoCodes([])
      setLoading(false)
      return
    }
    loadPromoCodes()
  }, [selectedCommunityId, communityLoading, loadPromoCodes])

  const filteredCodes = promoCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchQuery.toLowerCase())
    const now = new Date()
    const isExpired = code.endsAt && new Date(code.endsAt) < now
    const isScheduled = code.startsAt && new Date(code.startsAt) > now
    const isMaxedOut = code.maxRedemptions && code.redemptionsCount >= code.maxRedemptions
    const isEffectivelyActive = code.isActive && !isExpired && !isMaxedOut && !isScheduled

    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'active') return matchesSearch && isEffectivelyActive
    if (activeTab === 'expired') return matchesSearch && (isExpired || isMaxedOut)
    if (activeTab === 'scheduled') return matchesSearch && isScheduled
    if (activeTab === 'inactive') return matchesSearch && !code.isActive

    return matchesSearch
  })

  if (guard) return guard

  return (
    <PageShell>
      <PromoCodesHeader
        onCreateClick={() => {
          setEditingCode(null)
          setShowCreateDialog(true)
        }}
        onRefresh={loadPromoCodes}
      />

      <PromoCodesStats promoCodes={promoCodes} />

      <PromoCodesTable
        promoCodes={filteredCodes}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onEdit={(code) => {
          setEditingCode(code)
          setShowCreateDialog(true)
        }}
        onDelete={async (code) => {
          try {
            await api.promoCodes.delete(code.code)
            toast({ title: 'Success', description: `Promo code "${code.code}" deleted` })
            await loadPromoCodes()
          } catch (error: any) {
            toast({
              title: 'Error',
              description: error.message || 'Failed to delete promo code',
              variant: 'destructive',
            })
          }
        }}
        onViewStats={(code) => setStatsCode(code.code)}
        onViewUsage={(code) => setUsageCode(code.code)}
      />

      <PromoCodeFormDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) setEditingCode(null)
        }}
        editingCode={editingCode}
        communityId={selectedCommunityId}
        onSuccess={() => {
          loadPromoCodes()
          setShowCreateDialog(false)
          setEditingCode(null)
        }}
      />

      <PromoCodeStatsDialog
        open={!!statsCode}
        onOpenChange={(open) => { if (!open) setStatsCode(null) }}
        code={statsCode || ''}
      />

      <PromoCodeUsageDialog
        open={!!usageCode}
        onOpenChange={(open) => { if (!open) setUsageCode(null) }}
        code={usageCode || ''}
      />
    </PageShell>
  )
}
