'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'

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
  const lower = serviceTimes.toLowerCase()
  const dayFull  = DAY_FULL[dayIndex]
  const dayShort = DAY_SHORT[dayIndex]
  const regex = new RegExp(`(${dayShort}[a-z]*|${dayFull})s?[:\\s]*([^,\\n]+)`, 'i')
  const match = lower.match(regex)
  if (match) {
    const idx = lower.indexOf(match[0])
    const original = serviceTimes.substring(idx, idx + match[0].length).trim()
    return original.length < 60 ? original : serviceTimes
  }
  return serviceTimes
}

function mapsUrl(name: string, city: string, state: string) {
  const q = [name, city, state].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export default function ServicesToday({ churches }: Props) {
  const { todayIndex, todayName, matching } = useMemo(() => {
    const now = new Date()
    const idx = now.getDay()
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const filtered = churches.filter(c => churchHasServiceToday(c.service_times, idx))
    return { todayIndex: idx, todayName: names[idx], matching: filtered }
  }, [churches])

  if (matching.length === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-2">
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Services today</h2>
            <p className="text-sm text-gray-400 mt-0.5">Churches with services this {todayName}</p>
          </div>
          <Link href="/churches" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            All churches
          </Link>
        </div>

        <div
          className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' } as React.CSSProperties}
        >
          {matching.map(church => {
            const timesText = extractTimesForDay(church.service_times, todayIndex)
            const directionsHref = mapsUrl(church.name, church.city, church.state)

            return (
              /* Outer wrapper — not a Link so we can nest two separate hrefs */
              <div
                key={church.id}
                className="relative flex-shrink-0 w-[240px] sm:w-auto bg-white border border-gray-200 rounded-2xl overflow-hidden snap-start hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                {/* Main tap area → church profile */}
                <Link
                  href={`/churches/${church.slug}`}
                  className="block p-4 pb-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {church.logo_url ? (
                        <Image src={church.logo_url} alt={church.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-lg font-black text-gray-300">{church.name[0]}</span>
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
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {[church.city, church.state].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Service time */}
                  <div className="mt-3 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-700 leading-snug line-clamp-2">{timesText}</p>
                  </div>
                </Link>

                {/* Directions — separate tap target, outside the Link */}
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Services today
                  </span>
                  <span>Get directions →</span>
                </a>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
