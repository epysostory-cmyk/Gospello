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
  otherText?: string
  onOtherTextChange?: (text: string) => void
}

export default function OrganizerTypeChips({ value, onChange, max = 3, otherText = '', onOtherTextChange }: Props) {
  const [query, setQuery] = useState('')

  const hasOther = value.includes('Other')
  const unselected = ALL_TYPES.filter(t => !value.includes(t))
  const filtered = query.trim()
    ? unselected.filter(t => t.toLowerCase().includes(query.toLowerCase()))
    : unselected

  function toggle(type: string) {
    if (value.includes(type)) {
      onChange(value.filter(v => v !== type))
      if (type === 'Other') onOtherTextChange?.('')
    } else if (value.length < max) {
      onChange([...value, type])
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Select up to {max}</p>

      {/* Selected chips pinned at top */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => toggle(type)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-900 text-white flex items-center gap-1.5"
            >
              {type} <span className="text-white/60">×</span>
            </button>
          ))}
        </div>
      )}

      {/* Search + unselected list — only show if under max */}
      {value.length < max && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-900"
            />
          </div>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
            {filtered.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => toggle(type)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {type}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 py-2">No results for &quot;{query}&quot;</p>
            )}
          </div>
        </>
      )}

      {/* Other custom input */}
      {hasOther && (
        <div>
          <input
            type="text"
            value={otherText}
            onChange={e => onOtherTextChange?.(e.target.value)}
            placeholder="Describe your ministry type..."
            maxLength={60}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-900"
          />
          <p className="text-xs text-gray-400 mt-1">Tell us what best describes you</p>
        </div>
      )}
    </div>
  )
}
