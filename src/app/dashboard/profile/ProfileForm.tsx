'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Camera, CheckCircle, AlertCircle, User, LogOut, Phone, Globe, Link2 } from 'lucide-react'
import Image from 'next/image'
import type { AccountType } from '@/types/database'
import ImageCropModal from '@/components/ui/ImageCropModal'
import OrganizerTypeChips from '@/components/ui/OrganizerTypeChips'
import { NIGERIAN_STATES } from '@/lib/utils'
import { CITIES_BY_STATE } from '@/lib/nigerian-cities'

interface ProfileFormProps {
  userId: string
  initialData: {
    display_name: string
    email: string
    account_type: AccountType
    church_name: string
    bio: string
    state: string
    city?: string | null
    address?: string | null
    phone?: string | null
    whatsapp?: string | null
    website: string
    instagram?: string | null
    facebook?: string | null
    twitter?: string | null
    youtube?: string | null
    contact_person?: string | null
    ministry_types?: string[] | null
    avatar_url: string | null
  }
}

export default function ProfileForm({ userId, initialData }: ProfileFormProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    display_name:   initialData.display_name,
    email:          initialData.email,
    account_type:   initialData.account_type,
    church_name:    initialData.church_name,
    bio:            initialData.bio,
    state:          initialData.state,
    city:           initialData.city ?? '',
    address:        initialData.address ?? '',
    phone:          initialData.phone ?? '',
    whatsapp:       initialData.whatsapp ?? '',
    website:        initialData.website,
    instagram:      initialData.instagram ?? '',
    facebook:       initialData.facebook ?? '',
    twitter:        initialData.twitter ?? '',
    youtube:        initialData.youtube ?? '',
    contact_person: initialData.contact_person ?? '',
    ministry_types: initialData.ministry_types ?? [] as string[],
  })

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData.avatar_url)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [pwForm, setPwForm] = useState({ next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  const isOrganizer = form.account_type === 'organizer'
  const cities = CITIES_BY_STATE[form.state] ?? []

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(f => {
      const next = { ...f, [k]: v }
      if (k === 'state') (next as typeof form).city = ''
      return next
    })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB'); return }
    setCropSrc(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleCropConfirm = (croppedFile: File) => {
    setCropSrc(null)
    setAvatarFile(croppedFile)
    setAvatarPreview(URL.createObjectURL(croppedFile))
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarUrl
    setUploadingAvatar(true)
    const path = `${userId}/avatar.jpg`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, avatarFile, { upsert: true, contentType: 'image/jpeg' })
    setUploadingAvatar(false)
    if (uploadError) { setError('Avatar upload failed: ' + uploadError.message); return null }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    return publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    if (!form.display_name.trim()) { setError('Display name is required'); setSaving(false); return }

    let newAvatarUrl = avatarUrl
    if (avatarFile) {
      const uploaded = await uploadAvatar()
      if (uploaded === null) { setSaving(false); return }
      newAvatarUrl = uploaded
    }

    const updatePayload: Record<string, unknown> = {
      display_name: form.display_name.trim(),
      church_name:  form.account_type === 'church' ? form.church_name.trim() || null : null,
      bio:          form.bio.trim() || null,
      state:        form.state || null,
      city:         form.city || null,
      address:      form.address.trim() || null,
      phone:        form.phone.trim() || null,
      website:      form.website.trim() || null,
      avatar_url:   newAvatarUrl,
      updated_at:   new Date().toISOString(),
    }

    if (isOrganizer) {
      updatePayload.contact_person  = form.contact_person.trim() || null
      updatePayload.ministry_types  = form.ministry_types.length > 0 ? form.ministry_types : null
      updatePayload.whatsapp        = form.whatsapp.trim() || null
      updatePayload.instagram       = form.instagram.trim() || null
      updatePayload.facebook        = form.facebook.trim() || null
      updatePayload.twitter         = form.twitter.trim() || null
      updatePayload.youtube         = form.youtube.trim() || null
    }

    const { error: updateError } = await supabase.from('profiles').update(updatePayload).eq('id', userId)
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
    if (pwForm.next.length < 8) { setPwError('New password must be at least 8 characters'); return }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    setPwSaving(false)
    if (error) {
      setPwError(error.message)
    } else {
      setPwForm({ next: '', confirm: '' })
      setPwSuccess(true)
      setTimeout(() => setPwSuccess(false), 4000)
    }
  }

  const displayAvatar = avatarPreview ?? avatarUrl
  const initials = form.display_name
    ? form.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="space-y-8 max-w-2xl">
      {cropSrc && (
        <ImageCropModal imageSrc={cropSrc} onConfirm={handleCropConfirm} onCancel={() => setCropSrc(null)} />
      )}
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
                  <Image src={displayAvatar} alt="" width={80} height={80} className="object-cover w-full h-full" unoptimized={!!avatarPreview} />
                ) : (
                  <span className="text-2xl font-bold text-indigo-500">{initials}</span>
                )}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors">
                {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Profile photo</p>
              <p className="text-xs text-gray-500 mt-0.5">JPG, PNG or WebP · max 10 MB</p>
              {avatarPreview && (
                <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null) }} className="text-xs text-red-500 hover:text-red-700 mt-1">
                  Remove new photo
                </button>
              )}
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isOrganizer ? 'Full Name' : 'Display name'} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.display_name}
              onChange={e => setField('display_name', e.target.value)}
              placeholder={isOrganizer ? 'e.g. John Adewale' : 'Your name or ministry name'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
              maxLength={80}
            />
          </div>

          {/* Church name */}
          {form.account_type === 'church' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Church Name</label>
              <input type="text" value={form.church_name} onChange={e => setField('church_name', e.target.value)}
                placeholder="e.g. Grace Community Church"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]" maxLength={100} />
            </div>
          )}

          {/* Organizer-only fields */}
          {isOrganizer && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contact Person <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="text" value={form.contact_person} onChange={e => setField('contact_person', e.target.value)}
                  placeholder="e.g. Jane Adewale"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What Best Describes You? <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <OrganizerTypeChips value={form.ministry_types} onChange={v => setField('ministry_types', v)} />
              </div>
            </>
          )}

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isOrganizer ? 'Short Description' : 'Bio'} <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.bio}
              onChange={e => setField('bio', e.target.value)}
              placeholder={isOrganizer ? 'Brief description of this organizer...' : 'Tell the community about yourself or your ministry'}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] resize-none"
              maxLength={300}
            />
            <p className="text-xs text-gray-400 mt-1">{form.bio.length}/300</p>
          </div>

          {/* State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <select value={form.state} onChange={e => setField('state', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] bg-white">
                <option value="">Select state</option>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                City <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select value={form.city} onChange={e => setField('city', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] bg-white">
                <option value="">Select city</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Address */}
          {isOrganizer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input type="text" value={form.address} onChange={e => setField('address', e.target.value)}
                placeholder="e.g. 14 Bode Thomas Street, Surulere"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]" />
            </div>
          )}

          {/* Contact & Social */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Contact &amp; Social <span className="text-gray-400 font-normal">(optional)</span></p>

            {isOrganizer && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]" />
                </div>
              </div>
            )}

            {isOrganizer && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={form.whatsapp} onChange={e => setField('whatsapp', e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="url" value={form.website} onChange={e => setField('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]" />
              </div>
            </div>

            {isOrganizer && ([
              { key: 'instagram' as const, label: 'Instagram',   placeholder: '@handle or full URL' },
              { key: 'facebook'  as const, label: 'Facebook',    placeholder: 'facebook.com/page' },
              { key: 'twitter'   as const, label: 'Twitter / X', placeholder: '@handle or full URL' },
              { key: 'youtube'   as const, label: 'YouTube',     placeholder: 'youtube.com/channel' },
            ]).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form[key]} onChange={e => setField(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]" />
                </div>
              </div>
            ))}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input type="email" value={form.email} readOnly
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed here. Contact support if needed.</p>
          </div>

          {/* Account type (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Account type</label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 w-fit">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 capitalize font-medium">{form.account_type}</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 px-4 py-3 rounded-xl">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />Profile saved successfully
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button type="submit" disabled={saving || uploadingAvatar}
            className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
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
            <input type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
              placeholder="At least 8 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]" autoComplete="new-password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Repeat new password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]" autoComplete="new-password" />
          </div>
          {pwError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 px-4 py-3 rounded-xl">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />Password updated successfully
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button type="submit" disabled={pwSaving || (!pwForm.next && !pwForm.confirm)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40">
            {pwSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {pwSaving ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>

      {/* Sign out — mobile only */}
      <div className="md:hidden bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Sign out</p>
            <p className="text-xs text-gray-500 mt-0.5">Sign out of your Gospello account</p>
          </div>
          <button type="button"
            className="flex items-center gap-2 flex-shrink-0 text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
            onClick={() => { window.location.href = '/auth/signout' }}>
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-red-100">
          <h2 className="font-semibold text-red-600">Danger Zone</h2>
        </div>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Delete account</p>
            <p className="text-xs text-gray-500 mt-0.5">Permanently remove your account and all your events. This cannot be undone.</p>
          </div>
          <button type="button"
            className="flex-shrink-0 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
            onClick={() => alert('To delete your account, please contact support@gospello.ng')}>
            Delete account
          </button>
        </div>
      </div>
    </div>
  )
}
