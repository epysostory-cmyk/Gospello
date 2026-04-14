import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, formatTime, CATEGORY_LABELS, CATEGORY_COLORS, cn } from '@/lib/utils'
import {
  Calendar, MapPin, Clock, Building2, Tag, ArrowLeft,
  Eye, Users, Car, Baby, StickyNote, Mic, Ticket,
} from 'lucide-react'
import type { Event } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import AttendButton from '@/components/ui/AttendButton'
import ViewTracker from '@/components/ui/ViewTracker'
import ShareButton from '@/components/ui/ShareButton'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('title, description, banner_url')
    .eq('slug', slug)
    .single()
  if (!data) return {}
  return {
    title: `${data.title} | Gospello`,
    description: data.description?.substring(0, 160),
    openGraph: { images: data.banner_url ? [data.banner_url] : [] },
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*, churches(*), profiles(*)')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (!event) notFound()

  const e = event as Event

  // Fetch attendance count via admin client (bypasses RLS)
  const adminClient = createAdminClient()
  const { count: attendanceCount } = await adminClient
    .from('attendances')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', e.id)

  // Related events
  const { data: related } = await supabase
    .from('events')
    .select('id, title, slug, start_date, city, category, banner_url, location_name')
    .eq('status', 'approved')
    .eq('category', e.category)
    .neq('id', e.id)
    .gte('start_date', new Date().toISOString())
    .limit(3)

  const categoryColor = CATEGORY_COLORS[e.category] ?? 'bg-gray-100 text-gray-800'
  const categoryLabel = CATEGORY_LABELS[e.category] ?? e.category
  const lifecycle = getEventLifecycle(e.start_date, e.end_date)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.vercel.app'
  const eventUrl = `${siteUrl}/events/${e.slug}`

  const lifecycleBadge = {
    upcoming: { label: 'Upcoming', cls: 'bg-indigo-100 text-indigo-700' },
    ongoing:  { label: 'Happening Now', cls: 'bg-green-100 text-green-700' },
    ended:    { label: 'Ended', cls: 'bg-gray-100 text-gray-500' },
  }[lifecycle]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Track view silently */}
      <ViewTracker eventId={e.id} />

      {/* Back */}
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Banner */}
          {e.banner_url ? (
            <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden">
              <Image src={e.banner_url} alt={e.title} fill className="object-cover" priority />
              <span className={cn('absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full', lifecycleBadge.cls)}>
                {lifecycleBadge.label}
              </span>
            </div>
          ) : (
            <div className="relative w-full h-52 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <span className="text-6xl font-bold text-indigo-200">{e.title[0]}</span>
              <span className={cn('absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full', lifecycleBadge.cls)}>
                {lifecycleBadge.label}
              </span>
            </div>
          )}

          {/* Category + Title */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-xs font-medium px-3 py-1 rounded-full', categoryColor)}>
                {categoryLabel}
              </span>
              {!e.is_free && (
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                  <Ticket className="w-3 h-3" /> Paid Event
                </span>
              )}
              {e.is_free && (
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                  Free Event
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-3 leading-tight">{e.title}</h1>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-gray-400" />
                {e.views_count ?? 0} views
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                {attendanceCount ?? 0} attending
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About this event</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{e.description}</p>
          </div>

          {/* Speakers */}
          {e.speakers && (
            <div className="bg-indigo-50 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-500" /> Guest Speakers
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">{e.speakers}</p>
            </div>
          )}

          {/* Logistics */}
          {(e.parking_available || e.child_friendly || e.notes) && (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Event Info</h3>
              <div className="flex flex-wrap gap-3">
                {e.parking_available && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                    <Car className="w-3.5 h-3.5 text-gray-400" /> Parking available
                  </span>
                )}
                {e.child_friendly && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                    <Baby className="w-3.5 h-3.5 text-gray-400" /> Child friendly
                  </span>
                )}
              </div>
              {e.notes && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <StickyNote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p>{e.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Hosted by church */}
          {e.churches && (
            <div className="bg-indigo-50 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Hosted by</h3>
              <Link href={`/churches/${e.churches.slug}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  {e.churches.logo_url ? (
                    <Image src={e.churches.logo_url} alt={e.churches.name} width={40} height={40} className="rounded-full object-cover" />
                  ) : (
                    <Building2 className="w-5 h-5 text-indigo-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {e.churches.name}
                  </p>
                  {e.churches.city && <p className="text-sm text-gray-500">{e.churches.city}</p>}
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Event details card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
            <h2 className="font-semibold text-gray-900">Event Details</h2>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{formatDate(e.start_date)}</p>
                {e.end_date && <p className="text-xs text-gray-500">Ends {formatDate(e.end_date)}</p>}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{formatTime(e.start_date)}</p>
                {e.end_date && <p className="text-xs text-gray-500">Ends {formatTime(e.end_date)}</p>}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{e.location_name}</p>
                {e.address && <p className="text-xs text-gray-500">{e.address}</p>}
                <p className="text-xs text-gray-500">{e.city}, {e.state}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', categoryColor)}>
                {categoryLabel}
              </span>
            </div>

            {lifecycle !== 'ended' && (
              <AttendButton
                eventId={e.id}
                eventTitle={e.title}
                isFree={e.is_free}
                externalLink={e.external_link}
                initialCount={attendanceCount ?? 0}
              />
            )}

            {lifecycle === 'ended' && (
              <div className="w-full text-center text-sm text-gray-400 py-3 bg-gray-50 rounded-xl">
                This event has ended
              </div>
            )}
          </div>

          {/* Share */}
          <ShareButton eventTitle={e.title} eventUrl={eventUrl} />
        </div>
      </div>

      {/* Related events */}
      {related && related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-5">More {categoryLabel} Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {(related as Event[]).map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all"
              >
                <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {ev.title}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(ev.start_date, { month: 'short', day: 'numeric' })} · {ev.city}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
