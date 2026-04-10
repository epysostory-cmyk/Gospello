'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
          })
        }
        setLoading(false)
      })
  }, [params.id, supabase])

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const startISO = new Date(`${form.start_date}T${form.start_time}`).toISOString()
    const endISO = form.end_date && form.end_time
      ? new Date(`${form.end_date}T${form.end_time}`).toISOString() : null

    const { error } = await supabase.from('events').update({
      title: form.title,
      description: form.description,
      category: form.category,
      start_date: startISO,
      end_date: endISO,
      location_name: form.location_name,
      address: form.address || null,
      city: form.city,
      state: form.state,
      country: form.country,
      external_link: form.external_link || null,
      is_free: form.is_free,
      status: 'pending', // re-submit for review
    }).eq('id', params.id as string)

    if (error) { setError(error.message); setSaving(false); return }
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

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Event Details</h2>
          <div>
            <label className={labelCls}>Title *</label>
            <input type="text" required value={form.title} onChange={(e) => update('title', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea required rows={4} value={form.description} onChange={(e) => update('description', e.target.value)}
              className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={form.category} onChange={(e) => update('category', e.target.value as EventCategory)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

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
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Location</h2>
          <div>
            <label className={labelCls}>Venue Name *</label>
            <input type="text" required value={form.location_name} onChange={(e) => update('location_name', e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>City</label>
              <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State</label>
              <input type="text" value={form.state} onChange={(e) => update('state', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <label className={labelCls}>External Link</label>
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
