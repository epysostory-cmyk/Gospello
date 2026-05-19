'use client'

import type { RecurrenceRule } from '@/types/database'

const DAYS     = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const ORDINALS = ['First', 'Second', 'Third', 'Fourth']

const inp = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gray-900 bg-white transition-colors'

interface Props {
  rule: RecurrenceRule | null
  startDate?: string
  onChange: (rule: RecurrenceRule | null) => void
}

export default function RecurringSection({ rule, startDate, onChange }: Props) {
  const isRecurring = !!rule

  function toggle(on: boolean) {
    if (on) {
      const baseDay = startDate
        ? new Date(startDate + 'T12:00:00').getDay()
        : 0
      onChange({ frequency: 'weekly', interval: 1, day_of_week: baseDay, occurrences: 10 })
    } else {
      onChange(null)
    }
  }

  function patch(updates: Partial<RecurrenceRule>) {
    if (!rule) return
    onChange({ ...rule, ...updates })
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

          {/* Frequency + interval */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Repeats</label>
              <select
                value={rule.frequency}
                onChange={e => {
                  const freq = e.target.value as RecurrenceRule['frequency']
                  patch({
                    frequency: freq,
                    ...(freq === 'monthly' && !rule.week_of_month ? { week_of_month: 1 } : {}),
                  })
                }}
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
                  {[1, 2, 3, 4, 6, 8].map(n => <option key={n} value={n}>{n}</option>)}
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
