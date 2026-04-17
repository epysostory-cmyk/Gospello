'use client'

import { useState, useRef, useEffect } from 'react'
import { CalendarPlus, ChevronDown } from 'lucide-react'

interface Props {
  title: string
  startDate: string        // ISO string from DB, e.g. "2026-05-01T18:00:00"
  endDate?: string | null  // ISO string or null
  location: string         // "Venue Name, City" or "Online Event"
  description?: string | null
}

/** Format a date to the ical/Google compact format: YYYYMMDDTHHmmssZ */
function toCalDate(iso: string): string {
  // Treat DB dates as local Nigeria time (UTC+1) if they have no offset
  const d = new Date(iso)
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/** Build a Google Calendar add-event URL */
function googleCalUrl(props: Props): string {
  const start = toCalDate(props.startDate)
  // Default to 2 hours after start if no end date
  const end = props.endDate
    ? toCalDate(props.endDate)
    : toCalDate(new Date(new Date(props.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString())

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: props.title,
    dates: `${start}/${end}`,
    details: props.description?.substring(0, 500) ?? '',
    location: props.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Build the raw text of an .ics file */
function buildIcs(props: Props): string {
  const start = toCalDate(props.startDate)
  const end = props.endDate
    ? toCalDate(props.endDate)
    : toCalDate(new Date(new Date(props.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString())

  const desc = (props.description ?? '').replace(/\n/g, '\\n').substring(0, 500)
  const uid = `gospello-${Date.now()}@gospello.com`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gospello//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toCalDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${props.title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${props.location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function downloadIcs(props: Props) {
  const ics = buildIcs(props)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AddToCalendar(props: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm"
      >
        <CalendarPlus className="w-4 h-4 text-indigo-500" />
        Add to Calendar
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-20">
          {/* Google Calendar */}
          <a
            href={googleCalUrl(props)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            {/* Google coloured icon */}
            <svg width="18" height="18" viewBox="0 0 48 48" className="flex-shrink-0">
              <path fill="#4285F4" d="M45.5 20H24v8.5h12.4C34.8 34 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 6 1.1 8.2 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c11 0 20.5-8 20.5-21 0-1.4-.1-2.7-.4-4z"/>
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16 19.2 13 24 13c3.1 0 6 1.1 8.2 3l6-6C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.3-17.7 11.7z"/>
              <path fill="#FBBC05" d="M24 45c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.8 36 27 37 24 37c-6 0-10.8-3.9-12.4-9.5l-7 5.4C8.1 40.7 15.4 45 24 45z"/>
              <path fill="#EA4335" d="M45.5 20H24v8.5h12.4c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6c3.9-3.6 6.1-8.9 6.1-15.2 0-1.4-.1-2.7-.4-4z"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-900">Google Calendar</p>
              <p className="text-xs text-gray-500">Opens in a new tab</p>
            </div>
          </a>

          <div className="border-t border-gray-50" />

          {/* Apple / iCal */}
          <button
            type="button"
            onClick={() => { downloadIcs(props); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            {/* Apple calendar icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <rect width="24" height="24" rx="5" fill="#FF3B30"/>
              <rect x="3" y="7" width="18" height="14" rx="2" fill="white"/>
              <rect x="3" y="5" width="18" height="4" rx="2" fill="#FF3B30"/>
              <rect x="7" y="3" width="2" height="4" rx="1" fill="#FF3B30"/>
              <rect x="15" y="3" width="2" height="4" rx="1" fill="#FF3B30"/>
              <text x="12" y="18" textAnchor="middle" fontSize="7" fontWeight="700" fill="#FF3B30" fontFamily="Arial">
                {new Date(props.startDate).getDate()}
              </text>
            </svg>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Apple Calendar</p>
              <p className="text-xs text-gray-500">Downloads .ics file</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
