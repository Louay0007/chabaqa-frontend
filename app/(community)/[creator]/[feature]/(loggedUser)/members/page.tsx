"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Loader2, Users as UsersIcon, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { communitiesApi } from '@/lib/api/communities.api'
import { useAuthContext } from '@/app/providers/auth-provider'
import type { CommunityMember } from '@/lib/api/types'

interface Community {
  id: string
  _id?: string
  name: string
}

export default function CommunityMembersPage({ params }: { params: Promise<{ creator?: string; feature: string }> }) {
  const resolvedParams = React.use(params)
  const { feature } = resolvedParams

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [community, setCommunity] = useState<Community | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [search, setSearch] = useState('')
  const { user: currentUser } = useAuthContext()
  const myId = currentUser?.id || (currentUser as any)?._id || ''

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true)
        setError(null)

        const communityRes = await communitiesApi.getBySlug(feature)
        const c = communityRes.data as any
        setCommunity({
          id: c.id || c._id,
          _id: c._id,
          name: c.name,
        })

        const communityId = c._id || c.id
        const membersRes: any = await communitiesApi.getMembers(communityId, { page: 1, limit: 200 })

        const items = Array.isArray(membersRes?.data)
          ? membersRes.data
          : Array.isArray(membersRes?.data?.data)
            ? membersRes.data.data
            : []

        setMembers(items)
      } catch (err: any) {
        console.error('Error loading community members:', err)
        setError(err?.message || err?.error || 'Failed to load members')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [feature])

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members

    return members.filter((m) => {
      const name = `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim().toLowerCase()
      const username = (m.user?.username || '').toLowerCase()
      const email = (m.user?.email || '').toLowerCase()
      const role = (m.role || '').toLowerCase()
      return name.includes(q) || username.includes(q) || email.includes(q) || role.includes(q)
    })
  }, [members, search])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading members...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold mb-2">Failed to load members</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Members</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              {community?.name ? `${community.name} members` : 'Community members'}
            </p>
          </div>

          <div className="w-full sm:w-80">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members by name, username, email, role..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const user = member.user as any
            const fullName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Member'
            const initials = fullName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((p: string) => p[0])
              .join('')
              .toUpperCase()

            const memberId = user?.id || user?._id || member.userId
            const isSelf = memberId === myId

            return (
              <Card key={member.id} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user?.avatar || (user as any)?.profile_picture || (user as any)?.photo_profil || (user as any)?.photo || "/placeholder.svg"} />
                        <AvatarFallback>{initials || 'U'}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{fullName}</div>
                        {user?.email && (
                          <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                        )}
                        {user?.username && (
                          <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                        )}
                      </div>
                    </div>

                    <Badge variant={member.role === 'admin' ? 'default' : member.role === 'moderator' ? 'secondary' : 'outline'}>
                      {member.role}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    {!isSelf && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => {
                          const targetUserId = user?.id || user?._id || member.userId
                          console.log('[Members] DM button clicked:', { 
                            targetUserId, 
                            memberId: member.id,
                            userId: member.userId,
                            user_id: user?.id,
                            user__id: user?._id,
                            communityId: community?.id || community?._id,
                            myId 
                          })
                          window.dispatchEvent(new CustomEvent('open-dm', { 
                            detail: { 
                              communityId: community?.id || community?._id, 
                              targetUserId 
                            } 
                          }))
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        DM
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center text-muted-foreground py-10">No members found.</div>
        )}
      </div>
    </div>
  )
}
