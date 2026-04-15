'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify, NIGERIAN_STATES } from '@/lib/utils'
import { Loader2, Upload, X } from 'lucide-react'
import type { EventCategory } from '@/types/database'
import Image from 'next/image'

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'worship', label: 'Worship' },
  { value: 'prayer', label: 'Prayer' },
  { value: 'conference', label: 'Conference' },
  { value: 'youth', label: 'Youth' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
]

const ONLINE_PLATFORMS = ['Zoom', 'YouTube Live', 'Google Meet', 'Facebook Live', 'Other']

const PREDEFINED_TAGS = [
  'Worship', 'Prayer', 'Revival', 'Youth', 'Prophetic',
  'Evangelism', 'Conference', 'Healing', 'Fasting',
]

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR']

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'worship' as EventCategory,
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    // Location
    is_online: false,
    online_platform: 'Zoom',
    online_link: '',
    location_name: '',
    address: '',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    // Ticket
    is_free: true,
    price: 0,
    currency: 'NGN',
    payment_link: '',
    // Registration
    rsvp_required: false,
    capacity_enabled: false,
    capacity: 0,
    // Misc
    external_link: '',
    speakers: '',
    parking_available: false,
    child_friendly: false,
    notes: '',
    visibility: 'public',
  })

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const remaining = 5 - galleryFiles.length
    const toAdd = files.slice(0, remaining)
    setGalleryFiles((prev) => [...prev, ...toAdd])
    setGalleryPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeGalleryImage = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index))
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (!bannerFile) { setError('Cover image is required'); return }
    if (form.is_online && !form.online_link) { setError('Event link is required for online events'); return }
    if (!form.is_online && !form.location_name) { setError('Venue name is required'); return }
    if (!form.is_free && !form.payment_link) { setError('Payment link is required for paid events'); return }
    if (form.capacity_enabled && form.capacity < 1) { setError('Capacity must be at least 1'); return }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    let church_id: string | null = null
    const { data: churchRow } = await supabase
      .from('churches')
      .select('id')
      .eq('profile_id', user.id)
      .single()
    if (churchRow) church_id = churchRow.id

    // Upload banner
    const ext = bannerFile.name.split('.').pop()
    const bannerPath = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('event-banners')
      .upload(bannerPath, bannerFile, { upsert: true })

    if (uploadError) {
      setError('Failed to upload banner: ' + uploadError.message)
      setLoading(false)
      return
    }

    const { data: { publicUrl: banner_url } } = supabase.storage
      .from('event-banners')
      .getPublicUrl(bannerPath)

    // Upload gallery images
    const gallery_urls: string[] = []
    for (let i = 0; i < galleryFiles.length; i++) {
      const gFile = galleryFiles[i]
      const gExt = gFile.name.split('.').pop()
      const gPath = `${user.id}/gallery/${Date.now()}-${i}.${gExt}`
      const { error: gErr } = await supabase.storage
        .from('event-banners')
        .upload(gPath, gFile, { upsert: true })
      if (!gErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('event-banners')
          .getPublicUrl(gPath)
        gallery_urls.push(publicUrl)
      }
    }

    const startISO = form.start_date && form.start_time
      ? new Date(`${form.start_date}T${form.start_time}`).toISOString()
      : null
    const endISO = form.end_date && form.end_time
      ? new Date(`${form.end_date}T${form.end_time}`).toISOString()
      : null

    if (!startISO) { setError('Start date and time are required'); setLoading(false); return }

    const { error: insertError } = await supabase.from('events').insert({
      organizer_id: user.id,
      church_id,
      title: form.title,
      slug: slugify(form.title) + '-' + Date.now(),
      description: form.description,
      category: form.category,
      status: 'pending',
      visibility: form.visibility,
      banner_url,
      start_date: startISO,
      end_date: endISO,
      // Location
      is_online: form.is_online,
      online_platform: form.is_online ? form.online_platform : null,
      online_link: form.is_online ? (form.online_link || null) : null,
      location_name: form.is_online ? 'Online' : form.location_name,
      address: form.is_online ? null : (form.address || null),
      city: form.is_online ? 'Online' : form.city,
      state: form.is_online ? 'Online' : form.state,
      country: form.country,
      // Ticket
      is_free: form.is_free,
      price: form.is_free ? null : form.price,
      currency: form.currency,
      payment_link: form.is_free ? null : (form.payment_link || null),
      // Registration
      rsvp_required: form.rsvp_required,
      capacity: form.capacity_enabled ? form.capacity : null,
      // Tags & gallery
      tags: selectedTags,
      gallery_urls,
      // Misc
      external_link: form.external_link || null,
      is_featured: false,
      speakers: form.speakers || null,
      parking_available: form.parking_available,
      child_friendly: form.child_friendly,
      notes: form.notes || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/events')
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Post an Event</h1>
        <p className="text-gray-500 mt-1 text-sm">Fill in the details below. Your event will be reviewed before going live.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
        )}

        {/* Section 1 — Event Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Event Details</h2>

          <div>
            <label className={labelCls}>Event Title *</label>
            <input type="text" required value={form.title} onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Annual Worship Conference 2025" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Description *</label>
            <textarea required rows={5} value={form.description} onChange={(e) => update('description', e.target.value)}
              placeholder="Describe your event..." className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Category *</label>
            <select required value={form.category} onChange={(e) => update('category', e.target.value as EventCategory)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Guest Speakers <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={form.speakers} onChange={(e) => update('speakers', e.target.value)}
              placeholder="e.g. Pastor John Doe, Dr. Jane Smith" className={inputCls} />
          </div>
        </div>

        {/* Section 2 — Date & Time */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Date &amp; Time</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="date" required value={form.start_date} onChange={(e) => update('start_date', e.target.value)}
                min={today} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Start Time *</label>
              <input type="time" required value={form.start_time} onChange={(e) => update('start_time', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>End Date <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="date" value={form.end_date} onChange={(e) => update('end_date', e.target.value)}
                min={form.start_date || today} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Time</label>
              <input type="time" value={form.end_time} onChange={(e) => update('end_time', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Section 3 — Location */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Location</h2>

          {/* Physical / Online toggle */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => update('is_online', false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                !form.is_online
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              📍 Physical
            </button>
            <button
              type="button"
              onClick={() => update('is_online', true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                form.is_online
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              🌐 Online
            </button>
          </div>

          {form.is_online ? (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Platform</label>
                <select value={form.online_platform} onChange={(e) => update('online_platform', e.target.value)} className={inputCls}>
                  {ONLINE_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Event Link *</label>
                <input type="url" value={form.online_link} onChange={(e) => update('online_link', e.target.value)}
                  placeholder="https://zoom.us/j/..." className={inputCls} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Venue Name *</label>
                <input type="text" value={form.location_name} onChange={(e) => update('location_name', e.target.value)}
                  placeholder="e.g. RCCG Auditorium" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Street Address</label>
                <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)}
                  placeholder="e.g. 14 Redemption Way" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>City *</label>
                  <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State *</label>
                  <select value={form.state} onChange={(e) => update('state', e.target.value)} className={inputCls}>
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4 — Tickets & Entry */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Tickets &amp; Entry</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${form.is_free ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" checked={form.is_free} onChange={() => update('is_free', true)} className="accent-indigo-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Free</p>
                <p className="text-xs text-gray-500">No ticket needed</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${!form.is_free ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" checked={!form.is_free} onChange={() => update('is_free', false)} className="accent-amber-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Paid</p>
                <p className="text-xs text-gray-500">Ticket required</p>
              </div>
            </label>
          </div>

          {!form.is_free && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Price *</label>
                  <input type="number" min={0} step="0.01" value={form.price}
                    onChange={(e) => update('price', parseFloat(e.target.value) || 0)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select value={form.currency} onChange={(e) => update('currency', e.target.value)} className={inputCls}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Payment Link *</label>
                <input type="url" value={form.payment_link} onChange={(e) => update('payment_link', e.target.value)}
                  placeholder="https://paystack.com/..." className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">Where attendees pay or register</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 5 — Registration */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Registration</h2>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900">RSVP Required</p>
              <p className="text-xs text-gray-500">Attendees must register to attend</p>
            </div>
            <div
              onClick={() => update('rsvp_required', !form.rsvp_required)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.rsvp_required ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.rsvp_required ? 'translate-x-5' : ''}`} />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900">Limit Capacity</p>
              <p className="text-xs text-gray-500">Set a maximum number of attendees</p>
            </div>
            <div
              onClick={() => update('capacity_enabled', !form.capacity_enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.capacity_enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.capacity_enabled ? 'translate-x-5' : ''}`} />
            </div>
          </label>

          {form.capacity_enabled && (
            <div>
              <label className={labelCls}>Max Seats</label>
              <input type="number" min={1} value={form.capacity}
                onChange={(e) => update('capacity', parseInt(e.target.value) || 0)} className={inputCls} />
            </div>
          )}
        </div>

        {/* Section 6 — Tags */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Tags</h2>
          <p className="text-xs text-gray-500">Select tags that describe your event</p>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Section 7 — Media */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Media</h2>

          {/* Banner */}
          <div>
            <label className={labelCls}>
              Banner Image <span className="text-red-500">*</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors overflow-hidden">
              {bannerPreview ? (
                <div className="relative w-full h-full">
                  <Image src={bannerPreview} alt="Banner preview" fill className="object-cover" />
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm">Click to upload banner image</span>
                  <span className="text-xs mt-1">PNG, JPG up to 5MB</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
            </label>
          </div>

          {/* Gallery */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${labelCls} mb-0`}>
                Gallery Images <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <span className="text-xs text-gray-400">{galleryFiles.length}/5 added</span>
            </div>
            {galleryPreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {galleryPreviews.map((src, i) => (
                  <div key={i} className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <Image src={src} alt={`Gallery ${i + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(i)}
                      className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {galleryFiles.length < 5 && (
              <label className="flex items-center gap-2 text-sm text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium">
                <Upload className="w-4 h-4" />
                Add gallery images
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
              </label>
            )}
          </div>
        </div>

        {/* Section 8 — Visibility */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Visibility</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${form.visibility === 'draft' ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" checked={form.visibility === 'draft'} onChange={() => update('visibility', 'draft')} className="accent-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">📝 Save as Draft</p>
                <p className="text-xs text-gray-500 mt-0.5">Won&apos;t be submitted for review yet</p>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${form.visibility === 'public' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" checked={form.visibility === 'public'} onChange={() => update('visibility', 'public')} className="accent-indigo-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">🚀 Submit for Review</p>
                <p className="text-xs text-gray-500 mt-0.5">Will be reviewed and published</p>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Submitting...' : form.visibility === 'draft' ? 'Save Draft' : 'Submit for Review'}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Your event will be reviewed by our team before going live. Usually within 24 hours.
        </p>
      </form>
    </div>
  )
}
