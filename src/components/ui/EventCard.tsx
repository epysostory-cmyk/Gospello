'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Zap, Star, Globe, Users } from 'lucide-react'
import { formatDate, formatTime, cn } from '@/lib/utils'
import type { Event } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import type { CategoryInfo } from '@/lib/categories'
import SaveButton from './SaveButton'

interface EventCardProps {
  event: Event
  variant?: 'default' | 'compact' | 'featured'
  attendanceCount?: number
  categoryInfo?: CategoryInfo
}

export default function EventCard({ event, variant = 'default', attendanceCount, categoryInfo }: EventCardProps) {
  const categoryLabel = categoryInfo?.name ?? event.category
  const categoryColor = categoryInfo?.color ?? '#6B7280'
  const categoryIcon  = categoryInfo?.icon ?? null

  // Badge styles derived from DB color
  const badgeStyle = { backgroundColor: categoryColor + 'cc', color: '#fff' }
  const badgeCls = 'backdrop-blur-sm'

  const isAlmostFull = event.capacity != null && event.capacity > 0 && attendanceCount != null
    ? (attendanceCount / event.capacity) >= 0.8
    : false

  const now = new Date()
  const eventStart = new Date(event.start_date)
  const daysUntil = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

  // Use the same lifecycle logic as the event page
  const lifecycle = getEventLifecycle(event.start_date, event.end_date, event.daily_schedule ?? undefined)
  const isUpcoming = lifecycle === 'upcoming'
  const isOngoing  = lifecycle === 'ongoing'
  const hasEnded   = lifecycle === 'ended'

  // "Soon" only for upcoming events starting within 3 days
  const isHappeningSoon = isUpcoming && daysUntil <= 3

  // ── COMPACT ─────────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <Link
        href={`/events/${event.slug}`}
        className="flex gap-3 p-3 rounded-2xl bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all group"
      >
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex-shrink-0 overflow-hidden relative">
          {event.banner_url ? (
            <Image src={event.banner_url} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-black text-indigo-200">
              {event.title[0]}
            </div>
          )}
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <p className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
            {event.title}
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" />
            {event.end_date && event.end_date.split('T')[0] !== event.start_date.split('T')[0]
              ? `${formatDate(event.start_date, { month: 'short', day: 'numeric' })} – ${formatDate(event.end_date, { month: 'short', day: 'numeric' })}`
              : formatDate(event.start_date, { month: 'short', day: 'numeric' })}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            {event.is_online
              ? <><Globe className="w-3 h-3 text-sky-400" /><span className="text-sky-600 font-medium">Online</span></>
              : <><MapPin className="w-3 h-3 text-rose-400" /><span className="text-rose-600 font-medium">In Person</span>{event.city ? ` · ${event.city}` : ''}</>
            }
          </p>
        </div>
      </Link>
    )
  }

  // ── FEATURED ─────────────────────────────────────────────────────────────
  if (variant === 'featured') {
    return (
      <Link
        href={`/events/${event.slug}`}
        className="group relative rounded-2xl overflow-hidden bg-slate-900 h-80 flex flex-col justify-end cursor-pointer"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
      >
        {event.banner_url && (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className="object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

        {/* Featured badge */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          <span className="flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <Star className="w-3 h-3 fill-white" /> Featured
          </span>
          {event.is_free
            ? <span className="bg-emerald-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">Free</span>
            : <span className="bg-amber-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">Paid</span>
          }
        </div>

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', badgeCls)}
            style={badgeStyle}
          >
            {categoryIcon && <span className="mr-1">{categoryIcon}</span>}{categoryLabel}
          </span>
        </div>

        {/* Content */}
        <div className="relative p-5">
          <h3 className="font-black text-xl text-white leading-tight line-clamp-2 group-hover:text-amber-300 transition-colors">
            {event.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {event.end_date && event.end_date.split('T')[0] !== event.start_date.split('T')[0]
                ? `${formatDate(event.start_date, { month: 'short', day: 'numeric' })} – ${formatDate(event.end_date, { month: 'short', day: 'numeric' })}`
                : formatDate(event.start_date, { month: 'short', day: 'numeric' })}
            </span>
            {event.is_online ? (
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-sky-300 font-medium">Online</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-200 font-medium">In Person</span>
                {event.city && <span className="text-white/60">· {event.city}</span>}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // ── DEFAULT ─────────────────────────────────────────────────────────────
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-sm border border-gray-100 hover:border-gray-200"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className={`object-cover group-hover:scale-[1.03] transition-transform duration-500 ${hasEnded ? 'grayscale opacity-60' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <span className="text-5xl font-black text-gray-200">{event.title[0]}</span>
          </div>
        )}

        {hasEnded && <div className="absolute inset-0 bg-gray-900/30" />}

        {/* Category */}
        <span
          className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20"
          style={badgeStyle}
        >
          {categoryIcon && <span className="mr-1">{categoryIcon}</span>}{categoryLabel}
        </span>

        {/* Status badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {hasEnded ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-700/90 text-white backdrop-blur-sm">Ended</span>
          ) : isOngoing ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/90 text-white backdrop-blur-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" /> Live
            </span>
          ) : event.is_free ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-sm">Free</span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/90 text-white backdrop-blur-sm">
              {event.price != null ? `₦${event.price.toLocaleString()}` : 'Paid'}
            </span>
          )}
          {isUpcoming && isAlmostFull && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/90 text-white backdrop-blur-sm">Almost Full</span>
          )}
          {isHappeningSoon && (
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-violet-500/90 text-white backdrop-blur-sm flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 fill-white" /> Soon
            </span>
          )}
        </div>

        {/* Save */}
        <div className="absolute bottom-3 right-3" onClick={e => e.preventDefault()}>
          <SaveButton eventId={event.id} initialSaved={false} variant="icon" size="sm" />
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug text-[15px]">
          {event.title}
        </h3>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            {event.end_date && event.end_date.split('T')[0] !== event.start_date.split('T')[0] ? (
              <span>{formatDate(event.start_date, { month: 'short', day: 'numeric' })} – {formatDate(event.end_date, { month: 'short', day: 'numeric' })}</span>
            ) : (
              <span>{formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(event.start_date)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            {event.is_online ? (
              <><Globe className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" /><span className="text-gray-600 font-medium">Online</span></>
            ) : (
              <><MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" /><span className="text-gray-600 font-medium truncate">{event.location_name || event.city || 'In Person'}</span></>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="min-w-0 flex-1">
            {event.churches ? (
              <p className="text-xs font-semibold text-gray-400 truncate">{event.churches.name}</p>
            ) : <span />}
          </div>
          {attendanceCount != null && attendanceCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
              <Users className="w-3 h-3" />
              {attendanceCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
