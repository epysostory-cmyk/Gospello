'use client'

import { getEventLifecycle } from '@/types/database'

interface Props {
  startDate: string
  endDate?: string | null
}

/**
 * Client component so lifecycle is calculated in the user's LOCAL timezone,
 * not the server's UTC clock. This fixes events appearing "Upcoming" on the
 * detail page even after they've started for Nigerian users (WAT = UTC+1).
 */
export function EventStatusBadge({ startDate, endDate }: Props) {
  const lifecycle = getEventLifecycle(startDate, endDate)

  const badge = {
    upcoming: { label: 'Upcoming',       cls: 'bg-amber-100 text-amber-800' },
    ongoing:  { label: 'Happening Now',  cls: 'bg-green-100 text-green-800' },
    ended:    { label: 'Ended',          cls: 'bg-gray-100 text-gray-600'   },
  }[lifecycle]

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.cls}`}>
      {badge.label}
    </span>
  )
}

export function EventDaysChip({ startDate, endDate }: Props) {
  const lifecycle = getEventLifecycle(startDate, endDate)
  const tz = 'Africa/Lagos'
  const toCalendarDate = (d: Date) =>
    new Date(d.toLocaleDateString('en-CA', { timeZone: tz })) // YYYY-MM-DD in Lagos time
  const nowDay   = toCalendarDate(new Date())
  const startDay = toCalendarDate(new Date(startDate))
  const diffDays = Math.round((startDay.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24))

  let label: string
  if (lifecycle === 'ended') {
    label = 'Ended'
  } else if (lifecycle === 'ongoing') {
    label = 'Happening Now 🔴'
  } else if (diffDays === 0) {
    label = 'Today! 🎉'
  } else if (diffDays === 1) {
    label = 'Tomorrow!'
  } else {
    label = `${diffDays} Days Away 📅`
  }

  return <>{label}</>
}
