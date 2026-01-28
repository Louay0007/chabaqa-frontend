"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { updateProfile } from "@/lib/api/user.api"
import { storageApi } from "@/lib/api/storage.api"
import { useCurrentUser } from "@/lib/hooks/useUser"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AtSign, User as UserIcon, Mail as MailIcon, MapPin, Pencil, Save as SaveIcon } from "lucide-react"

function slugFromUser(u: any) {
  const emailLocal = (u?.email || "").split("@")[0]
  const fromName = (u?.name || emailLocal || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return emailLocal || fromName || "user"
}

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const { user, isLoading, mutate } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  // Form fields
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [location, setLocation] = useState("")
  const [bio, setBio] = useState("")
  const [nameTouched, setNameTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [locationTouched, setLocationTouched] = useState(false)
  const [bioTouched, setBioTouched] = useState(false)

  // Profile Picture
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  // Validation helpers
  const isValidEmail = (v: string) => /.+@.+\..+/.test((v || '').trim())
  const currentVille = (user as any)?.ville || ""
  const currentPays = (user as any)?.pays || ""
  const currentLocation = [currentVille, currentPays].filter(Boolean).join(", ")
  const isDirty = (
    fullName !== (user?.name || "") ||
    email !== (user?.email || "") ||
    bio !== ((user as any)?.bio || "") ||
    bio !== ((user as any)?.bio || "") ||
    location !== currentLocation ||
    (!!uploadedAvatarUrl && uploadedAvatarUrl !== user?.avatar)
  )
  const isValid = (
    (!!fullName || !!user?.name) &&
    (!!email && isValidEmail(email))
  )
  const nameError = !fullName.trim() ? "Full name is required" : ""
  const emailError = !email.trim() ? "Email is required" : (!isValidEmail(email) ? "Enter a valid email address" : "")
  const BIO_MAX = 300

  useEffect(() => {
    // when SWR provides user, prefill
    if (!isLoading) {
      if (!user) {
        router.replace("/signin")
        return
      }
      const expected = slugFromUser(user)
      if (params?.slug && params.slug !== expected) {
        router.replace(`/profile/${expected}/edit`)
        return
      }
      const ua: any = user
      setUsername((ua.email || "").split("@")[0])
      setFullName(ua.name || "")
      setEmail(ua.email || "")
      const loc = [ua.ville, ua.pays].filter(Boolean).join(", ")
      setLocation(loc)
      setBio(ua.bio || "")
      setLoading(false)
    }
  }, [isLoading, user, params?.slug, router])



  const avatarUrl = uploadedAvatarUrl || user?.avatar || "/placeholder.svg"

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file")
      return
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB")
      return
    }

    setUploading(true)
    setError("")

    try {
      const uploaded = await storageApi.upload(file)
      setUploadedAvatarUrl(uploaded.url)
      console.log("Uploaded avatar URL:", uploaded.url) // Debugging
    } catch (err: any) {
      console.error("Upload failed:", err)
      setError(err.message || "Failed to upload image")
    } finally {
      setUploading(false)
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!isDirty || !isValid) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      // Split location into city and country if possible
      const parts = (location || "").split(",")
      const ville = (parts[0] || "").trim() || undefined
      const pays = (parts.slice(1).join(",") || "").trim() || undefined
      const payload: any = {
        name: fullName || undefined,
        email: email || undefined,
        ville,
        pays,

        bio: bio || undefined,
        photo_profil: uploadedAvatarUrl || undefined
      }
      // Prepare optimistic user
      const optimisticUser = {
        ...(user as any),
        name: payload.name ?? user?.name,
        email: payload.email ?? user?.email,
        bio: payload.bio ?? (user as any)?.bio,
        ville: payload.ville ?? (user as any)?.ville,

        pays: payload.pays ?? (user as any)?.pays,
        photo_profil: payload.photo_profil ?? (user as any)?.photo_profil,
        avatar: payload.photo_profil ?? user?.avatar,
      }
      // Optimistic update with rollback on error
      await mutate(optimisticUser, { revalidate: false })
      await updateProfile(payload)
      await mutate() // revalidate from server
      setSuccess("Profile updated successfully")
      // Revalidate current user cache
      try { await mutate() } catch { }
      const handle = slugFromUser({ name: fullName || user?.name, email: email || user?.email })
      setTimeout(() => router.replace(`/profile/${handle}`), 700)
    } catch (err: any) {
      // rollback to server value
      try { await mutate() } catch { }
      setError(err?.message || "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white emoji-font">
        <Header />
        <main className="flex justify-center pt-16 pb-32 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-40">
          <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white emoji-font">
      <Header />
      <main className="flex justify-center pt-16 pb-32 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-40">
        <div className="flex flex-col gap-6 w-full max-w-4xl">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-text-secondary">Update your profile information and personal details.</p>
          </div>

          <div className="border border-border-color rounded-xl bg-white shadow-subtle p-6 sm:p-8 relative">
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
              <div className="relative shrink-0">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-24 w-24 sm:h-28 sm:w-28 relative" style={{ backgroundImage: `url(${avatarUrl})` }}>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={handleFileClick}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors border-2 border-white disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <h2 className="text-2xl font-bold leading-tight">{fullName || user?.name}</h2>
                <p className="text-text-secondary">@{username}</p>
                <p className="text-text-secondary mt-4">Show us that beautiful smile ✨</p>
                <p className="text-text-secondary mt-1">Update your photo and personal details.</p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="username">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      className="w-full rounded-lg border border-border-color pl-10 pr-4 py-2 bg-gray-50 text-gray-600"
                      value={username}
                      readOnly
                      aria-readonly
                      title="Your public handle is derived from your email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="fullName">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      className={`w-full rounded-lg border pl-10 pr-4 py-2 focus:ring-2 transition ${nameTouched && nameError ? 'border-red-300 focus:ring-red-200' : 'border-border-color focus:ring-primary focus:border-primary'}`}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => setNameTouched(true)}
                      aria-invalid={nameTouched && !!nameError}
                      autoComplete="name"
                      maxLength={80}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  {nameTouched && nameError && (
                    <p className="mt-1 text-xs text-red-600">{nameError}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="email">Email Address</label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`w-full rounded-lg border pl-10 pr-4 py-2 focus:ring-2 transition ${emailTouched && emailError ? 'border-red-300 focus:ring-red-200' : 'border-border-color focus:ring-primary focus:border-primary'}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    aria-invalid={emailTouched && !!emailError}
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                {emailTouched && emailError && (
                  <p className="mt-1 text-xs text-red-600">{emailError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="location">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
                  <input
                    id="location"
                    name="location"
                    type="text"
                    className="w-full rounded-lg border border-border-color pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    placeholder="City, Country"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onBlur={() => setLocationTouched(true)}
                    autoComplete="address-level2"
                    maxLength={80}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  placeholder="Tell us a little about yourself..."
                  className="w-full rounded-lg border border-border-color p-3 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                  onBlur={() => setBioTouched(true)}
                  maxLength={BIO_MAX}
                />
                <div className="mt-1 text-xs text-text-tertiary text-right">{bio.length}/{BIO_MAX}</div>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}
              {success && <div className="text-sm text-green-600">{success}</div>}

              <div className="border-t border-border-color pt-6 flex flex-col sm:flex-row justify-end items-center gap-3">
                <button type="button" onClick={() => router.back()} className="flex min-w-[84px] items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white hover:bg-gray-100 transition-colors text-text-secondary text-sm font-bold border border-border-color">Cancel</button>
                <Button type="submit" disabled={saving || !isDirty || !isValid} aria-disabled={saving || !isDirty || !isValid} className={`flex min-w-[84px] items-center justify-center gap-2 rounded-lg h-10 px-4 text-white text-sm font-bold border ${saving || !isDirty || !isValid ? 'bg-[#8e78fb]/60 border-[#7b61f8]/60 cursor-not-allowed' : 'bg-[#8e78fb] hover:bg-[#7b61f8] border-[#7b61f8]'}`}>
                  <SaveIcon className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
      <style jsx>{`
        .emoji-font { font-family: Manrope, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif; }
      `}</style>
    </div>
  )
}
