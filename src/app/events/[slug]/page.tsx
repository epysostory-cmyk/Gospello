import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, formatTime, CATEGORY_LABELS, CATEGORY_COLORS, cn } from '@/lib/utils'
import {
  Calendar, MapPin, Clock, Building2, Tag, ArrowLeft,
  Users, Car, Baby, StickyNote, Mic, Ticket, Globe, ChevronRight,
} from 'lucide-react'
import type { Event } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import AttendButton from '@/components/ui/AttendButton'
import ViewCounter from '@/components/ui/ViewCounter'
import CountdownTimer from '@/components/ui/CountdownTimer'
import ShareButton from '@/components/ui/ShareButton'
import SaveButton from '@/components/ui/SaveButton'
import EventQuickActions from './_components/EventQuickActions'
import DownloadFlyerButton from './_components/DownloadFlyerButton'
import { checkEventSaved } from '@/app/actions/saved-events'
import { checkUserAttended } from '@/app/actions/attendance'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('title, description, banner_url, start_date, city')
    .eq('slug', slug)
    .single()
  if (!data) return {}

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com'
  const pageUrl = `${siteUrl}/events/${slug}`
  const description = data.description?.substring(0, 160) ?? ''

  const ogImages = data.banner_url
    ? [
        {
          url: data.banner_url,
          width: 1200,
          height: 630,
          alt: data.title,
          type: 'image/jpeg',
        },
      ]
    : []

  return {
    // Use just the title — root layout template appends "| Gospello"
    title: data.title,
    description,
    openGraph: {
      title: data.title,
      description,
      url: pageUrl,
      type: 'article',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description,
      images: data.banner_url ? [data.banner_url] : [],
    },
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

  // Get current user server-side (passed to AttendButton to skip client-side auth fetch)
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Parallel data fetches
  const adminClient = createAdminClient()
  const [
    { count: attendanceCount },
    isEventSaved,
    initialAttended,
    { data: relatedCat },
    { data: relatedCity },
  ] = await Promise.all([
    adminClient
      .from('attendances')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', e.id),
    checkEventSaved(e.id),
    checkUserAttended(e.id),
    supabase
      .from('events')
      .select('id, title, slug, start_date, city, category, banner_url, location_name, is_free')
      .eq('status', 'approved')
      .eq('category', e.category)
      .neq('id', e.id)
      .gte('start_date', new Date().toISOString())
      .limit(2),
    supabase
      .from('events')
      .select('id, title, slug, start_date, city, category, banner_url, location_name, is_free')
      .eq('status', 'approved')
      .eq('city', e.city)
      .neq('category', e.category)
      .neq('id', e.id)
      .gte('start_date', new Date().toISOString())
      .limit(1),
  ])

  // Merge and deduplicate related events
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com'
  const eventUrl = `${siteUrl}/events/${e.slug}`

  const lifecycleBadge = {
    upcoming: { label: 'Upcoming',        cls: 'bg-indigo-500/90 text-white' },
    ongoing:  { label: 'Happening Now 🔴', cls: 'bg-emerald-500/90 text-white' },
    ended:    { label: 'Ended',            cls: 'bg-gray-500/80 text-white' },
  }[lifecycle]

  const safeAttendance = attendanceCount ?? 0
  const almostFull = e.capacity != null && safeAttendance >= e.capacity * 0.8
  const capacityPct = e.capacity != null && e.capacity > 0
    ? Math.min(Math.round((safeAttendance / e.capacity) * 100), 100)
    : 0
  const capacityBarColor =
    capacityPct >= 90 ? 'bg-red-500' :
    capacityPct >= 70 ? 'bg-amber-500' :
    'bg-emerald-500'

  const galleryUrls = e.gallery_urls ?? []

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── FULL-WIDTH HERO ──────────────────────────────────── */}
      <div className="relative w-full min-h-[300px] max-h-[640px] overflow-hidden bg-slate-900" style={{ aspectRatio: 'auto' }}>
        {e.banner_url ? (
          <>
            {/* Blurred background fill — covers side/top gaps from portrait flyers */}
            <Image
              src={e.banner_url}
              alt=""
              fill
              className="object-cover scale-110 blur-2xl opacity-25 pointer-events-none select-none"
              aria-hidden
              priority
            />
            {/* Full flyer — object-contain shows the entire image without cropping */}
            <Image
              src={e.banner_url}
              alt={e.title}
              fill
              className="object-contain"
              priority
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900" />
        )}

        {/* Gradient overlay — strong at bottom, subtle at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

        {/* Back button — top left */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-white/90 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>

        {/* Badges — top right */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 flex-wrap justify-end">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm ${lifecycleBadge.cls}`}>
            {lifecycleBadge.label}
          </span>
          {almostFull && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500 text-white">
              Almost Full
            </span>
          )}
        </div>

        {/* Bottom overlay — category + title + quick info */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6 pt-16">
          {/* Category + free/paid + online chips */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', categoryColor)}>
              {categoryLabel}
            </span>
            {e.is_free ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white">
                Free
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/90 text-white flex items-center gap-1">
                <Ticket className="w-3 h-3" /> Paid
              </span>
            )}
            {e.is_online && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-500/90 text-white flex items-center gap-1">
                <Globe className="w-3 h-3" /> Online
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-3 drop-shadow-sm">
            {e.title}
          </h1>

          {/* Quick info strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              {formatDate(e.start_date, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              {formatTime(e.start_date)}
            </span>
            {!e.is_online && e.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                {e.location_name}, {e.city}
              </span>
            )}
            {safeAttendance > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                {safeAttendance} attending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT COLUMN ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tags + Countdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
              {e.tags && e.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {e.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {lifecycle === 'upcoming' && (
                <CountdownTimer startDate={e.start_date} />
              )}

              {/* Views */}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <ViewCounter eventId={e.id} initialCount={e.views_count ?? 0} />
                {safeAttendance > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {safeAttendance} {safeAttendance === 1 ? 'person' : 'people'} attending
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-3">About this event</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                {e.description}
              </p>
            </div>

            {/* Gallery */}
            {galleryUrls.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-3">Gallery</h2>
                <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
                  {galleryUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-48 h-32 flex-shrink-0 rounded-xl overflow-hidden snap-start"
                    >
                      <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speakers */}
            {e.speakers && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Mic className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  Guest Speakers
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{e.speakers}</p>
              </div>
            )}

            {/* Logistics */}
            {(e.parking_available || e.child_friendly || e.notes) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-3">Event Info</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {e.parking_available && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      <Car className="w-3.5 h-3.5 text-gray-400" /> Parking available
                    </span>
                  )}
                  {e.child_friendly && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      <Baby className="w-3.5 h-3.5 text-gray-400" /> Child friendly
                    </span>
                  )}
                </div>
                {e.notes && (
                  <div className="flex items-start gap-2.5 text-sm text-gray-600 bg-amber-50 px-4 py-3 rounded-xl border border-amber-100">
                    <StickyNote className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p>{e.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Hosted by church */}
            {e.churches && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-3">Hosted by</h3>
                <Link
                  href={`/churches/${e.churches.slug}`}
                  className="flex items-center gap-3.5 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {e.churches.logo_url ? (
                      <Image
                        src={e.churches.logo_url}
                        alt={e.churches.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <Building2 className="w-5 h-5 text-indigo-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {e.churches.name}
                    </p>
                    {e.churches.city && (
                      <p className="text-sm text-gray-500">{e.churches.city}, {e.churches.state}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </Link>
              </div>
            )}

            {/* Organizer */}
            {e.profiles && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-3">About the Organizer</h3>
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-black text-indigo-600 text-lg">
                      {e.profiles.display_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{e.profiles.display_name}</p>
                    <p className="text-sm text-gray-500 capitalize">{e.profiles.account_type}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">

              {/* Event Details + CTA card */}
              <div id="attend" className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5 shadow-sm">
                <h2 className="font-bold text-gray-900">Event Details</h2>

                {/* Date */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(e.start_date)}</p>
                    {e.end_date && (
                      <p className="text-xs text-gray-500 mt-0.5">Ends {formatDate(e.end_date)}</p>
                    )}
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{formatTime(e.start_date)}</p>
                    {e.end_date && (
                      <p className="text-xs text-gray-500 mt-0.5">Ends {formatTime(e.end_date)}</p>
                    )}
                  </div>
                </div>

                {/* Location — Online vs Physical */}
                {e.is_online ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-sky-500" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-gray-900">
                        {e.online_platform ?? 'Online Event'}
                      </p>
                      <p className="text-xs text-gray-500">Online Event</p>
                      {e.online_link && lifecycle !== 'ended' && (
                        <a
                          href={e.online_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                        >
                          <Globe className="w-3 h-3" /> Join Event
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{e.location_name}</p>
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

                {/* Category */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', categoryColor)}>
                    {categoryLabel}
                  </span>
                </div>

                {/* Price */}
                {!e.is_free && e.price != null && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Ticket className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {e.currency} {e.price.toLocaleString()}
                      </p>
                      {e.payment_link && (
                        <a
                          href={e.payment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          View payment page →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Capacity tracker */}
                {e.capacity != null && e.capacity > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        Capacity
                      </span>
                      <span className="font-semibold">{safeAttendance} / {e.capacity}</span>
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

                {/* ── ATTEND CTA ────────────────────────────── */}
                {lifecycle !== 'ended' ? (
                  <AttendButton
                    eventId={e.id}
                    eventTitle={e.title}
                    isFree={e.is_free}
                    rsvpRequired={e.rsvp_required}
                    paymentLink={e.payment_link}
                    initialCount={safeAttendance}
                    initialAttended={initialAttended}
                    serverUserId={currentUser?.id ?? null}
                    serverUserName={currentUser?.user_metadata?.display_name ?? null}
                    serverUserEmail={currentUser?.email ?? null}
                  />
                ) : (
                  <div className="w-full text-center text-sm text-gray-400 py-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    This event has ended
                  </div>
                )}
              </div>

              {/* Share */}
              <ShareButton eventTitle={e.title} eventUrl={eventUrl} />

              {/* Save */}
              <SaveButton eventId={e.id} eventTitle={e.title} initialSaved={isEventSaved} />

              {/* Download flyer */}
              {e.banner_url && (
                <DownloadFlyerButton bannerUrl={e.banner_url} eventTitle={e.title} />
              )}

            </div>
          </div>
        </div>

        {/* ── RELATED EVENTS ───────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">More Events You&apos;ll Love</h2>
              <Link
                href="/events"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/events/${ev.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="relative w-full h-36 bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden">
                    {ev.banner_url && (
                      <Image
                        src={ev.banner_url}
                        alt={ev.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute top-3 right-3">
                      {ev.is_free ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500 text-white">Free</span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500 text-white">Paid</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 text-sm leading-snug">
                      {ev.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(ev.start_date, { month: 'short', day: 'numeric' })} · {ev.city}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE STICKY BOTTOM BAR ────────────────────────── */}
      <EventQuickActions
        eventId={e.id}
        eventTitle={e.title}
        eventDate={formatDate(e.start_date, { month: 'short', day: 'numeric' })}
        eventUrl={eventUrl}
        initialSaved={isEventSaved}
        isFree={e.is_free}
        rsvpRequired={e.rsvp_required}
        lifecycle={lifecycle}
      />
    </div>
  )
}
