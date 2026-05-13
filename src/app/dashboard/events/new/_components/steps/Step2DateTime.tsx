'use client'

import type { DaySchedule, EventSession } from '@/types/database'
import TimezoneSelector from '@/components/ui/TimezoneSelector'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

function fmt12(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function fmtDayFull(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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

function emptySession(): EventSession {
  return { title: null, start_time: null, end_time: null, speaker: null }
}

function rebuildSchedule(start: string, end: string, existing: DaySchedule[]): DaySchedule[] {
  const map = Object.fromEntries(existing.map(d => [d.date, d]))
  return getDateRange(start, end).map(date => {
    if (map[date]) return map[date]
    return { date, label: null, sessions: [emptySession()] }
  })
}

const inp = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 bg-white transition-colors'

export default function Step2DateTime({ formData, updateForm, errors }: StepProps) {
  const today = new Date().toISOString().split('T')[0]
  const eventType: 'single' | 'multi' = formData.event_type || 'single'
  const schedule: DaySchedule[] = formData.daily_schedule || []
  const dateRange = eventType === 'multi' ? getDateRange(formData.start_date, formData.end_date) : []
  const tooLong = dateRange.length > 14

  function handleToggle(type: 'single' | 'multi') {
    updateForm('event_type', type)
    if (type === 'single') {
      updateForm('end_date', '')
      updateForm('daily_schedule', null)
    } else {
      updateForm('start_time', '')
      updateForm('end_time', '')
      if (formData.start_date && formData.end_date) {
        updateForm('daily_schedule', rebuildSchedule(formData.start_date, formData.end_date, schedule))
      } else {
        updateForm('daily_schedule', [])
      }
    }
  }

  function handleMultiDateChange(field: 'start_date' | 'end_date', value: string) {
    updateForm(field, value)
    const newStart = field === 'start_date' ? value : formData.start_date
    const newEnd   = field === 'end_date'   ? value : formData.end_date
    if (newStart && newEnd) {
      updateForm('daily_schedule', rebuildSchedule(newStart, newEnd, schedule))
    }
  }

  function updateDayLabel(date: string, label: string) {
    updateForm('daily_schedule', schedule.map(d =>
      d.date === date ? { ...d, label: label || null } : d
    ))
  }

  function getSessions(d: DaySchedule): EventSession[] {
    if (d.sessions?.length) return d.sessions
    if (d.start_time) return [{ title: null, start_time: d.start_time, end_time: d.end_time ?? null, speaker: null }]
    return [emptySession()]
  }

  function updateSession(date: string, idx: number, field: keyof EventSession, value: string) {
    updateForm('daily_schedule', schedule.map(d => {
      if (d.date !== date) return d
      const sessions = getSessions(d).map((s, i) =>
        i === idx ? { ...s, [field]: value || null } : s
      )
      return { ...d, sessions }
    }))
  }

  function addSession(date: string) {
    updateForm('daily_schedule', schedule.map(d =>
      d.date === date ? { ...d, sessions: [...getSessions(d), emptySession()] } : d
    ))
  }

  function removeSession(date: string, idx: number) {
    updateForm('daily_schedule', schedule.map(d => {
      if (d.date !== date) return d
      const sessions = getSessions(d).filter((_, i) => i !== idx)
      return { ...d, sessions: sessions.length ? sessions : [emptySession()] }
    }))
  }

  return (
    <div className="space-y-6">

      {/* Event type toggle */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">How long is this event?</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => handleToggle('single')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors ${
              eventType === 'single' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}>
            Single Day
          </button>
          <button type="button" onClick={() => handleToggle('multi')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors ${
              eventType === 'multi' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}>
            Multiple Days
          </button>
        </div>
      </div>

      {/* Single day */}
      {eventType === 'single' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={e => updateForm('start_date', e.target.value)}
              min={today}
              className={`${inp} ${errors.start_date ? 'border-red-400' : ''}`}
            />
            {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Start time <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={e => updateForm('start_time', e.target.value)}
                className={inp}
              />
              {formData.start_time && (
                <p className="text-xs text-gray-500 mt-1">{fmt12(formData.start_time)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                End time <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={e => updateForm('end_time', e.target.value)}
                className={inp}
              />
              {formData.end_time && (
                <p className="text-xs text-gray-500 mt-1">{fmt12(formData.end_time)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-day */}
      {eventType === 'multi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Start date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={e => handleMultiDateChange('start_date', e.target.value)}
                min={today}
                className={`${inp} ${errors.start_date ? 'border-red-400' : ''}`}
              />
              {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                End date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={e => handleMultiDateChange('end_date', e.target.value)}
                min={formData.start_date || today}
                className={`${inp} ${errors.end_date ? 'border-red-400' : ''}`}
              />
              {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>}
            </div>
          </div>

          {dateRange.length > 0 && !tooLong && (
            <p className="text-xs text-gray-500">{dateRange.length} day{dateRange.length > 1 ? 's' : ''}</p>
          )}

          {tooLong && (
            <p className="text-sm text-red-600">Event cannot exceed 14 days. Please shorten the date range.</p>
          )}

          {errors.daily_schedule && (
            <p className="text-sm text-red-600">{errors.daily_schedule}</p>
          )}

          {/* Per-day cards */}
          {!tooLong && schedule.length > 0 && (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-900">What happens each day?</label>
              {schedule.map((day, idx) => {
                const sessions = getSessions(day)
                return (
                  <div key={day.date} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">Day {idx + 1} — {fmtDayFull(day.date)}</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <input
                        type="text"
                        value={day.label ?? ''}
                        onChange={e => updateDayLabel(day.date, e.target.value)}
                        placeholder="Day theme — e.g. Workers Retreat (optional)"
                        className={inp}
                      />

                      {sessions.map((session, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={session.title ?? ''}
                            onChange={e => updateSession(day.date, sIdx, 'title', e.target.value)}
                            placeholder={sIdx === 0 ? 'e.g. Morning Service' : 'e.g. Evening Session'}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 bg-white transition-colors"
                          />
                          <input
                            type="time"
                            value={session.start_time ?? ''}
                            onChange={e => updateSession(day.date, sIdx, 'start_time', e.target.value)}
                            className="w-28 px-3 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gray-900 bg-white transition-colors"
                          />
                          {sessions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSession(day.date, sIdx)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 text-lg"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addSession(day.date)}
                        className="text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors"
                      >
                        + Add program
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!tooLong && schedule.length === 0 && formData.start_date && formData.end_date && (
            <p className="text-sm text-gray-400 text-center py-4">Pick valid dates above to set up your schedule.</p>
          )}
        </div>
      )}

      {/* Timezone */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Timezone</label>
        <TimezoneSelector
          value={formData.timezone || 'Africa/Lagos'}
          onChange={(tz: string) => updateForm('timezone', tz)}
        />
      </div>

    </div>
  )
}
