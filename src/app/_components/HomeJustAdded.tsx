'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@/types/database'
import type { CategoryMap } from '@/lib/categories'
import { formatTime } from '@/lib/utils'

interface Props {
  events: Event[]
  catMap: CategoryMap
}

function relativeDate(dateStr: string): { label: string; hot: boolean } {
  const event = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.floor((event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0)  return { label: 'Ongoing', hot: false }
  if (diff === 0) return { label: 'Today', hot: true }
  if (diff === 1) return { label: 'Tomorrow', hot: true }
  if (diff < 7)  return { label: `In ${diff} days`, hot: false }
  return {
    label: event.toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Africa/Lagos',
    }),
    hot: false,
  }
}

export default function HomeJustAdded({ events, catMap }: Props) {
  if (events.length === 0) return null

  return (
    <section className="pt-10 pb-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Just added</h2>
            <p className="text-sm text-gray-400 mt-0.5">Freshest events on Gospello</p>
          </div>
          <Link
            href="/events?sort=newest"
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            See all
          </Link>
        </div>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pl-4 sm:pl-6 lg:pl-8 pr-4 pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {events.map((event) => {
          const cat = catMap[event.category]
          const { label, hot } = relativeDate(event.start_date)
          const accentColor = cat?.color ?? '#6B7280'

          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group flex-shrink-0 snap-start w-[200px] bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-sm active:scale-[0.98] transition-all"
            >
              {/* Image or color block */}
              <div className="relative w-full h-[110px] bg-gray-100">
                {event.banner_url ? (
                  <Image
                    src={event.banner_url}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: accentColor + '15' }}
                  >
                    <span
                      className="text-3xl font-black"
                      style={{ color: accentColor + '60' }}
                    >
                      {event.title[0]}
                    </span>
                  </div>
                )}
                {/* Category accent bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: accentColor }}
                />
              </div>

              {/* Content */}
              <div className="p-3">
                <p className={`text-[11px] font-bold mb-1 ${hot ? 'text-rose-500' : 'text-gray-400'}`}>
                  {label}
                  {!event.time_tba && (
                    <span className="font-normal"> · {formatTime(event.start_date)}</span>
                  )}
                </p>
                <p className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  {event.title}
                </p>
                <p className="text-[11px] text-gray-400 mt-1.5 truncate">
                  {event.is_online
                    ? 'Online'
                    : [event.city, event.state].filter(Boolean).join(', ') || 'Location TBD'}
                </p>
              </div>
            </Link>
          )
        })}

        <Link
          href="/events?sort=newest"
          className="group flex-shrink-0 snap-start w-[160px] border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-4 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-all"
        >
          <p className="text-[13px] font-semibold text-gray-600 leading-snug">
            See all new events
          </p>
        </Link>

        <div className="flex-shrink-0 w-4" />
      </div>
    </section>
  )
}
