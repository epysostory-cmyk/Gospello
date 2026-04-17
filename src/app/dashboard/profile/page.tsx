'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Camera, CheckCircle, AlertCircle, User } from 'lucide-react'
import Image from 'next/image'
import type { AccountType } from '@/types/database'

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
]

interface ProfileForm {
  display_name: string
  email: string
  account_type: AccountType
  church_name: string
  bio: string
  state: string
  website: string
}

export default function ProfilePage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileForm>({
    display_name: '',
    email: '',
    account_type: 'organizer',
    church_name: '',
    bio: '',
    state: '',
    website: '',
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setForm({
          display_name: profile.display_name ?? '',
          email: profile.email ?? '',
          account_type: profile.account_type ?? 'organizer',
          church_name: (profile as any).church_name ?? '',
          bio: (profile as any).bio ?? '',
          state: (profile as any).state ?? '',
          website: (profile as any).website ?? '',
        })
        setAvatarUrl(profile.avatar_url)
      }

      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar must be under 2 MB')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !userId) return avatarUrl

    setUploadingAvatar(true)
    const ext = avatarFile.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, avatarFile, { upsert: true })

    setUploadingAvatar(false)

    if (uploadError) {
      setError('Avatar upload failed: ' + uploadError.message)
      return null
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    return publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    if (!form.display_name.trim()) {
      setError('Display name is required')
      setSaving(false)
      return
    }

    let newAvatarUrl = avatarUrl

    if (avatarFile) {
      const uploaded = await uploadAvatar()
      if (uploaded === null) {
        setSaving(false)
        return
      }
      newAvatarUrl = uploaded
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: form.display_name.trim(),
        church_name: form.account_type === 'church' ? form.church_name.trim() || null : null,
        bio: form.bio.trim() || null,
        state: form.state || null,
        website: form.website.trim() || null,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId!)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setAvatarUrl(newAvatarUrl)
      setAvatarFile(null)
      setAvatarPreview(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (pwForm.next.length < 8) {
      setPwError('New password must be at least 8 characters')
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Passwords do not match')
      return
    }

    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    setPwSaving(false)

    if (error) {
      setPwError(error.message)
    } else {
      setPwForm({ current: '', next: '', confirm: '' })
      setPwSuccess(true)
      setTimeout(() => setPwSuccess(false), 4000)
    }
  }

  const displayAvatar = avatarPreview ?? avatarUrl
  const initials = form.display_name
    ? form.display_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Update your public profile and account details</p>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Public Profile</h2>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-indigo-100 overflow-hidden flex items-center justify-center">
                {displayAvatar ? (
                  <Image
                    src={displayAvatar}
                    alt="Avatar"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                    unoptimized={!!avatarPreview}
                  />
                ) : (
                  <span className="text-2xl font-bold text-indigo-500">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                title="Change avatar"
              >
                {uploadingAvatar
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Camera className="w-3.5 h-3.5" />
                }
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Profile photo</p>
              <p className="text-xs text-gray-500 mt-0.5">JPG, PNG or WebP · max 2 MB</p>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Remove new photo
                </button>
              )}
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Display name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              placeholder="Your name or ministry name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              maxLength={80}
            />
            <p className="text-xs text-gray-400 mt-1">
              This is the name shown on your events and public profile
            </p>
          </div>

          {/* Church name — church accounts only */}
          {form.account_type === 'church' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Church Name</label>
              <input
                type="text"
                value={form.church_name}
                onChange={e => setForm(f => ({ ...f, church_name: e.target.value }))}
                placeholder="e.g. Grace Community Church"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={100}
              />
            </div>
          )}

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Tell the community about yourself or your ministry"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              maxLength={300}
            />
            <p className="text-xs text-gray-400 mt-1">{form.bio.length}/300</p>
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
            <select
              value={form.state}
              onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="">Select your state</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Website / Social link <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="url"
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={form.email}
              readOnly
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Email cannot be changed here. Contact support if needed.
            </p>
          </div>

          {/* Account type (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Account type
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 w-fit">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 capitalize font-medium">{form.account_type}</span>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 px-4 py-3 rounded-xl">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Profile saved successfully
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving || uploadingAvatar}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {(saving || uploadingAvatar) && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : uploadingAvatar ? 'Uploading…' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* Password section */}
      <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Change Password</h2>
          <p className="text-sm text-gray-500 mt-0.5">Leave blank if you don&apos;t want to change it</p>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
            <input
              type="password"
              value={pwForm.next}
              onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
              placeholder="At least 8 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Repeat new password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoComplete="new-password"
            />
          </div>

          {pwError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 px-4 py-3 rounded-xl">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Password updated successfully
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={pwSaving || (!pwForm.next && !pwForm.confirm)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40"
          >
            {pwSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {pwSaving ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-red-100">
          <h2 className="font-semibold text-red-600">Danger Zone</h2>
        </div>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Delete account</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently remove your account and all your events. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            className="flex-shrink-0 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
            onClick={() => alert('To delete your account, please contact support@gospello.ng')}
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  )
}
