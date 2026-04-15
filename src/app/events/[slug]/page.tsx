import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, formatTime, CATEGORY_LABELS, CATEGORY_COLORS, cn } from '@/lib/utils'
import {
  Calendar, MapPin, Clock, Building2, Tag, ArrowLeft,
  Users, Car, Baby, StickyNote, Mic, Ticket, Globe,
} from 'lucide-react'
import type { Event } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import AttendButton from '@/components/ui/AttendButton'
import ViewCounter from '@/components/ui/ViewCounter'
import ShareButton from '@/components/ui/ShareButton'
import CountdownTimer from '@/components/ui/CountdownTimer'

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

  // Related events — mix: up to 2 same category + 1 same city
  const [{ data: relatedCat }, { data: relatedCity }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, slug, start_date, city, category, banner_url, location_name')
      .eq('status', 'approved')
      .eq('category', e.category)
      .neq('id', e.id)
      .gte('start_date', new Date().toISOString())
      .limit(2),
    supabase
      .from('events')
      .select('id, title, slug, start_date, city, category, banner_url, location_name')
      .eq('status', 'approved')
      .eq('city', e.city)
      .neq('category', e.category)
      .neq('id', e.id)
      .gte('start_date', new Date().toISOString())
      .limit(1),
  ])

  // Merge and deduplicate
  const seenIds = new Set<string>()
  const related: Event[] = []
  for (const ev of [...(relatedCat ?? []), ...(relatedCity ?? [])]) {
    if (!seenIds.has(ev.id)) {
      seenIds.add(ev.id)
      related.push(ev as Event)
    }
  }

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

  const safeAttendance = attendanceCount ?? 0
  const almostFull = e.capacity != null && safeAttendance >= e.capacity * 0.8

  // Capacity bar color
  const capacityPct = e.capacity != null && e.capacity > 0
    ? Math.min(Math.round((safeAttendance / e.capacity) * 100), 100)
    : 0
  const capacityBarColor =
    capacityPct >= 90 ? 'bg-red-500' :
    capacityPct >= 70 ? 'bg-amber-500' :
    'bg-green-500'

  const galleryUrls = e.gallery_urls ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              {almostFull && (
                <span className="absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500 text-white">
                  Almost Full
                </span>
              )}
            </div>
          ) : (
            <div className="relative w-full h-52 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <span className="text-6xl font-bold text-indigo-200">{e.title[0]}</span>
              <span className={cn('absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full', lifecycleBadge.cls)}>
                {lifecycleBadge.label}
              </span>
              {almostFull && (
                <span className="absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500 text-white">
                  Almost Full
                </span>
              )}
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
              {e.is_online && (
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Online
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-3 leading-tight">{e.title}</h1>

            {/* Tags */}
            {e.tags && e.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {e.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Countdown */}
            {lifecycle === 'upcoming' && (
              <div className="mt-2">
                <CountdownTimer startDate={e.start_date} />
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <ViewCounter eventId={e.id} initialCount={e.views_count ?? 0} />
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                {safeAttendance} attending
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About this event</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{e.description}</p>
          </div>

          {/* Gallery */}
          {galleryUrls.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Gallery</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {galleryUrls.map((url, i) => (
                  <div key={i} className="relative w-40 h-28 flex-shrink-0 rounded-xl overflow-hidden">
                    <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Organizer */}
          {e.profiles && (
            <div className="mt-8 bg-gray-50 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3">About the Organizer</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="font-bold text-indigo-600">{e.profiles.display_name?.[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{e.profiles.display_name}</p>
                  <p className="text-sm text-gray-500 capitalize">{e.profiles.account_type}</p>
                </div>
              </div>
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

            {/* Location — Online vs Physical */}
            {e.is_online ? (
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-gray-900">{e.online_platform ?? 'Online'}</p>
                  <p className="text-xs text-gray-500">Online Event</p>
                  {e.online_link && lifecycle !== 'ended' && (
                    <a
                      href={e.online_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Globe className="w-3 h-3" /> Join Event
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.location_name}</p>
                  {e.address && <p className="text-xs text-gray-500">{e.address}</p>}
                  <p className="text-xs text-gray-500">{e.city}, {e.state}</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${e.location_name} ${e.city} ${e.state}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <MapPin className="w-3 h-3" /> Open in Google Maps
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', categoryColor)}>
                {categoryLabel}
              </span>
            </div>

            {/* Price info */}
            {!e.is_free && e.price != null && (
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {e.currency} {e.price.toLocaleString()}
                  </p>
                  {e.payment_link && (
                    <a href={e.payment_link} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline">
                      Get tickets →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Capacity tracker */}
            {e.capacity != null && e.capacity > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                  <span>Capacity</span>
                  <span className="font-medium">{safeAttendance} / {e.capacity}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${capacityBarColor}`}
                    style={{ width: `${capacityPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{capacityPct}% full</p>
              </div>
            )}

            {lifecycle !== 'ended' && (
              <AttendButton
                eventId={e.id}
                eventTitle={e.title}
                isFree={e.is_free}
                externalLink={e.external_link}
                initialCount={safeAttendance}
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
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-5">More Events You Might Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
              >
                {ev.banner_url && (
                  <div className="relative w-full h-28 overflow-hidden">
                    <Image src={ev.banner_url} alt={ev.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-4">
                  <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {ev.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(ev.start_date, { month: 'short', day: 'numeric' })} · {ev.city}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
