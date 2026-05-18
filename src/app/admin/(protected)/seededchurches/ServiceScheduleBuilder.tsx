'use client'

import { Plus, X } from 'lucide-react'

export interface ServiceEntry {
  day: string
  name: string
  time: string
}

const DAYS = [
  { value: 'sunday',    label: 'Sun' },
  { value: 'monday',    label: 'Mon' },
  { value: 'tuesday',   label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday',  label: 'Thu' },
  { value: 'friday',    label: 'Fri' },
  { value: 'saturday',  label: 'Sat' },
]

interface Props {
  entries: ServiceEntry[]
  onChange: (entries: ServiceEntry[]) => void
}

export default function ServiceScheduleBuilder({ entries, onChange }: Props) {
  function add() {
    onChange([...entries, { day: 'sunday', name: '', time: '' }])
  }

  function remove(i: number) {
    onChange(entries.filter((_, idx) => idx !== i))
  }

  function update(i: number, field: keyof ServiceEntry, value: string) {
    onChange(entries.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2 sm:space-y-0 sm:bg-transparent sm:border-0 sm:p-0 sm:flex sm:items-center sm:gap-2">
          {/* Row 1 on mobile: day + time */}
          <div className="flex items-center gap-2">
            <select
              value={entry.day}
              onChange={e => update(i, 'day', e.target.value)}
              className="w-28 px-2 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {DAYS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>

            <input
              type="time"
              value={entry.time}
              onChange={e => update(i, 'time', e.target.value)}
              className="flex-1 sm:flex-none sm:w-32 px-2 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Row 2 on mobile: name + delete */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Service name (e.g. First Service)"
              value={entry.name}
              onChange={e => update(i, 'name', e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />

            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-1"
      >
        <Plus size={15} />
        Add service
      </button>
    </div>
  )
}
