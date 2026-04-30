'use client'

import { useMemo } from 'react'
import { Globe } from 'lucide-react'

interface Props {
  timezone: string
  startDate: string
}

function getTzAbbr(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date())
    return parts.find(p => p.type === 'timeZoneName')?.value ?? ''
  } catch { return '' }
}

function getUtcOffset(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date())
    return (parts.find(p => p.type === 'timeZoneName')?.value ?? '').replace('GMT', 'UTC')
  } catch { return '' }
}

export default function EventTimezone({ timezone, startDate }: Props) {
  const eventTzLabel = useMemo(() => {
    const abbr   = getTzAbbr(timezone)
    const offset = getUtcOffset(timezone)
    return abbr ? `${abbr} (${offset})` : offset
  }, [timezone])

  const localTime = useMemo(() => {
    try {
      const viewerTz  = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (viewerTz === timezone) return null
      const date = new Date(startDate)
      const formatted = date.toLocaleTimeString('en', {
        timeZone: viewerTz,
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
      return formatted
    } catch { return null }
  }, [startDate, timezone])

  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500 font-normal">
      <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" />
      {eventTzLabel}
      {localTime && (
        <span className="text-gray-400">· your time: {localTime}</span>
      )}
    </span>
  )
}
