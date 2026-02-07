import useSWR, { useSWRConfig } from 'swr'
// If default import continues to fail, use named export or check build config
import { authenticatedFetch } from '@/lib/authenticated-fetch'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.170:3000/api'
const apiOrigin = apiBase.replace(/\/api$/, '')

export function resolveImageUrl(value?: string): string | undefined {
  const v = (value || '').trim()
  if (!v) return undefined

  // If it's already a full URL (http:// or https://), return as-is
  if (/^https?:\/\//i.test(v)) return v

  // If it's a root-relative path, prefix backend origin for upload/static paths
  if (v.startsWith('/')) {
    if (v.startsWith('/uploads') || v.startsWith('/storage') || v.startsWith('/images')) {
      return `${apiOrigin}${v}`
    }
    return v
  }

  // If it's a relative path starting with common upload directories
  if (v.startsWith('uploads') || v.startsWith('storage') || v.startsWith('images')) {
    return `${apiOrigin}/${v.replace(/^\/+/, '')}`
  }

  // If it looks like a filename or path without leading slash, assume it's in uploads/image/
  if (v && !v.includes('://')) {
    return `${apiOrigin}/uploads/image/${v}`
  }

  return undefined
}

export function normalizeUser(user: any) {
  if (!user) return user
  const rawAvatar =
    user.avatar ||
    user.photo_profil ||
    user.profile_picture ||
    user.photo ||
    user.image
  const normalizedAvatar = resolveImageUrl(rawAvatar)
  const normalizedPhotoProfil = resolveImageUrl(user.photo_profil)
  const normalizedProfilePicture = resolveImageUrl(user.profile_picture)

  return {
    ...user,
    avatar: normalizedAvatar || '/placeholder.svg',
    photo_profil: normalizedPhotoProfil ?? user.photo_profil,
    profile_picture: normalizedProfilePicture ?? user.profile_picture,
  }
}

function normalizePayload(data: any) {
  if (!data) return data
  if (Array.isArray(data)) return data.map(normalizeUser)
  return normalizeUser(data)
}

const fetcher = async (url: string) => {
  const res = await authenticatedFetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const json = await res.json().catch(() => null)
  // normalize common shapes
  const raw = json?.data || json?.user || json
  return normalizePayload(raw)
}

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR(`${apiBase}/auth/me`, fetcher, {
    revalidateOnFocus: false,
  })
  return { user: data, isLoading, error, mutate }
}

export function useUserProfile(handle?: string) {
  const key = handle ? `${apiBase}/user/by-username/${encodeURIComponent(handle)}` : null
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  })
  return { profile: data, isLoading, error, mutate }
}
