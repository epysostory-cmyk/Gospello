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
        <div key={i} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={entry.day}
            onChange={e => update(i, 'day', e.target.value)}
            className="w-28 px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {DAYS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Service name (e.g. First Service)"
            value={entry.name}
            onChange={e => update(i, 'name', e.target.value)}
            className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />

          <input
            type="time"
            value={entry.time}
            onChange={e => update(i, 'time', e.target.value)}
            className="w-32 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />

          <button
            type="button"
            onClick={() => remove(i)}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
          >
            <X size={16} />
          </button>
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
