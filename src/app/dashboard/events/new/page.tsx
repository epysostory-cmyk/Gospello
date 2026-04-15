'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify, NIGERIAN_STATES } from '@/lib/utils'
import { Loader2, Upload } from 'lucide-react'
import type { EventCategory } from '@/types/database'

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'worship', label: 'Worship' },
  { value: 'prayer', label: 'Prayer' },
  { value: 'conference', label: 'Conference' },
  { value: 'youth', label: 'Youth' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
]

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
    location_name: '',
    address: '',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    external_link: '',
    is_free: true,
    speakers: '',
    parking_available: false,
    child_friendly: false,
    notes: '',
  })
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    // If church account, look up their church_id to link the event
    let church_id: string | null = null
    const { data: churchRow } = await supabase
      .from('churches')
      .select('id')
      .eq('profile_id', user.id)
      .single()
    if (churchRow) church_id = churchRow.id

    let banner_url: string | null = null

    if (bannerFile) {
      const ext = bannerFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('event-banners')
        .upload(path, bannerFile, { upsert: true })

      if (uploadError) {
        setError('Failed to upload banner: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('event-banners')
        .getPublicUrl(path)
      banner_url = publicUrl
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
      banner_url,
      start_date: startISO,
      end_date: endISO,
      location_name: form.location_name,
      address: form.address || null,
      city: form.city,
      state: form.state,
      country: form.country,
      external_link: form.external_link || null,
      is_free: form.is_free,
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

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Event Details</h2>

          <div>
            <label className={labelCls}>Event Title *</label>
            <input type="text" required value={form.title} onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Annual Worship Conference 2025" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Description *</label>
            <textarea required rows={4} value={form.description} onChange={(e) => update('description', e.target.value)}
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

          <div>
            <label className={labelCls}>Ticket Type *</label>
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
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Date &amp; Time</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="date" required value={form.start_date} onChange={(e) => update('start_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]} className={inputCls} />
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
                min={form.start_date} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Time</label>
              <input type="time" value={form.end_time} onChange={(e) => update('end_time', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Location</h2>
          <div>
            <label className={labelCls}>Venue Name *</label>
            <input type="text" required value={form.location_name} onChange={(e) => update('location_name', e.target.value)}
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
              <input type="text" required value={form.city} onChange={(e) => update('city', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State *</label>
              <select required value={form.state} onChange={(e) => update('state', e.target.value)} className={inputCls}>
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Logistics */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Event Logistics</h2>
          <div className="flex gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.parking_available} onChange={(e) => update('parking_available', e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded" />
              <span className="text-sm text-gray-700">Parking available</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.child_friendly} onChange={(e) => update('child_friendly', e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded" />
              <span className="text-sm text-gray-700">Child friendly</span>
            </label>
          </div>
          <div>
            <label className={labelCls}>Additional Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)}
              placeholder="Dress code, what to bring, special instructions..." className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Media & Links */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Media &amp; Links</h2>
          <div>
            <label className={labelCls}>Banner Image</label>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors overflow-hidden">
              {bannerPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
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
          <div>
            <label className={labelCls}>Registration / External Link <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="url" value={form.external_link} onChange={(e) => update('external_link', e.target.value)}
              placeholder="https://..." className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">Link to Eventbrite, Google Form, or registration page</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Your event will be reviewed by our team before going live. Usually within 24 hours.
        </p>
      </form>
    </div>
  )
}
