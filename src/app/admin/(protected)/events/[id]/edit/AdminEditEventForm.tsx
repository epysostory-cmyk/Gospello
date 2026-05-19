'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Upload, Loader2, Copy } from 'lucide-react'
import { NIGERIAN_STATES, COUNTRY_LIST } from '@/lib/utils'
import type { CategoryRow } from '@/app/actions/categories'
import type { DaySchedule } from '@/types/database'
import { updateAdminEvent } from '../../new/actions'
import TimezoneSelector from '@/components/ui/TimezoneSelector'
import SpeakerTagInput from '@/components/ui/SpeakerTagInput'

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
  const [sameEditSchedule, setSameEditSchedule] = useState(false)
  const [scheduleMap, setScheduleMap] = useState<Record<string, { label: string; sessions: import('@/types/database').EventSession[] }>>(() => {
    if (isMultiDay) {
      return Object.fromEntries(
        (event.daily_schedule as DaySchedule[]).map(d => [
          d.date,
          {
            label: d.label ?? '',
            sessions: d.sessions?.length ? d.sessions : (
              d.start_time ? [{ title: null, start_time: d.start_time, end_time: d.end_time ?? null, speaker: null }]
              : [{ title: null, start_time: null, end_time: null, speaker: null }]
            ),
          }
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
    country:       event.country ?? 'Nigeria',
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
    shuttle_available:      (event as any).shuttle_available ?? false,
    wheelchair_accessible:  (event as any).wheelchair_accessible ?? false,
    food_provided:          (event as any).food_provided ?? false,
    accommodation_available:(event as any).accommodation_available ?? false,
    dress_code:             (event as any).dress_code ?? '',
    no_recording:           (event as any).no_recording ?? false,
    gender_restriction:     (event as any).gender_restriction ?? '',
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
      const next: Record<string, { label: string; sessions: import('@/types/database').EventSession[] }> = {}
      for (const d of dates) next[d] = prev[d] ?? { label: '', sessions: [{ title: null, start_time: null, end_time: null, speaker: null }] }
      return next
    })
  }, [form.start_date, form.end_date, eventType])

  const dateRange = useMemo(
    () => eventType === 'multi' ? getDateRange(form.start_date, form.end_date) : [],
    [form.start_date, form.end_date, eventType]
  )
  const tooLong = dateRange.length > 14
  const completedDays = dateRange.filter(d => scheduleMap[d]?.sessions?.some(s => s.title || s.start_time)).length

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

    function tzOffset(tz: string, dateStr: string): string {
      try {
        const parts = new Intl.DateTimeFormat('en', {
          timeZone: tz, timeZoneName: 'shortOffset',
        }).formatToParts(new Date(dateStr + 'T12:00:00'))
        const gmt = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT'
        const match = gmt.match(/GMT([+-]\d{1,2}):?(\d{2})?/)
        if (!match) return 'Z'
        const sign = match[1].startsWith('-') ? '-' : '+'
        const hrs  = Math.abs(parseInt(match[1])).toString().padStart(2, '0')
        const mins = (match[2] ?? '00').padStart(2, '0')
        return `${sign}${hrs}:${mins}`
      } catch { return 'Z' }
    }

    const tz = form.timezone || 'Africa/Lagos'

    let startDatetime: string
    let endDatetime: string | null
    let daily_schedule: DaySchedule[] | null = null

    if (eventType === 'multi') {
      if (!form.start_date) { setError('Start date is required'); return }
      if (!form.end_date)   { setError('End date is required'); return }
      if (tooLong)          { setError('Event duration cannot exceed 14 days'); return }
      if (dateRange.length === 0) { setError('End date must be after start date'); return }
      daily_schedule = dateRange.map(d => ({
        date: d,
        label: scheduleMap[d]?.label || null,
        sessions: scheduleMap[d]?.sessions ?? [],
      }))
      const offset = tzOffset(tz, dateRange[0])
      const firstTime = scheduleMap[dateRange[0]]?.sessions?.find(s => s.start_time)?.start_time ?? '00:00'
      startDatetime = `${dateRange[0]}T${firstTime}:00${offset}`
      const lastD = dateRange[dateRange.length - 1]
      const lastEndTime = scheduleMap[lastD]?.sessions?.slice().reverse().find(s => s.end_time)?.end_time
      const lastStartTime = scheduleMap[lastD]?.sessions?.find(s => s.start_time)?.start_time
      const lastTime = lastEndTime ?? (lastStartTime
        ? `${String(parseInt(lastStartTime.split(':')[0]) + 5).padStart(2, '0')}:${lastStartTime.split(':')[1]}`
        : '13:00')
      endDatetime = `${lastD}T${lastTime}:00${offset}`
    } else {
      if (!form.start_date) { setError('Start date is required'); return }
      if (!form.start_time) { setError('Start time is required'); return }
      const offset = tzOffset(tz, form.start_date)
      startDatetime = `${form.start_date}T${form.start_time}:00${offset}`
      endDatetime   = form.end_time ? `${form.start_date}T${form.end_time}:00${offset}` : null
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
            <SpeakerTagInput
              value={form.speakers}
              onChange={v => set('speakers', v)}
              placeholder="e.g. Pastor John Doe"
            />
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
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{completedDays}/{dateRange.length} days set</span>
                      {dateRange.length > 1 && (
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <div
                            onClick={() => {
                              const on = !sameEditSchedule
                              setSameEditSchedule(on)
                              if (on && dateRange.length > 1) {
                                const first = scheduleMap[dateRange[0]] ?? { label: '', sessions: [{ title: null, start_time: null, end_time: null, speaker: null }] }
                                const srcSessions = first.sessions?.length ? first.sessions : [{ title: null, start_time: null, end_time: null, speaker: null }]
                                setScheduleMap(prev => {
                                  const next = { ...prev }
                                  for (const d of dateRange) next[d] = { ...prev[d] ?? { label: '' }, sessions: srcSessions.map((s: import('@/types/database').EventSession) => ({ ...s })) }
                                  return next
                                })
                              }
                            }}
                            className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${sameEditSchedule ? 'bg-[#7C3AED]' : 'bg-gray-200'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${sameEditSchedule ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                          <span className="text-[11px] font-medium text-gray-500">Same every day</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* SAME SCHEDULE MODE */}
                  {sameEditSchedule && dateRange.length > 0 && (() => {
                    const sharedEntry = scheduleMap[dateRange[0]] ?? { label: '', sessions: [{ title: null, start_time: null, end_time: null, speaker: null }] }
                    const sharedSessions: import('@/types/database').EventSession[] = sharedEntry.sessions?.length ? sharedEntry.sessions : [{ title: null, start_time: null, end_time: null, speaker: null }]
                    const updateShared = (sIdx: number, field: string, value: string) => {
                      setScheduleMap(prev => {
                        const next = { ...prev }
                        for (const d of dateRange) {
                          const cur = next[d] ?? { label: '', sessions: [] }
                          next[d] = { ...cur, sessions: cur.sessions.map((s: import('@/types/database').EventSession, i: number) => i === sIdx ? { ...s, [field]: value || null } : s) }
                        }
                        return next
                      })
                    }
                    const addShared = () => setScheduleMap(prev => {
                      const next = { ...prev }
                      for (const d of dateRange) { const cur = next[d] ?? { label: '', sessions: [] }; next[d] = { ...cur, sessions: [...cur.sessions, { title: null, start_time: null, end_time: null, speaker: null }] } }
                      return next
                    })
                    const removeShared = (sIdx: number) => setScheduleMap(prev => {
                      const next = { ...prev }
                      for (const d of dateRange) { const cur = next[d] ?? { label: '', sessions: [] }; const updated = cur.sessions.filter((_: import('@/types/database').EventSession, i: number) => i !== sIdx); next[d] = { ...cur, sessions: updated.length ? updated : [{ title: null, start_time: null, end_time: null, speaker: null }] } }
                      return next
                    })
                    return (
                      <div className="rounded-xl border-2 border-[#7C3AED]/40 overflow-hidden">
                        <div className="bg-violet-50 px-4 py-2.5">
                          <p className="text-sm font-bold text-[#7C3AED]">Schedule for all {dateRange.length} days</p>
                          <p className="text-xs text-violet-400 mt-0.5">Applies to every day automatically</p>
                        </div>
                        <div className="p-4 space-y-3">
                          {sharedSessions.map((session: import('@/types/database').EventSession, sIdx: number) => (
                            <div key={sIdx} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50/50">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Session {sIdx + 1}</span>
                                {sharedSessions.length > 1 && <button type="button" onClick={() => removeShared(sIdx)} className="text-xs text-red-400 hover:text-red-600">Remove</button>}
                              </div>
                              <input type="text" value={session.title ?? ''} onChange={e => updateShared(sIdx, 'title', e.target.value)} placeholder="Session name" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] bg-white" />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-medium text-gray-400 mb-1">Start Time (optional)</label>
                                  <input type="time" value={session.start_time ?? ''} onChange={e => updateShared(sIdx, 'start_time', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED] bg-white" />
                                  {session.start_time && <p className="text-xs text-[#7C3AED] mt-0.5">{fmt12(session.start_time)}</p>}
                                </div>
                                <div>
                                  <label className="block text-[10px] font-medium text-gray-400 mb-1">End Time (optional)</label>
                                  <input type="time" value={session.end_time ?? ''} onChange={e => updateShared(sIdx, 'end_time', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED] bg-white" />
                                  {session.end_time && <p className="text-xs text-gray-500 mt-0.5">{fmt12(session.end_time)}</p>}
                                </div>
                              </div>
                              <input type="text" value={session.speaker ?? ''} onChange={e => updateShared(sIdx, 'speaker', e.target.value)} placeholder="Speaker / Minister (optional)" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] bg-white" />
                            </div>
                          ))}
                          <button type="button" onClick={addShared} className="w-full py-2 rounded-lg border border-dashed border-[#7C3AED]/40 text-sm font-semibold text-[#7C3AED] hover:bg-violet-50 transition-colors">+ Add Session</button>
                        </div>
                      </div>
                    )
                  })()}

                  {/* INDIVIDUAL DAY MODE */}
                  {!sameEditSchedule && dateRange.map((date, idx) => {
                    const entry = scheduleMap[date] ?? { label: '', sessions: [{ title: null, start_time: null, end_time: null, speaker: null }] }
                    const sessions = entry.sessions?.length ? entry.sessions : [{ title: null, start_time: null, end_time: null, speaker: null }]
                    const hasContent = sessions.some((s: import('@/types/database').EventSession) => s.title || s.start_time)

                    const updateSess = (sIdx: number, field: string, value: string) => {
                      setScheduleMap(prev => {
                        const cur = prev[date] ?? { label: '', sessions: [] }
                        return { ...prev, [date]: { ...cur, sessions: cur.sessions.map((s: import('@/types/database').EventSession, i: number) => i === sIdx ? { ...s, [field]: value || null } : s) } }
                      })
                    }
                    const addSess = () => setScheduleMap(prev => {
                      const cur = prev[date] ?? { label: '', sessions: [] }
                      return { ...prev, [date]: { ...cur, sessions: [...cur.sessions, { title: null, start_time: null, end_time: null, speaker: null }] } }
                    })
                    const removeSess = (sIdx: number) => setScheduleMap(prev => {
                      const cur = prev[date] ?? { label: '', sessions: [] }
                      const updated = cur.sessions.filter((_: import('@/types/database').EventSession, i: number) => i !== sIdx)
                      return { ...prev, [date]: { ...cur, sessions: updated.length ? updated : [{ title: null, start_time: null, end_time: null, speaker: null }] } }
                    })

                    return (
                      <div key={date} className={`rounded-xl border-2 overflow-hidden transition-colors ${hasContent ? 'border-[#7C3AED]/30' : 'border-gray-100'}`}>
                        <div className={`flex items-center gap-3 px-4 py-2.5 ${hasContent ? 'bg-violet-50' : 'bg-gray-50'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${hasContent ? 'bg-[#7C3AED] text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {hasContent ? (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                                <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${hasContent ? 'text-[#7C3AED]' : 'text-gray-700'}`}>{fmtDayFull(date)}</p>
                            {entry.label && <p className="text-xs text-violet-500 font-medium mt-0.5 truncate">{entry.label}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-400">{sessions.filter((s: import('@/types/database').EventSession) => s.title || s.start_time).length} session{sessions.filter((s: import('@/types/database').EventSession) => s.title || s.start_time).length !== 1 ? 's' : ''}</span>
                            {dateRange.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const src = scheduleMap[date] ?? { label: '', sessions }
                                  setScheduleMap(prev => {
                                    const next = { ...prev }
                                    for (const d of dateRange) next[d] = { ...next[d] ?? { label: '' }, sessions: src.sessions.map((s: import('@/types/database').EventSession) => ({ ...s })) }
                                    return next
                                  })
                                }}
                                className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-[#7C3AED] transition-colors px-1.5 py-0.5 rounded hover:bg-violet-50"
                                title="Copy this day's schedule to all other days"
                              >
                                <Copy className="w-3 h-3" /> Copy to all
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <input
                            type="text"
                            value={entry.label ?? ''}
                            onChange={e => setScheduleMap(prev => ({ ...prev, [date]: { ...prev[date], label: e.target.value } }))}
                            placeholder="Day theme (optional)"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] bg-white"
                          />
                          {sessions.map((session: import('@/types/database').EventSession, sIdx: number) => (
                            <div key={sIdx} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50/50">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Session {sIdx + 1}</span>
                                {sessions.length > 1 && <button type="button" onClick={() => removeSess(sIdx)} className="text-xs text-red-400 hover:text-red-600">Remove</button>}
                              </div>
                              <input type="text" value={session.title ?? ''} onChange={e => updateSess(sIdx, 'title', e.target.value)} placeholder="Session name" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] bg-white" />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-medium text-gray-400 mb-1">Start Time (optional)</label>
                                  <input type="time" value={session.start_time ?? ''} onChange={e => updateSess(sIdx, 'start_time', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED] bg-white" />
                                  {session.start_time && <p className="text-xs text-[#7C3AED] mt-0.5">{fmt12(session.start_time)}</p>}
                                </div>
                                <div>
                                  <label className="block text-[10px] font-medium text-gray-400 mb-1">End Time (optional)</label>
                                  <input type="time" value={session.end_time ?? ''} onChange={e => updateSess(sIdx, 'end_time', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED] bg-white" />
                                  {session.end_time && <p className="text-xs text-gray-500 mt-0.5">{fmt12(session.end_time)}</p>}
                                </div>
                              </div>
                              <input type="text" value={session.speaker ?? ''} onChange={e => updateSess(sIdx, 'speaker', e.target.value)} placeholder="Speaker / Minister (optional)" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] bg-white" />
                            </div>
                          ))}
                          <button type="button" onClick={addSess} className="w-full py-2 rounded-lg border border-dashed border-[#7C3AED]/40 text-sm font-semibold text-[#7C3AED] hover:bg-violet-50 transition-colors">+ Add Session</button>
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
                <label className={labelCls}>Country</label>
                <select value={form.country} onChange={e => { set('country', e.target.value); set('state', '') }} className={inputCls}>
                  {COUNTRY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
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
                  <input value={form.city} onChange={e => set('city', e.target.value)} placeholder={form.country === 'Nigeria' ? 'Lagos' : 'e.g. London'} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{form.country === 'Nigeria' ? 'State' : 'State / Province'}</label>
                  {form.country === 'Nigeria' ? (
                    <select value={form.state} onChange={e => set('state', e.target.value)} className={inputCls}>
                      <option value="">Select state</option>
                      {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="e.g. England" className={inputCls} />
                  )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {([
              ['parking_available',      'Parking available',              false],
              ['shuttle_available',       'Bus / shuttle available',        false],
              ['child_friendly',          'Child-friendly',                 true],
              ['wheelchair_accessible',   'Wheelchair accessible',          false],
              ['food_provided',           'Food / refreshments provided',   false],
              ['accommodation_available', 'Accommodation available',        false],
              ['no_recording',            'No recording allowed',           true],
            ] as [string, string, boolean][])
              .filter(([,, onlineOk]) => !(form as any).is_online || onlineOk)
              .map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={!!(form as any)[key]} onChange={e => set(key, e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#7C3AED]" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          {!(form as any).is_online && (
          <div>
            <label className="flex items-center gap-3 cursor-pointer mb-2">
              <input type="checkbox" checked={!!(form as any).dress_code} onChange={e => set('dress_code', e.target.checked ? 'Smart casual' : '')} className="w-4 h-4 rounded border-gray-300 text-[#7C3AED]" />
              <span className="text-sm text-gray-700">Dress code required</span>
            </label>
            {!!(form as any).dress_code && (
              <input type="text" value={(form as any).dress_code} onChange={e => set('dress_code', e.target.value)} placeholder="e.g. Smart casual, All-white, Native attire" className={inputCls} />
            )}
          </div>
          )}
          <div>
            <label className={labelCls}>Audience restriction</label>
            <select value={(form as any).gender_restriction || ''} onChange={e => set('gender_restriction', e.target.value)} className={inputCls}>
              <option value="">Open to everyone</option>
              <option value="women_only">Women only</option>
              <option value="men_only">Men only</option>
            </select>
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
