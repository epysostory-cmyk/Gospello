'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NIGERIAN_STATES } from '@/lib/utils'
import { Loader2, Trash2 } from 'lucide-react'
import type { Event, EventCategory } from '@/types/database'

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'worship', label: 'Worship' },
  { value: 'prayer', label: 'Prayer' },
  { value: 'conference', label: 'Conference' },
  { value: 'youth', label: 'Youth' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
]

const ONLINE_PLATFORMS = ['Zoom', 'YouTube Live', 'Google Meet', 'Facebook Live', 'Other']
const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR']
const PREDEFINED_TAGS = [
  'Worship', 'Prayer', 'Revival', 'Youth', 'Prophetic',
  'Evangelism', 'Conference', 'Healing', 'Fasting',
]

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', category: 'worship' as EventCategory,
    start_date: '', start_time: '', end_date: '', end_time: '',
    location_name: '', address: '', city: '', state: '', country: '',
    external_link: '', is_free: true,
    // New fields
    is_online: false,
    online_platform: 'Zoom',
    online_link: '',
    price: 0,
    currency: 'NGN',
    payment_link: '',
    rsvp_required: false,
    capacity_enabled: false,
    capacity: 0,
    tags: [] as string[],
    visibility: 'public',
  })

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .eq('id', params.id as string)
      .single()
      .then(({ data }) => {
        if (data) {
          const e = data as Event
          setEvent(e)
          const start = new Date(e.start_date)
          const end = e.end_date ? new Date(e.end_date) : null
          setForm({
            title: e.title,
            description: e.description,
            category: e.category,
            start_date: start.toISOString().split('T')[0],
            start_time: start.toTimeString().slice(0, 5),
            end_date: end ? end.toISOString().split('T')[0] : '',
            end_time: end ? end.toTimeString().slice(0, 5) : '',
            location_name: e.location_name,
            address: e.address ?? '',
            city: e.city,
            state: e.state,
            country: e.country,
            external_link: e.external_link ?? '',
            is_free: e.is_free,
            // New fields
            is_online: e.is_online ?? false,
            online_platform: e.online_platform ?? 'Zoom',
            online_link: e.online_link ?? '',
            price: e.price ?? 0,
            currency: e.currency ?? 'NGN',
            payment_link: e.payment_link ?? '',
            rsvp_required: e.rsvp_required ?? false,
            capacity_enabled: e.capacity != null,
            capacity: e.capacity ?? 0,
            tags: e.tags ?? [],
            visibility: e.visibility ?? 'public',
          })
        }
        setLoading(false)
      })
  }, [params.id, supabase])

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const startISO = new Date(`${form.start_date}T${form.start_time}`).toISOString()
    const endISO = form.end_date && form.end_time
      ? new Date(`${form.end_date}T${form.end_time}`).toISOString() : null

    const { error: saveError } = await supabase.from('events').update({
      title: form.title,
      description: form.description,
      category: form.category,
      start_date: startISO,
      end_date: endISO,
      location_name: form.is_online ? 'Online' : form.location_name,
      address: form.is_online ? null : (form.address || null),
      city: form.is_online ? 'Online' : form.city,
      state: form.is_online ? 'Online' : form.state,
      country: form.country,
      external_link: form.external_link || null,
      is_free: form.is_free,
      status: 'pending', // re-submit for review
      // New fields
      is_online: form.is_online,
      online_platform: form.is_online ? form.online_platform : null,
      online_link: form.is_online ? (form.online_link || null) : null,
      price: form.is_free ? null : form.price,
      currency: form.currency,
      payment_link: form.is_free ? null : (form.payment_link || null),
      rsvp_required: form.rsvp_required,
      capacity: form.capacity_enabled ? form.capacity : null,
      tags: form.tags,
      visibility: form.visibility,
    }).eq('id', params.id as string)

    if (saveError) { setError(saveError.message); setSaving(false); return }
    setSuccess(true)
    setSaving(false)
    setTimeout(() => router.push('/dashboard/events'), 1500)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return
    setDeleting(true)
    await supabase.from('events').delete().eq('id', params.id as string)
    router.push('/dashboard/events')
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
  if (!event) return <div className="py-20 text-center text-gray-500">Event not found</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-500 mt-1 text-sm">Changes will be re-submitted for review</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete
        </button>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">
          ✓ Event updated and re-submitted for review!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}

        {/* Event Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Event Details</h2>
          <div>
            <label className={labelCls}>Title *</label>
            <input type="text" required value={form.title} onChange={(e) => update('title', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea required rows={5} value={form.description} onChange={(e) => update('description', e.target.value)}
              className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={form.category} onChange={(e) => update('category', e.target.value as EventCategory)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Date &amp; Time</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="date" required value={form.start_date} onChange={(e) => update('start_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Start Time *</label>
              <input type="time" required value={form.start_time} onChange={(e) => update('start_time', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>End Date</label>
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

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => update('is_online', false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                !form.is_online ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              📍 Physical
            </button>
            <button
              type="button"
              onClick={() => update('is_online', true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                form.is_online ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
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
                <label className={labelCls}>Event Link</label>
                <input type="url" value={form.online_link} onChange={(e) => update('online_link', e.target.value)}
                  placeholder="https://zoom.us/j/..." className={inputCls} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Venue Name *</label>
                <input type="text" required value={form.location_name} onChange={(e) => update('location_name', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Street Address</label>
                <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>City</label>
                  <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <select value={form.state} onChange={(e) => update('state', e.target.value)} className={inputCls}>
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tickets */}
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
                  <label className={labelCls}>Price</label>
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
                <label className={labelCls}>Payment Link</label>
                <input type="url" value={form.payment_link} onChange={(e) => update('payment_link', e.target.value)}
                  placeholder="https://paystack.com/..." className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">Where attendees pay or register</p>
              </div>
            </div>
          )}
        </div>

        {/* RSVP & Capacity */}
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

        {/* Tags */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.tags.includes(tag)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
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

        {/* External Link */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <label className={labelCls}>External Link <span className="text-gray-400 font-normal">(optional)</span></label>
          <input type="url" value={form.external_link} onChange={(e) => update('external_link', e.target.value)}
            placeholder="https://..." className={inputCls} />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
