'use client'

import { useState, useEffect } from 'react'
import { CalendarPlus, X, Check } from 'lucide-react'

interface Props {
  title: string
  startDate: string
  endDate?: string | null
  location: string
  description?: string | null
}

function toCalDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function endOrDefault(props: Props): string {
  return props.endDate
    ? toCalDate(props.endDate)
    : toCalDate(new Date(new Date(props.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString())
}

function googleCalUrl(props: Props): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: props.title,
    dates: `${toCalDate(props.startDate)}/${endOrDefault(props)}`,
    details: props.description?.substring(0, 500) ?? '',
    location: props.location,
  })
  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`
}

function buildIcs(props: Props): string {
  const desc = (props.description ?? '').replace(/\n/g, '\\n').substring(0, 500)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gospello//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:gospello-${Date.now()}@gospello.com`,
    `DTSTAMP:${toCalDate(new Date().toISOString())}`,
    `DTSTART:${toCalDate(props.startDate)}`,
    `DTEND:${endOrDefault(props)}`,
    `SUMMARY:${props.title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${props.location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function downloadIcs(props: Props) {
  const blob = new Blob([buildIcs(props)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `${props.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.ics`,
  })
  a.click()
  URL.revokeObjectURL(url)
}

type Option = 'google' | 'apple' | 'outlook'

export default function AddToCalendar(props: Props) {
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState<Option | null>(null)

  const day = new Date(props.startDate).getDate()

  const OPTIONS: { id: Option; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      id: 'google',
      label: 'Google Calendar',
      sub: 'Opens in app on Android · browser on desktop',
      icon: (
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M45.5 20H24v8.5h12.4C34.8 34 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 6 1.1 8.2 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c11 0 20.5-8 20.5-21 0-1.4-.1-2.7-.4-4z"/>
          <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16 19.2 13 24 13c3.1 0 6 1.1 8.2 3l6-6C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.3-17.7 11.7z"/>
          <path fill="#FBBC05" d="M24 45c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.8 36 27 37 24 37c-6 0-10.8-3.9-12.4-9.5l-7 5.4C8.1 40.7 15.4 45 24 45z"/>
          <path fill="#EA4335" d="M45.5 20H24v8.5h12.4c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6c3.9-3.6 6.1-8.9 6.1-15.2 0-1.4-.1-2.7-.4-4z"/>
        </svg>
      ),
    },
    {
      id: 'apple',
      label: 'Apple Calendar',
      sub: 'iPhone & Mac · opens Add Event sheet instantly',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#1C1C1E"/>
          <rect x="3" y="8" width="18" height="13" rx="2" fill="white"/>
          <rect x="3" y="5" width="18" height="5" fill="#FF3B30"/>
          <rect x="3" y="6.5" width="18" height="1.5" fill="#CC0000"/>
          <rect x="7" y="3" width="2" height="5" rx="1" fill="#1C1C1E"/>
          <rect x="15" y="3" width="2" height="5" rx="1" fill="#1C1C1E"/>
          <text x="12" y="19" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#1C1C1E" fontFamily="system-ui">{day}</text>
        </svg>
      ),
    },
    {
      id: 'outlook',
      label: 'Outlook / Other',
      sub: 'Outlook, Thunderbird, any .ics-compatible app',
      icon: (
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="8" fill="#0078D4"/>
          <rect x="6" y="12" width="22" height="26" rx="3" fill="white"/>
          <rect x="20" y="16" width="22" height="18" rx="2" fill="#50A0D8"/>
          <path d="M20 20 L31 27 L42 20" stroke="white" strokeWidth="1.5" fill="none"/>
          <circle cx="17" cy="26" r="5" fill="white"/>
          <text x="17" y="29" textAnchor="middle" fontSize="5.5" fontWeight="800" fill="#0078D4" fontFamily="system-ui">{day}</text>
        </svg>
      ),
    },
  ]

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleOption(id: Option) {
    if (id === 'google') {
      window.open(googleCalUrl(props), '_blank', 'noopener,noreferrer')
    } else {
      downloadIcs(props)
    }
    setAdded(id)
    setTimeout(() => {
      setAdded(null)
      setOpen(false)
    }, 1400)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm"
      >
        <CalendarPlus className="w-4 h-4 text-indigo-500" />
        Add to Calendar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">

            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900 text-sm">Add to Calendar</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{props.title}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>

            <div className="p-3">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleOption(opt.id)}
                  disabled={added !== null}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left disabled:opacity-60"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
                    {added === opt.id ? (
                      <Check className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
                    ) : (
                      opt.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{opt.sub}</p>
                  </div>
                  {added === opt.id && (
                    <span className="text-xs font-semibold text-emerald-500 flex-shrink-0">Added!</span>
                  )}
                </button>
              ))}
            </div>

            <div className="px-5 pb-5 pt-1">
              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                On iPhone, tap <strong className="text-gray-500">Apple Calendar</strong> — it opens the Add Event sheet in your Calendar app instantly.
                On Android, <strong className="text-gray-500">Google Calendar</strong> opens the app directly.
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
