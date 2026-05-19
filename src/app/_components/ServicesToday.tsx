'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, CheckCircle2 } from 'lucide-react'

interface ChurchWithTimes {
  id: string
  name: string
  slug: string
  city: string
  state: string
  service_times: string
  logo_url: string | null
  denomination: string | null
  verified_badge: boolean
}

interface Props {
  churches: ChurchWithTimes[]
}

const DAY_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_FULL  = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function churchHasServiceToday(serviceTimes: string, dayIndex: number): boolean {
  const lower = serviceTimes.toLowerCase()
  return lower.includes(DAY_SHORT[dayIndex]) || lower.includes(DAY_FULL[dayIndex])
}

function extractTimesForDay(serviceTimes: string, dayIndex: number): string {
  // Try to extract the portion of the string relevant to today's day
  const lower = serviceTimes.toLowerCase()
  const dayFull = DAY_FULL[dayIndex]
  const dayShort = DAY_SHORT[dayIndex]

  // Find a segment mentioning today's day and extract up to the next comma or end
  const regex = new RegExp(`(${dayShort}[a-z]*|${dayFull})s?[:\\s]*([^,\\n]+)`, 'i')
  const match = lower.match(regex)
  if (match) {
    // Return original-case portion
    const idx = lower.indexOf(match[0])
    const original = serviceTimes.substring(idx, idx + match[0].length).trim()
    return original.length < 60 ? original : serviceTimes
  }
  return serviceTimes
}

export default function ServicesToday({ churches }: Props) {
  const { todayIndex, todayName, matching } = useMemo(() => {
    const now = new Date()
    const idx = now.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const filtered = churches.filter(c => churchHasServiceToday(c.service_times, idx))
    return { todayIndex: idx, todayName: names[idx], matching: filtered }
  }, [churches])

  // Only show on days that have matching churches
  if (matching.length === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-2">
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Services Today</h2>
            <p className="text-sm text-gray-400 mt-0.5">Churches with services this {todayName}</p>
          </div>
          <Link href="/churches" className="text-sm text-indigo-600 font-medium hover:underline">
            All churches →
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 snap-x snap-mandatory">
          {matching.map(church => {
            const timesText = extractTimesForDay(church.service_times, todayIndex)
            return (
              <Link
                key={church.id}
                href={`/churches/${church.slug}`}
                className="flex-shrink-0 w-[280px] sm:w-auto snap-start bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {church.logo_url ? (
                      <Image src={church.logo_url} alt={church.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-300">{church.name[0]}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                        {church.name}
                      </p>
                      {church.verified_badge && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      )}
                    </div>
                    {church.denomination && (
                      <p className="text-xs text-gray-400 truncate">{church.denomination}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5">
                      <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500 truncate">
                        {[church.city, church.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-2.5 py-2 bg-indigo-50 rounded-xl">
                  <p className="text-xs font-medium text-indigo-700 leading-snug line-clamp-2">{timesText}</p>
                </div>
                <div className="mt-2.5 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-emerald-600 font-medium">Services today</span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
