'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'
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

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const ORDINALS = ['First', 'Second', 'Third', 'Fourth']

function RecurringSection({ formData, updateForm }: { formData: any; updateForm: (f: string, v: any) => void }) {
  const rule = formData.recurrence_rule ?? null
  const isRecurring = !!rule

  function toggle(on: boolean) {
    if (on) {
      const baseDay = formData.start_date
        ? new Date(formData.start_date + 'T12:00:00').getDay()
        : 0
      updateForm('recurrence_rule', {
        frequency: 'weekly',
        interval: 1,
        day_of_week: baseDay,
        occurrences: 10,
      })
    } else {
      updateForm('recurrence_rule', null)
    }
  }

  function patch(updates: Record<string, unknown>) {
    updateForm('recurrence_rule', { ...rule, ...updates })
  }

  return (
    <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={e => toggle(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm font-semibold text-gray-900">This is a recurring event</span>
      </label>

      {isRecurring && rule && (
        <div className="space-y-4 pt-1">
          {/* Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Repeats</label>
              <select
                value={rule.frequency}
                onChange={e => patch({ frequency: e.target.value })}
                className={inp}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Every</label>
              <div className="flex items-center gap-2">
                <select
                  value={rule.interval ?? 1}
                  onChange={e => patch({ interval: Number(e.target.value) })}
                  className={inp}
                >
                  {[1, 2, 3, 4, 6, 8].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {rule.frequency === 'weekly' ? 'week(s)' : 'month(s)'}
                </span>
              </div>
            </div>
          </div>

          {/* Day selection */}
          {rule.frequency === 'weekly' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">On</label>
              <select
                value={rule.day_of_week ?? 0}
                onChange={e => patch({ day_of_week: Number(e.target.value) })}
                className={inp}
              >
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">On the</label>
                <select
                  value={rule.week_of_month ?? 1}
                  onChange={e => patch({ week_of_month: Number(e.target.value) })}
                  className={inp}
                >
                  {ORDINALS.map((o, i) => <option key={i} value={i + 1}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Day</label>
                <select
                  value={rule.day_of_week ?? 0}
                  onChange={e => patch({ day_of_week: Number(e.target.value) })}
                  className={inp}
                >
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* End condition */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">End after</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recur_end"
                  checked={!rule.end_date}
                  onChange={() => patch({ end_date: undefined, occurrences: rule.occurrences ?? 10 })}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm text-gray-700">Occurrences</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recur_end"
                  checked={!!rule.end_date}
                  onChange={() => patch({ end_date: '', occurrences: undefined })}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm text-gray-700">End date</span>
              </label>
            </div>
            {!rule.end_date ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min={2}
                  max={52}
                  value={rule.occurrences ?? 10}
                  onChange={e => patch({ occurrences: Number(e.target.value) })}
                  className={`${inp} w-24`}
                />
                <span className="text-sm text-gray-500">occurrences (max 52)</span>
              </div>
            ) : (
              <input
                type="date"
                value={rule.end_date ?? ''}
                onChange={e => patch({ end_date: e.target.value })}
                className={`${inp} mt-2`}
              />
            )}
          </div>

          <p className="text-xs text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
            Each occurrence will be created as a separate event linked to this series. Attendees can see all dates and subscribe to the whole series.
          </p>
        </div>
      )}
    </div>
  )
}

export default function Step2DateTime({ formData, updateForm, errors }: StepProps) {
  const today = new Date().toISOString().split('T')[0]
  const eventType: 'single' | 'multi' = formData.event_type || 'single'
  const schedule: DaySchedule[] = formData.daily_schedule || []
  const dateRange = eventType === 'multi' ? getDateRange(formData.start_date, formData.end_date) : []
  const tooLong = dateRange.length > 14
  const [sameSchedule, setSameSchedule] = useState(false)

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

  function copyToAll(sourceDate: string) {
    const source = schedule.find(d => d.date === sourceDate)
    if (!source) return
    const sourceSessions = getSessions(source)
    updateForm('daily_schedule', schedule.map(d => ({
      ...d,
      sessions: sourceSessions.map(s => ({ ...s })),
    })))
  }

  function handleSameScheduleToggle(on: boolean) {
    setSameSchedule(on)
    if (on && schedule.length > 1) {
      const sourceSessions = getSessions(schedule[0])
      updateForm('daily_schedule', schedule.map(d => ({
        ...d,
        sessions: sourceSessions.map(s => ({ ...s })),
      })))
    }
  }

  function updateSharedSession(idx: number, field: keyof EventSession, value: string) {
    const updated = schedule.map(d => {
      const sessions = getSessions(d).map((s, i) =>
        i === idx ? { ...s, [field]: value || null } : s
      )
      return { ...d, sessions }
    })
    updateForm('daily_schedule', updated)
  }

  function addSharedSession() {
    const updated = schedule.map(d => ({
      ...d,
      sessions: [...getSessions(d), emptySession()],
    }))
    updateForm('daily_schedule', updated)
  }

  function removeSharedSession(idx: number) {
    const updated = schedule.map(d => {
      const sessions = getSessions(d).filter((_, i) => i !== idx)
      return { ...d, sessions: sessions.length ? sessions : [emptySession()] }
    })
    updateForm('daily_schedule', updated)
  }

  const sharedSessions = schedule.length > 0 ? getSessions(schedule[0]) : [emptySession()]

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

          {/* Per-day schedule */}
          {!tooLong && schedule.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-900">What happens each day?</label>

                {/* Same schedule toggle — only show for 2+ days */}
                {schedule.length > 1 && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => handleSameScheduleToggle(!sameSchedule)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${sameSchedule ? 'bg-gray-900' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${sameSchedule ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-600">Same schedule every day</span>
                  </label>
                )}
              </div>

              {/* SAME SCHEDULE MODE — one shared template */}
              {sameSchedule ? (
                <div className="border border-gray-900 rounded-xl overflow-hidden">
                  <div className="bg-gray-900 px-4 py-2.5">
                    <p className="text-sm font-semibold text-white">Schedule for all {schedule.length} days</p>
                    <p className="text-xs text-gray-400 mt-0.5">This will apply to every day of your event</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {sharedSessions.map((session, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={session.title ?? ''}
                          onChange={e => updateSharedSession(sIdx, 'title', e.target.value)}
                          placeholder={sIdx === 0 ? 'e.g. Morning Service' : 'e.g. Evening Session'}
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 bg-white transition-colors"
                        />
                        <input
                          type="time"
                          value={session.start_time ?? ''}
                          onChange={e => updateSharedSession(sIdx, 'start_time', e.target.value)}
                          className="w-28 px-3 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gray-900 bg-white transition-colors"
                        />
                        <input
                          type="time"
                          value={session.end_time ?? ''}
                          onChange={e => updateSharedSession(sIdx, 'end_time', e.target.value)}
                          className="w-28 px-3 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gray-900 bg-white transition-colors"
                        />
                        {sharedSessions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSharedSession(sIdx)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 text-lg"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSharedSession}
                      className="text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors"
                    >
                      + Add program
                    </button>
                  </div>
                </div>
              ) : (
                /* INDIVIDUAL DAY MODE */
                schedule.map((day, idx) => {
                  const sessions = getSessions(day)
                  return (
                    <div key={day.date} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">Day {idx + 1} — {fmtDayFull(day.date)}</p>
                        {schedule.length > 1 && (
                          <button
                            type="button"
                            onClick={() => copyToAll(day.date)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
                            title="Copy this day's schedule to all other days"
                          >
                            <Copy className="w-3 h-3" />
                            Copy to all days
                          </button>
                        )}
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
                            <input
                              type="time"
                              value={session.end_time ?? ''}
                              onChange={e => updateSession(day.date, sIdx, 'end_time', e.target.value)}
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
                })
              )}
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

      {/* Recurring event toggle — only for single-day events */}
      {eventType === 'single' && (
        <RecurringSection formData={formData} updateForm={updateForm} />
      )}

    </div>
  )
}
