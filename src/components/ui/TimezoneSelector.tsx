'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

/* Build offset string like "UTC+1:00" from an IANA timezone */
function getUtcOffset(tz: string): string {
  try {
    const date = new Date()
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(date)
    const offset = parts.find(p => p.type === 'timeZoneName')?.value ?? ''
    return offset.replace('GMT', 'UTC')
  } catch {
    return ''
  }
}

/* Get short abbreviation like "WAT", "GMT", "EST" */
function getTzAbbr(tz: string): string {
  try {
    const date = new Date()
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(date)
    return parts.find(p => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}

/* Friendly country/region labels for common IANA timezone identifiers */
const FRIENDLY_LABELS: Record<string, string> = {
  'Africa/Lagos':             'Nigeria',
  'Africa/Accra':             'Ghana',
  'Africa/Johannesburg':      'South Africa',
  'Africa/Nairobi':           'Kenya / Uganda / Tanzania',
  'Africa/Gaborone':          'Botswana',
  'Africa/Lusaka':            'Zambia',
  'Africa/Harare':            'Zimbabwe',
  'Africa/Kigali':            'Rwanda',
  'Africa/Douala':            'Cameroon',
  'Africa/Kampala':           'Uganda',
  'Africa/Dar_es_Salaam':     'Tanzania',
  'Africa/Abidjan':           'Ivory Coast / Senegal',
  'Africa/Cairo':             'Egypt',
  'Africa/Addis_Ababa':       'Ethiopia',
  'Africa/Casablanca':        'Morocco',
  'Europe/London':            'United Kingdom',
  'Europe/Paris':             'France / Belgium / Netherlands',
  'Europe/Berlin':            'Germany / Austria / Switzerland',
  'Europe/Rome':              'Italy',
  'Europe/Madrid':            'Spain',
  'Europe/Amsterdam':         'Netherlands',
  'Europe/Stockholm':         'Sweden / Norway / Denmark',
  'Europe/Warsaw':            'Poland',
  'Europe/Kiev':              'Ukraine',
  'Europe/Moscow':            'Russia (Moscow)',
  'America/New_York':         'USA — Eastern (New York)',
  'America/Chicago':          'USA — Central (Chicago)',
  'America/Denver':           'USA — Mountain (Denver)',
  'America/Los_Angeles':      'USA — Pacific (Los Angeles)',
  'America/Toronto':          'Canada — Eastern (Toronto)',
  'America/Vancouver':        'Canada — Pacific (Vancouver)',
  'America/Sao_Paulo':        'Brazil (São Paulo)',
  'America/Argentina/Buenos_Aires': 'Argentina',
  'America/Jamaica':          'Jamaica',
  'America/Trinidad':         'Trinidad & Tobago',
  'Asia/Dubai':               'UAE (Dubai)',
  'Asia/Riyadh':              'Saudi Arabia',
  'Asia/Kolkata':             'India',
  'Asia/Karachi':             'Pakistan',
  'Asia/Dhaka':               'Bangladesh',
  'Asia/Singapore':           'Singapore / Malaysia',
  'Asia/Hong_Kong':           'Hong Kong',
  'Asia/Shanghai':            'China',
  'Asia/Tokyo':               'Japan',
  'Asia/Seoul':               'South Korea',
  'Asia/Jerusalem':           'Israel',
  'Asia/Beirut':              'Lebanon',
  'Asia/Nicosia':             'Cyprus',
  'Australia/Sydney':         'Australia — Eastern (Sydney)',
  'Australia/Melbourne':      'Australia — Eastern (Melbourne)',
  'Australia/Perth':          'Australia — Western (Perth)',
  'Pacific/Auckland':         'New Zealand',
}

export interface TimezoneOption {
  value: string
  display: string  // shown in list: "Nigeria — WAT (UTC+1)"
  search: string   // lowercased for filtering
}

/* Build the full timezone list once — called lazily on first render */
function buildTimezoneList(): TimezoneOption[] {
  let allTz: string[] = []
  try {
    allTz = Intl.supportedValuesOf('timeZone')
  } catch {
    // Fallback for environments that don't support it
    allTz = Object.keys(FRIENDLY_LABELS)
  }

  return allTz.map(tz => {
    const friendly = FRIENDLY_LABELS[tz]
    const abbr     = getTzAbbr(tz)
    const offset   = getUtcOffset(tz)
    const display  = friendly
      ? `${friendly} — ${abbr} (${offset})`
      : `${tz.replace(/_/g, ' ')} — ${abbr} (${offset})`
    return {
      value: tz,
      display,
      search: `${tz} ${friendly ?? ''} ${abbr}`.toLowerCase(),
    }
  })
}

interface Props {
  value: string
  onChange: (tz: string) => void
  inputCls?: string
  labelCls?: string
}

export default function TimezoneSelector({ value, onChange, inputCls, labelCls }: Props) {
  const [query, setQuery]           = useState('')
  const [open, setOpen]             = useState(false)
  const [allTz, setAllTz]           = useState<TimezoneOption[]>([])
  const containerRef                = useRef<HTMLDivElement>(null)

  /* Build list lazily on first open */
  useEffect(() => {
    if (open && allTz.length === 0) {
      setAllTz(buildTimezoneList())
    }
  }, [open, allTz.length])

  /* Close on outside click */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    if (!query) {
      // Show featured timezones first when no query
      const featured = Object.keys(FRIENDLY_LABELS)
      const featuredSet = new Set(featured)
      const featuredItems = allTz.filter(t => featuredSet.has(t.value))
      const rest = allTz.filter(t => !featuredSet.has(t.value))
      return [...featuredItems, ...rest].slice(0, 60)
    }
    const q = query.toLowerCase()
    return allTz.filter(t => t.search.includes(q)).slice(0, 60)
  }, [query, allTz])

  const selectedOption = useMemo(
    () => allTz.find(t => t.value === value),
    [allTz, value]
  )

  const selectedDisplay = useMemo(() => {
    if (selectedOption) return selectedOption.display
    // Build display for the current value before allTz is loaded
    const friendly = FRIENDLY_LABELS[value]
    const abbr     = getTzAbbr(value)
    const offset   = getUtcOffset(value)
    return friendly
      ? `${friendly} — ${abbr} (${offset})`
      : `${value.replace(/_/g, ' ')} — ${abbr} (${offset})`
  }, [selectedOption, value])

  const base = inputCls ?? 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20'

  return (
    <div ref={containerRef} className="relative">
      {/* Selected value button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${base} flex items-center justify-between gap-2 cursor-pointer text-left`}
      >
        <span className="truncate">{selectedDisplay}</span>
        <span className="text-gray-400 flex-shrink-0 text-xs">▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search country or timezone…"
              className="flex-1 text-sm text-gray-900 outline-none bg-transparent placeholder-gray-400"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}>
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto">
            {allTz.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">Loading timezones…</p>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">No results for "{query}"</p>
            ) : filtered.map(tz => (
              <button
                key={tz.value}
                type="button"
                onClick={() => { onChange(tz.value); setOpen(false); setQuery('') }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-violet-50 ${
                  tz.value === value ? 'bg-violet-50 text-[#7C3AED] font-semibold' : 'text-gray-800'
                }`}
              >
                {tz.display}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
