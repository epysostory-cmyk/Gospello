'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

const ALL_TYPES = [
  'Pastor', 'Senior Pastor', 'Associate Pastor', 'Apostle', 'Prophet', 'Evangelist',
  'Bishop', 'Teacher', 'Deacon', 'Ministry Leader', 'Church Worker', 'Campus Minister',
  'Youth Pastor', 'Youth Leader', "Children's Ministry Leader", "Teens Ministry Leader",
  'Prison Minister', 'Missionary', "Women's Minister", "Men's Minister",
  'Gospel Artist', 'Musician', 'Worship Leader', 'Praise Leader', 'Music Minister',
  'Music Director', 'Choir Director', 'Gospel DJ', 'Filmmaker', 'Podcaster',
  'Content Creator', 'Christian Speaker', 'Author/Writer', 'Conference Host',
  'Event Organizer', 'Christian Entrepreneur', 'Christian Coach/Mentor',
  'Christian Organization', 'NGO', 'Campus Fellowship', 'Individual Christian', 'Other',
]

interface Props {
  value: string[]
  onChange: (v: string[]) => void
  max?: number
}

export default function OrganizerTypeChips({ value, onChange, max = 3 }: Props) {
  const [query, setQuery] = useState('')
  const filtered = query.trim()
    ? ALL_TYPES.filter(t => t.toLowerCase().includes(query.toLowerCase()))
    : ALL_TYPES

  function toggle(type: string) {
    if (value.includes(type)) {
      onChange(value.filter(v => v !== type))
    } else if (value.length < max) {
      onChange([...value, type])
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">Select up to {max}</p>
        <span className={`text-xs font-semibold ${value.length >= max ? 'text-[#7C3AED]' : 'text-gray-400'}`}>
          {value.length}/{max} selected
        </span>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20"
        />
      </div>

      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
        {filtered.map(type => {
          const selected = value.includes(type)
          const disabled = !selected && value.length >= max
          return (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => toggle(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 select-none ${
                selected
                  ? 'bg-[#7C3AED] text-white shadow-sm scale-105'
                  : disabled
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 cursor-pointer'
              }`}
            >
              {type}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 py-2">No results for &quot;{query}&quot;</p>
        )}
      </div>
    </div>
  )
}
