'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NIGERIAN_STATES } from '@/lib/utils'
import { Loader2, Camera, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import type { Church } from '@/types/database'

interface Props {
  church: Church
  userId: string
}

export default function ChurchProfileForm({ church, userId }: Props) {
  const supabase = createClient()
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [currentLogoUrl, setCurrentLogoUrl] = useState(church.logo_url)
  const [currentBannerUrl, setCurrentBannerUrl] = useState(church.banner_url)

  const [serviceTimes, setServiceTimes] = useState<string[]>(
    church.service_times ? church.service_times.split('\n').filter(Boolean) : ['']
  )

  const [form, setForm] = useState({
    name: church.name,
    description: church.description ?? '',
    address: church.address ?? '',
    city: church.city,
    state: church.state,
    country: church.country,
    website_url: church.website_url ?? '',
    phone: church.phone ?? '',
  })

  const update = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { setError(`${type === 'logo' ? 'Logo' : 'Banner'} must be under 3 MB`); return }
    const preview = URL.createObjectURL(file)
    if (type === 'logo') { setLogoFile(file); setLogoPreview(preview) }
    else { setBannerFile(file); setBannerPreview(preview) }
  }

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const { error } = await supabase.storage.from('church-assets').upload(path, file, { upsert: true })
    if (error) { setError('Upload failed: ' + error.message); return null }
    return supabase.storage.from('church-assets').getPublicUrl(path).data.publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    let logo_url = currentLogoUrl
    let banner_url = currentBannerUrl

    if (logoFile) {
      const url = await uploadImage(logoFile, `${userId}/logo.${logoFile.name.split('.').pop()}`)
      if (!url) { setSaving(false); return }
      logo_url = url
    }

    if (bannerFile) {
      const url = await uploadImage(bannerFile, `${userId}/banner.${bannerFile.name.split('.').pop()}`)
      if (!url) { setSaving(false); return }
      banner_url = url
    }

    const { error: updateError } = await supabase
      .from('churches')
      .update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        address: form.address.trim() || null,
        city: form.city,
        state: form.state,
        country: form.country,
        service_times: serviceTimes.filter(t => t.trim()).join('\n') || null,
        website_url: form.website_url.trim() || null,
        phone: form.phone.trim() || null,
        logo_url,
        banner_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', church.id)

    await supabase.from('profiles').update({ display_name: form.name.trim() }).eq('id', userId)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setCurrentLogoUrl(logo_url)
      setCurrentBannerUrl(banner_url)
      setLogoFile(null); setLogoPreview(null)
      setBannerFile(null); setBannerPreview(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    }
  }

  const displayLogo = logoPreview ?? currentLogoUrl
  const displayBanner = bannerPreview ?? currentBannerUrl

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Photos */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Photos</h2>
        </div>
        <div className="px-6 py-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Banner image</p>
            <div
              className="relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 cursor-pointer group"
              onClick={() => bannerRef.current?.click()}
            >
              {displayBanner ? (
                <Image src={displayBanner} alt="Church banner" fill className="object-cover" unoptimized={!!bannerPreview} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Click to upload banner</div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'banner')} />
            <p className="text-xs text-gray-400 mt-1">Recommended: 1200×400px · max 3 MB</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Logo</p>
            <div className="flex items-center gap-4">
              <div
                className="relative w-20 h-20 rounded-2xl overflow-hidden bg-indigo-50 flex items-center justify-center cursor-pointer group flex-shrink-0"
                onClick={() => logoRef.current?.click()}
              >
                {displayLogo ? (
                  <Image src={displayLogo} alt="Logo" fill className="object-cover" unoptimized={!!logoPreview} />
                ) : (
                  <span className="text-2xl font-bold text-indigo-300">{form.name[0]}</span>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <button type="button" onClick={() => logoRef.current?.click()} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  Change logo
                </button>
                <p className="text-xs text-gray-400 mt-0.5">Square image · max 3 MB</p>
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'logo')} />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Church Details</h2>
        </div>
        <div className="px-6 py-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Church name <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3}
              placeholder="Tell people about your church..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
              placeholder="Street address"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <select value={form.state} onChange={e => update('state', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Service times</label>
              <button type="button" onClick={() => setServiceTimes(t => [...t, ''])}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus className="w-3.5 h-3.5" /> Add time
              </button>
            </div>
            <div className="space-y-2">
              {serviceTimes.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={t}
                    onChange={e => setServiceTimes(prev => prev.map((s, idx) => idx === i ? e.target.value : s))}
                    placeholder="e.g. Sundays 8am & 10:30am"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {serviceTimes.length > 1 && (
                    <button type="button" onClick={() => setServiceTimes(t => t.filter((_, idx) => idx !== i))}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
              <input type="url" value={form.website_url} onChange={e => update('website_url', e.target.value)}
                placeholder="https://yourchurch.org"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                placeholder="+234 801 234 5678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 px-4 py-3 rounded-xl">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />Church profile saved successfully
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
