import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Users, Eye } from 'lucide-react'
import { formatDate, formatTime, CATEGORY_LABELS, CATEGORY_COLORS, cn } from '@/lib/utils'
import type { Event } from '@/types/database'

interface EventCardProps {
  event: Event
  variant?: 'default' | 'compact' | 'featured'
  attendanceCount?: number
}

export default function EventCard({ event, variant = 'default', attendanceCount }: EventCardProps) {
  const categoryColor = CATEGORY_COLORS[event.category] ?? 'bg-gray-100 text-gray-800'
  const categoryLabel = CATEGORY_LABELS[event.category] ?? event.category

  if (variant === 'compact') {
    return (
      <Link href={`/events/${event.slug}`} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
        <div className="w-14 h-14 rounded-lg bg-indigo-50 flex-shrink-0 overflow-hidden relative">
          {event.banner_url ? (
            <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-indigo-400 text-xl font-bold">
              {event.title[0]}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600">{event.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{formatDate(event.start_date)}</p>
          <p className="text-xs text-gray-500">{event.city}</p>
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link href={`/events/${event.slug}`} className="group relative rounded-2xl overflow-hidden bg-gray-900 text-white h-72 flex flex-col justify-end">
        {event.banner_url && (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className="object-cover opacity-60 group-hover:opacity-50 transition-opacity"
          />
        )}
        <div className="relative p-5 bg-gradient-to-t from-black/80 to-transparent">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block', categoryColor)}>
            {categoryLabel}
          </span>
          <h3 className="font-bold text-lg leading-tight line-clamp-2">{event.title}</h3>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-300">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(event.start_date, { month: 'short', day: 'numeric' })}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.city}</span>
          </div>
          {(attendanceCount !== undefined || event.views_count > 0) && (
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
              {attendanceCount !== undefined && attendanceCount > 0 && (
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{attendanceCount}</span>
              )}
              {event.views_count > 0 && (
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{event.views_count}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/events/${event.slug}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className="relative h-44 bg-gradient-to-br from-indigo-50 to-purple-50">
        {event.banner_url ? (
          <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-indigo-200">{event.title[0]}</span>
          </div>
        )}
        <span className={cn('absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full', categoryColor)}>
          {categoryLabel}
        </span>
        {event.is_free ? (
          <span className="absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-800">Free</span>
        ) : (
          <span className="absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">Paid</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
          {event.title}
        </h3>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(event.start_date)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{event.location_name}, {event.city}</span>
          </div>
        </div>
        {event.churches && (
          <p className="mt-2 text-xs text-indigo-600 font-medium truncate">{event.churches.name}</p>
        )}
        {/* Stats */}
        {(attendanceCount !== undefined || event.views_count > 0) && (
          <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-gray-50 text-xs text-gray-400">
            {attendanceCount !== undefined && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {attendanceCount} attending
              </span>
            )}
            {event.views_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {event.views_count} views
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
