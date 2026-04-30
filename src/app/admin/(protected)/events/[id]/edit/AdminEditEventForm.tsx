'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Upload, Loader2 } from 'lucide-react'
import { NIGERIAN_STATES } from '@/lib/utils'
import type { CategoryRow } from '@/app/actions/categories'
import type { DaySchedule } from '@/types/database'
import { updateAdminEvent } from '../../new/actions'
import TimezoneSelector from '@/components/ui/TimezoneSelector'

/* ── Schedule helpers ─────────────────────────────────── */
function fmt12(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}
function fmtDayFull(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Africa/Lagos',
  })
}
function fmtDayShort(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NG', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'Africa/Lagos',
  })
}
function getDateRange(start: string, end: string): string[] {
  if (!start || !end) return []
  const dates: string[] = []
  const cur = new Date(start + 'T12:00:00')
  const last = new Date(end + 'T12:00:00')
  if (last < cur) return []
  let count = 0
  while (cur <= last && count < 31) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
    count++
  }
  return dates
}

async function uploadBanner(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  body.append('bucket', 'event-banners')
  body.append('folder', 'event-banners')
  const res = await fetch('/api/upload', { method: 'POST', body })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Upload failed')
  return json.url as string
}

interface Props {
  adminId: string
  event: any
  categories: CategoryRow[]
}

export default function AdminEditEventForm({ adminId, event, categories }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const bannerRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  /* ── Detect event type from existing data ── */
  const isMultiDay = Array.isArray(event.daily_schedule) && event.daily_schedule.length > 0

  const [eventType, setEventType] = useState<'single' | 'multi'>(isMultiDay ? 'multi' : 'single')
  const [scheduleMap, setScheduleMap] = useState<Record<string, { start_time: string; end_time: string }>>(() => {
    if (isMultiDay) {
      return Object.fromEntries(
        (event.daily_schedule as DaySchedule[]).map(d => [
          d.date, { start_time: d.start_time, end_time: d.end_time ?? '' }
        ])
      )
    }
    return {}
  })

  const [form, setForm] = useState({
    title:         event.title ?? '',
    description:   event.description ?? '',
    category:      event.category ?? (categories[0]?.slug ?? ''),
    // single-day fields
    start_date:    isMultiDay ? (event.daily_schedule[0]?.date ?? '') : (event.start_date?.split('T')[0] ?? ''),
    start_time:    isMultiDay ? '' : (event.start_date?.split('T')[1]?.substring(0, 5) ?? ''),
    end_date:      isMultiDay ? (event.daily_schedule[event.daily_schedule.length - 1]?.date ?? '') : '',
    end_time:      isMultiDay ? '' : (event.end_date?.split('T')[1]?.substring(0, 5) ?? ''),
    is_online:     event.is_online ?? false,
    online_platform: event.online_platform ?? '',
    online_link:   event.online_link ?? '',
    location_name: event.location_name ?? '',
    address:       event.address ?? '',
    city:          event.city ?? '',
    state:         event.state ?? 'Lagos',
    registration_type: (event.registration_type ?? 'free_no_registration') as 'free_no_registration' | 'free_registration' | 'paid',
    price:         event.price?.toString() ?? '',
    currency:      event.currency ?? 'NGN',
    payment_link:  event.payment_link ?? '',
    capacity:      event.capacity?.toString() ?? '',
    tags:          (event.tags ?? []) as string[],
    banner_url:    event.banner_url ?? '',
    visibility:    (event.visibility ?? 'public') as 'public' | 'draft',
    speakers:      event.speakers ?? '',
    parking_available: event.parking_available ?? false,
    child_friendly:    event.child_friendly ?? false,
    notes:         event.notes ?? '',
    source_url:    event.source_url ?? '',
    daily_schedule: (event.daily_schedule ?? null) as DaySchedule[] | null,
    timezone:      event.timezone ?? 'Africa/Lagos',
    livestream_url: event.livestream_url ?? '',
  })

  const set = (k: string, v: string | boolean | string[] | DaySchedule[] | null) =>
    setForm(p => ({ ...p, [k]: v }))

  /* Sync scheduleMap → form.daily_schedule when in multi mode */
  useEffect(() => {
    if (eventType !== 'multi') return
    const dates = getDateRange(form.start_date, form.end_date)
    setScheduleMap(prev => {
      const next: Record<string, { start_time: string; end_time: string }> = {}
      for (const d of dates) next[d] = prev[d] ?? { start_time: '', end_time: '' }
      return next
    })
  }, [form.start_date, form.end_date, eventType])

  const dateRange = useMemo(
    () => eventType === 'multi' ? getDateRange(form.start_date, form.end_date) : [],
    [form.start_date, form.end_date, eventType]
  )
  const tooLong = dateRange.length > 14
  const completedDays = dateRange.filter(d => scheduleMap[d]?.start_time).length

  /* ── Banner upload ── */
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const url = await uploadBanner(file)
      set('banner_url', url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (bannerRef.current) bannerRef.current.value = ''
    }
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    if (!form.title.trim()) { setError('Event title is required'); return }

    let startDatetime: string
    let endDatetime: string | null
    let daily_schedule: DaySchedule[] | null = null

    if (eventType === 'multi') {
      if (!form.start_date) { setError('Start date is required'); return }
      if (!form.end_date)   { setError('End date is required'); return }
      if (tooLong)          { setError('Event duration cannot exceed 14 days'); return }
      if (dateRange.length === 0) { setError('End date must be after start date'); return }
      const missing = dateRange.find(d => !scheduleMap[d]?.start_time)
      if (missing) { setError(`Start time is required for ${fmtDayShort(missing)}`); return }

      daily_schedule = dateRange.map(d => ({
        date: d,
        start_time: scheduleMap[d].start_time,
        end_time: scheduleMap[d].end_time || null,
      }))
      startDatetime = `${dateRange[0]}T${scheduleMap[dateRange[0]].start_time}:00+01:00`
      const lastD = dateRange[dateRange.length - 1]
      endDatetime = `${lastD}T${scheduleMap[lastD].end_time || '23:59'}:00+01:00`
    } else {
      if (!form.start_date) { setError('Start date is required'); return }
      if (!form.start_time) { setError('Start time is required'); return }
      startDatetime = `${form.start_date}T${form.start_time}:00+01:00`
      endDatetime   = form.end_time ? `${form.start_date}T${form.end_time}:00+01:00` : null
    }

    setIsPending(true)
    try {
      const result = await updateAdminEvent({
        eventId: event.id,
        form: { ...form, daily_schedule },
        startDatetime,
        endDatetime,
      })
      if (result.error) { setError(result.error); return }
      setSaved(true)
      router.push('/admin/events')
    } finally {
      setIsPending(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 bg-white'
  const labelCls = 'block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5'

  /* ── Who hosts this event (read-only) ── */
  const hostName = event.churches?.name ?? event.seeded_organizers?.name ?? event.profiles?.display_name ?? 'Unknown'
  const hostSub  = event.churches
    ? `${event.churches.city}, ${event.churches.state} · Church`
    : event.seeded_organizers
    ? `${event.seeded_organizers.city ?? ''}, ${event.seeded_organizers.state ?? ''} · Organizer`
    : event.profiles
    ? `${event.profiles.city ?? ''}, ${event.profiles.state ?? ''} · Organizer`
    : ''

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-sm text-gray-500 mt-0.5">Changes are saved immediately and stay approved</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Hosted by (read-only) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
          <p className={labelCls}>Hosted By</p>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-white border border-gray-200 flex-shrink-0">
              {event.churches ? '⛪' : '🎤'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{hostName}</p>
              {hostSub && <p className="text-xs text-gray-500">{hostSub}</p>}
            </div>
            <span className="ml-auto text-xs text-gray-400 italic">Cannot change</span>
          </div>
        </div>

        {/* Event details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Event Details</p>
          <div>
            <label className={labelCls}>Event Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Annual Worship Concert 2026" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Describe the event..." className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Category <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Speakers / Guests</label>
            <input value={form.speakers} onChange={e => set('speakers', e.target.value)} placeholder="e.g. Pastor John Doe, Mercy Chinwo" className={inputCls} />
          </div>
        </div>

        {/* Banner */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Banner Image</p>
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          {form.banner_url ? (
            <div className="space-y-3">
              <div className="relative h-44 rounded-xl overflow-hidden bg-gray-100">
                <Image src={form.banner_url} alt="Banner preview" fill className="object-cover" />
              </div>
              <button type="button" onClick={() => { set('banner_url', ''); if (bannerRef.current) bannerRef.current.value = '' }}
                className="w-full py-2 px-4 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
                Change Banner
              </button>
            </div>
          ) : (
            <>
              <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerUpload} disabled={uploading} className="hidden" />
              <button type="button" onClick={() => bannerRef.current?.click()} disabled={uploading}
                className="w-full py-10 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#7C3AED] hover:bg-violet-50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-60">
                {uploading
                  ? <><Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" /><span className="text-sm text-[#7C3AED] font-medium">Uploading…</span></>
                  : <><Upload className="w-6 h-6 text-gray-400" /><span className="text-sm font-medium text-gray-700">Click to upload banner</span><span className="text-xs text-gray-400">PNG, JPG, WebP · max 2 MB</span></>
                }
              </button>
            </>
          )}
        </div>

        {/* Date & time */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-5">
          <p className="text-sm font-semibold text-gray-900">Date &amp; Time</p>

          {/* Single / Multi toggle */}
          <div>
            <label className={labelCls}>Event Duration</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['single', '📅', 'Single Day'],
                ['multi',  '📆', 'Multiple Days'],
              ] as const).map(([type, icon, label]) => {
                const active = eventType === type
                return (
                  <button key={type} type="button"
                    onClick={() => {
                      setEventType(type)
                      if (type === 'single') { set('end_date', ''); setScheduleMap({}) }
                      else { set('start_time', ''); set('end_time', '') }
                    }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      active ? 'border-[#7C3AED] bg-violet-50 text-[#7C3AED]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{icon}</span> {label}
                    {active && (
                      <span className="ml-auto w-4 h-4 rounded-full bg-[#7C3AED] flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                          <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Single day ── */}
          {eventType === 'single' && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Time <span className="text-red-500">*</span></label>
                  <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className={inputCls} />
                  {form.start_time && <p className="text-xs text-[#7C3AED] font-semibold mt-1">{fmt12(form.start_time)}</p>}
                </div>
                <div>
                  <label className={labelCls}>End Time <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} className={inputCls} />
                  {form.end_time && <p className="text-xs text-gray-500 mt-1">{fmt12(form.end_time)}</p>}
                </div>
              </div>
              {form.start_date && form.start_time && (
                <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-4 py-2.5">
                  <span className="text-violet-500">📅</span>
                  <p className="text-sm font-medium text-violet-800">
                    {fmtDayShort(form.start_date)} · {fmt12(form.start_time)}{form.end_time ? ` – ${fmt12(form.end_time)}` : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Multi-day ── */}
          {eventType === 'multi' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>End Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.end_date} min={form.start_date} onChange={e => set('end_date', e.target.value)} className={inputCls} />
                </div>
              </div>

              {dateRange.length > 0 && !tooLong && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {dateRange.length} day{dateRange.length > 1 ? 's' : ''}
                </span>
              )}
              {tooLong && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  <span>⚠️</span><span>Event duration cannot exceed 14 days.</span>
                </div>
              )}

              {!tooLong && dateRange.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Daily Schedule</p>
                    <span className="text-xs text-gray-400">{completedDays}/{dateRange.length} days set</span>
                  </div>
                  {dateRange.map((date, idx) => {
                    const entry = scheduleMap[date] ?? { start_time: '', end_time: '' }
                    const done = !!entry.start_time
                    return (
                      <div key={date} className={`rounded-xl border-2 overflow-hidden transition-colors ${done ? 'border-[#7C3AED]/30' : 'border-gray-100'}`}>
                        <div className={`flex items-center gap-3 px-4 py-2.5 ${done ? 'bg-violet-50' : 'bg-gray-50'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${done ? 'bg-[#7C3AED] text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {done ? (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                                <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${done ? 'text-[#7C3AED]' : 'text-gray-700'}`}>{fmtDayFull(date)}</p>
                            {done && (
                              <p className="text-xs text-violet-500 font-medium mt-0.5">
                                {fmt12(entry.start_time)}{entry.end_time ? ` – ${fmt12(entry.end_time)}` : ''}
                              </p>
                            )}
                          </div>
                          {!done && (
                            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Needs time
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 p-4">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                              Start Time <span className="text-red-500">*</span>
                            </label>
                            <input type="time" value={entry.start_time}
                              onChange={e => setScheduleMap(prev => ({ ...prev, [date]: { ...prev[date], start_time: e.target.value } }))}
                              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-[#7C3AED] bg-white ${!entry.start_time ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200'}`}
                            />
                            {entry.start_time && <p className="text-xs font-semibold text-[#7C3AED] mt-1">{fmt12(entry.start_time)}</p>}
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                              End Time <span className="text-gray-400 font-normal normal-case tracking-normal">(opt.)</span>
                            </label>
                            <input type="time" value={entry.end_time}
                              onChange={e => setScheduleMap(prev => ({ ...prev, [date]: { ...prev[date], end_time: e.target.value } }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED] bg-white"
                            />
                            {entry.end_time && <p className="text-xs text-gray-500 mt-1">{fmt12(entry.end_time)}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {!tooLong && dateRange.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-400">Select start and end dates to set up the daily schedule.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Location</p>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.is_online} onChange={e => set('is_online', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#7C3AED]" />
              Online event
            </label>
          </div>
          {form.is_online ? (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Platform</label>
                <select value={form.online_platform} onChange={e => set('online_platform', e.target.value)} className={inputCls}>
                  <option value="">Select platform</option>
                  {['Zoom','Google Meet','YouTube Live','Facebook Live','Instagram Live','Other'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Meeting Link</label>
                <input value={form.online_link} onChange={e => set('online_link', e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Venue Name</label>
                <input value={form.location_name} onChange={e => set('location_name', e.target.value)} placeholder="e.g. National Stadium Surulere" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lagos" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <select value={form.state} onChange={e => set('state', e.target.value)} className={inputCls}>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timezone */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-2">
          <label className={labelCls}>Timezone</label>
          <TimezoneSelector value={form.timezone} onChange={(tz: string) => set('timezone', tz)} inputCls={inputCls} />
          <p className="text-xs text-gray-400">Select the timezone where this event takes place.</p>
        </div>

        {/* Livestream URL */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-2">
          <label className={labelCls}>Livestream URL <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
          <input value={form.livestream_url} onChange={e => set('livestream_url', e.target.value)} placeholder="e.g. https://youtube.com/live/..." className={inputCls} />
          <p className="text-xs text-gray-400">Add a livestream link even if this is a physical event.</p>
        </div>

        {/* Registration */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Registration &amp; Entry</p>
          <div className="space-y-2">
            {([
              ['free_no_registration', 'Free – No registration needed'],
              ['free_registration',    'Free – Registration required'],
              ['paid',                 'Paid event'],
            ] as const).map(([val, lbl]) => (
              <label key={val} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="regType" value={val} checked={form.registration_type === val} onChange={() => set('registration_type', val)} className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-sm text-gray-700">{lbl}</span>
              </label>
            ))}
          </div>
          {form.registration_type === 'paid' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Price (₦)</label>
                <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="5000" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Payment Link</label>
                <input value={form.payment_link} onChange={e => set('payment_link', e.target.value)} placeholder="https://paystack.com/..." className={inputCls} />
              </div>
            </div>
          )}
          <div>
            <label className={labelCls}>Capacity (leave blank for unlimited)</label>
            <input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="e.g. 500" className={inputCls} />
          </div>
        </div>

        {/* Additional info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Additional Info</p>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.parking_available} onChange={e => set('parking_available', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#7C3AED]" />
              <span className="text-sm text-gray-700">Parking available</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.child_friendly} onChange={e => set('child_friendly', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#7C3AED]" />
              <span className="text-sm text-gray-700">Child-friendly</span>
            </label>
          </div>
          <div>
            <label className={labelCls}>Notes (internal)</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Any additional notes..." className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Source URL</label>
            <input value={form.source_url} onChange={e => set('source_url', e.target.value)} placeholder="e.g. instagram post, flyer link" className={inputCls} />
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Visibility</p>
          <div className="flex gap-4">
            {(['public', 'draft'] as const).map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="visibility" value={v} checked={form.visibility === v} onChange={() => set('visibility', v)} className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-sm text-gray-700 capitalize">{v}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Error + Save */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}
        {saved && (
          <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium">
            ✓ Event updated successfully
          </div>
        )}
        <div className="flex items-center gap-3 pb-6">
          <button type="submit" disabled={isPending}
            className="flex-1 h-11 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="h-11 px-5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
