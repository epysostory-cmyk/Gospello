'use client'

import type { DaySchedule } from '@/types/database'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

/* "HH:MM" → "9:00 AM" */
function fmt12(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

/* "2026-05-04" → "Monday, 4 May 2026" */
function fmtDayFull(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Africa/Lagos',
  })
}

/* "2026-05-04" → "Mon, 4 May" */
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

function rebuildSchedule(start: string, end: string, existing: DaySchedule[]): DaySchedule[] {
  const map = Object.fromEntries(existing.map(d => [d.date, d]))
  return getDateRange(start, end).map(date => map[date] ?? { date, start_time: '', end_time: null })
}

export default function Step2DateTime({ formData, updateForm, errors }: StepProps) {
  const today = new Date().toISOString().split('T')[0]
  const eventType: 'single' | 'multi' = formData.event_type || 'single'
  const schedule: DaySchedule[] = formData.daily_schedule || []
  const dateRange = eventType === 'multi' ? getDateRange(formData.start_date, formData.end_date) : []
  const tooLong = dateRange.length > 14
  const completedDays = schedule.filter(d => d.start_time).length

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

  function updateDayTime(date: string, field: 'start_time' | 'end_time', value: string) {
    const next = schedule.map(d =>
      d.date === date ? { ...d, [field]: field === 'end_time' ? (value || null) : value } : d
    )
    updateForm('daily_schedule', next)
  }

  return (
    <div className="space-y-5">

      {/* ── Header card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Date &amp; Time</h3>
        <p className="text-sm text-gray-500">Tell attendees when your event takes place.</p>
      </div>

      {/* ── Event type toggle ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Event Duration</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['single', '📅', 'Single Day',      'Happens on one date'],
            ['multi',  '📆', 'Multiple Days',   'Spans several days'],
          ] as const).map(([type, icon, label, desc]) => {
            const active = eventType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleToggle(type)}
                className={`relative flex flex-col items-start gap-1 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                  active
                    ? 'border-[#7C3AED] bg-violet-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#7C3AED] flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                      <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
                <span className="text-2xl">{icon}</span>
                <span className={`text-sm font-bold ${active ? 'text-[#7C3AED]' : 'text-gray-800'}`}>{label}</span>
                <span className="text-xs text-gray-500 leading-snug">{desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ══════════════ SINGLE DAY ══════════════ */}
      {eventType === 'single' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date &amp; Time</p>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={e => updateForm('start_date', e.target.value)}
              min={today}
              className={`w-full px-4 py-3 rounded-xl border-[1.5px] text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE] bg-white transition-all ${
                errors.start_date ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
          </div>

          {/* Start & End time side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={e => updateForm('start_time', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-[1.5px] text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE] bg-white transition-all ${
                  errors.start_time ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time}</p>}
              {formData.start_time && (
                <p className="text-xs text-[#7C3AED] font-semibold mt-1">{fmt12(formData.start_time)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                End Time <span className="text-gray-400 text-xs font-normal">(optional)</span>
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={e => updateForm('end_time', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE] bg-white transition-all"
              />
              {formData.end_time && (
                <p className="text-xs text-gray-500 mt-1">{fmt12(formData.end_time)}</p>
              )}
            </div>
          </div>

          {/* Preview pill */}
          {formData.start_date && formData.start_time && (
            <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
              <span className="text-violet-500 text-base">📅</span>
              <p className="text-sm font-medium text-violet-800">
                {fmtDayShort(formData.start_date)}
                {' · '}
                {fmt12(formData.start_time)}
                {formData.end_time ? ` – ${fmt12(formData.end_time)}` : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ MULTI-DAY ══════════════ */}
      {eventType === 'multi' && (
        <>
          {/* Date range */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date Range</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={e => handleMultiDateChange('start_date', e.target.value)}
                  min={today}
                  className={`w-full px-4 py-3 rounded-xl border-[1.5px] text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE] bg-white transition-all ${
                    errors.start_date ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={e => handleMultiDateChange('end_date', e.target.value)}
                  min={formData.start_date || today}
                  className={`w-full px-4 py-3 rounded-xl border-[1.5px] text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE] bg-white transition-all ${
                    errors.end_date ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>}
              </div>
            </div>

            {/* Duration chip */}
            {dateRange.length > 0 && !tooLong && (
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full px-3 py-1.5 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {dateRange.length} day{dateRange.length > 1 ? 's' : ''}
              </div>
            )}
            {tooLong && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <span className="text-amber-500 text-base flex-shrink-0">⚠️</span>
                <p className="text-sm text-amber-800 font-medium">
                  Event duration cannot exceed 14 days. Please shorten the date range.
                </p>
              </div>
            )}
          </div>

          {/* Per-day schedule cards */}
          {!tooLong && schedule.length > 0 && (
            <div className="space-y-3">

              {/* Section header */}
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-bold text-gray-700">Daily Schedule</p>
                <span className="text-xs font-semibold text-gray-400">
                  {completedDays}/{schedule.length} days set
                </span>
              </div>

              {errors.daily_schedule && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {errors.daily_schedule}
                </div>
              )}

              {schedule.map((day, idx) => {
                const done = !!day.start_time
                return (
                  <div
                    key={day.date}
                    className={`bg-white rounded-2xl border-2 overflow-hidden transition-colors ${
                      done ? 'border-[#7C3AED]/30' : 'border-gray-100'
                    }`}
                  >
                    {/* Day header bar */}
                    <div className={`flex items-center gap-3 px-5 py-3 ${done ? 'bg-violet-50' : 'bg-gray-50'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        done ? 'bg-[#7C3AED] text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {done ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 12 12">
                            <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${done ? 'text-[#7C3AED]' : 'text-gray-700'}`}>
                          {fmtDayFull(day.date)}
                        </p>
                        {done && (
                          <p className="text-xs text-violet-500 font-medium mt-0.5">
                            {fmt12(day.start_time)}{day.end_time ? ` – ${fmt12(day.end_time)}` : ''}
                          </p>
                        )}
                      </div>
                      {!done && (
                        <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">
                          Needs time
                        </span>
                      )}
                    </div>

                    {/* Time inputs */}
                    <div className="grid grid-cols-2 gap-4 p-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          Start Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={day.start_time}
                          onChange={e => updateDayTime(day.date, 'start_time', e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl border-[1.5px] text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE] bg-white transition-all ${
                            !day.start_time ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200'
                          }`}
                        />
                        {day.start_time && (
                          <p className="text-xs font-semibold text-[#7C3AED] mt-1">{fmt12(day.start_time)}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          End Time
                          <span className="text-gray-400 font-normal normal-case tracking-normal ml-1">(optional)</span>
                        </label>
                        <input
                          type="time"
                          value={day.end_time ?? ''}
                          onChange={e => updateDayTime(day.date, 'end_time', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE] bg-white transition-all"
                        />
                        {day.end_time && (
                          <p className="text-xs text-gray-500 mt-1">{fmt12(day.end_time)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Placeholders */}
          {!tooLong && schedule.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-3xl mb-2">🗓</p>
              <p className="text-sm font-semibold text-gray-700">No schedule yet</p>
              <p className="text-xs text-gray-400 mt-1">
                {!formData.start_date || !formData.end_date
                  ? 'Pick a start and end date above to set up your daily schedule.'
                  : 'Your daily schedule will appear here.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Bottom tip */}
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3.5">
        <span className="text-base flex-shrink-0 mt-0.5">💡</span>
        <p className="text-sm text-indigo-800">
          {eventType === 'single'
            ? 'Set accurate times to help attendees plan their day.'
            : 'Start time is required for each day. End time is optional — use it to show when each day wraps up.'}
        </p>
      </div>
    </div>
  )
}
