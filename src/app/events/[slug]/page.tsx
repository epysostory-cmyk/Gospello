import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import BackButton from '@/components/ui/BackButton'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { formatDate, formatTime, cn } from '@/lib/utils'
import { getCategoryMap } from '@/lib/categories'
import {
  Calendar, MapPin, Clock, Building2, Globe, ChevronRight, ChevronLeft,
  Car, Baby, StickyNote, Mic, Ticket, Users,
} from 'lucide-react'
import type { DaySchedule } from '@/types/database'

function fmt12(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function fmtScheduleDay(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NG', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'Africa/Lagos',
  })
}

import type { Event } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import RegistrationButton from '@/components/ui/RegistrationButton'
import SaveButton from '@/components/ui/SaveButton'
import ViewCounter from '@/components/ui/ViewCounter'
import ShareButton from '@/components/ui/ShareButton'
import SaveFlyerButton from '@/components/ui/SaveFlyerButton'
import EventQuickActions from './_components/EventQuickActions'
import HaveAnEventCTA from '@/components/ui/HaveAnEventCTA'
import CountdownTimer from '@/components/ui/CountdownTimer'
import AddToCalendar from './_components/AddToCalendar'
import ReadMoreText from './_components/ReadMoreText'
import { EventStatusBadge } from './_components/EventStatusBadge'
import EventTimezone from './_components/EventTimezone'
import { checkUserAttended } from '@/app/actions/attendance'
import { checkEventSaved } from '@/app/actions/saved-events'

export const dynamic = 'force-dynamic'

type EventWithRelations = Event & {
  seeded_organizers?: {
    slug: string
    name: string
    logo_url?: string | null
    city?: string | null
    state?: string | null
  } | null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const QUERY_COLS = 'title, description, banner_url, start_date, end_date, city, state, is_free, location_name'
  type EventMeta = {
    title: string; description: string | null; banner_url: string | null
    start_date: string; end_date: string | null
    city: string | null; state: string | null
    is_free: boolean; location_name: string | null
  }
  let data: EventMeta | null = null
  try {
    const admin = createAdminClient()
    const { data: adminData, error } = await admin
      .from('events').select(QUERY_COLS).eq('slug', slug).eq('status', 'approved').maybeSingle()
    if (!error && adminData) data = adminData as EventMeta
  } catch { /* ignore */ }

  if (!data) {
    try {
      const anon = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: anonData } = await anon.from('events').select(QUERY_COLS).eq('slug', slug).eq('status', 'approved').maybeSingle()
      data = anonData as EventMeta | null
    } catch { /* ignore */ }
  }
  if (!data) return {}

  const siteUrl   = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
  const pageUrl   = `${siteUrl}/events/${slug}`
  const dateStr   = formatDate(data.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const venueLine = data.location_name ? `${data.location_name}, ${data.city}` : [data.city, data.state].filter(Boolean).join(', ')
  const ogDescription = data.description
    ? data.description.slice(0, 200)
    : `${dateStr ? `${dateStr} · ` : ''}${venueLine}${data.is_free ? ' · Free Event' : ''}`

  return {
    title: data.title,
    description: ogDescription,
    openGraph: {
      title: `${data.title} | Gospello`,
      description: ogDescription,
      url: pageUrl,
      type: 'article',
      siteName: 'Gospello',
      images: data.banner_url ? [{ url: data.banner_url, width: 1200, height: 630, alt: data.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@gospello',
      title: `${data.title} | Gospello`,
      description: ogDescription,
      images: data.banner_url ? [{ url: data.banner_url, width: 1200, height: 630, alt: data.title }] : [],
    },
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select('*, churches(*), profiles(*), seeded_organizers(*)')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (!event) notFound()

  const e = event as EventWithRelations

  const [
    { count: attendanceCount },
    initialAttended,
    initialSaved,
    { data: relatedCat },
    { data: relatedCity },
    { count: organizerEventCount },
  ] = await Promise.all([
    adminClient.from('attendances').select('id', { count: 'exact', head: true }).eq('event_id', e.id),
    checkUserAttended(e.id),
    checkEventSaved(e.id),
    supabase.from('events').select('id, title, slug, start_date, city, category, banner_url, location_name, is_free')
      .eq('status', 'approved').eq('category', e.category).neq('id', e.id)
      .gte('start_date', new Date().toISOString()).limit(2),
    supabase.from('events').select('id, title, slug, start_date, city, category, banner_url, location_name, is_free')
      .eq('status', 'approved').eq('city', e.city).neq('category', e.category).neq('id', e.id)
      .gte('start_date', new Date().toISOString()).limit(1),
    e.church_id
      ? adminClient.from('events').select('id', { count: 'exact', head: true }).eq('church_id', e.church_id).eq('status', 'approved')
      : e.seeded_organizer_id
      ? adminClient.from('events').select('id', { count: 'exact', head: true }).eq('seeded_organizer_id', e.seeded_organizer_id).eq('status', 'approved')
      : adminClient.from('events').select('id', { count: 'exact', head: true }).eq('organizer_id', e.organizer_id).eq('status', 'approved'),
  ])

  const seenIds = new Set<string>()
  const related: Event[] = []
  for (const ev of [...(relatedCat ?? []), ...(relatedCity ?? [])]) {
    if (!seenIds.has(ev.id)) { seenIds.add(ev.id); related.push(ev as Event) }
  }

  const catMap       = await getCategoryMap()
  const catInfo      = catMap[e.category]
  const categoryLabel = catInfo?.name ?? e.category
  const categoryColor = catInfo?.color ?? '#6B7280'
  const lifecycle    = getEventLifecycle(e.start_date, e.end_date)
  const siteUrl      = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
  const eventUrl     = `${siteUrl}/events/${e.slug}`
  const safeAttendance = attendanceCount ?? 0
  const mapsQuery    = encodeURIComponent(`${e.location_name} ${e.city} ${e.state}`)
  const shareEventDate = formatDate(e.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const shareEventLocation = e.is_online ? 'Online Event' : `${e.location_name}, ${e.city}`
  const almostFull   = e.capacity != null && safeAttendance >= e.capacity * 0.8
  const capacityPct  = e.capacity != null && e.capacity > 0 ? Math.min(Math.round((safeAttendance / e.capacity) * 100), 100) : 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    description: e.description ?? undefined,
    startDate: e.start_date,
    endDate: e.end_date ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: e.is_online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
    location: e.is_online
      ? { '@type': 'VirtualLocation', url: e.online_link ?? eventUrl }
      : { '@type': 'Place', name: e.location_name, address: { '@type': 'PostalAddress', streetAddress: e.address ?? undefined, addressLocality: e.city, addressRegion: e.state, addressCountry: e.country } },
    image: e.banner_url ? [e.banner_url] : undefined,
    organizer: { '@type': 'Organization', name: e.churches?.name ?? e.seeded_organizers?.name ?? e.profiles?.display_name ?? 'Gospello', url: eventUrl },
    offers: { '@type': 'Offer', price: e.is_free ? '0' : String(e.price ?? 0), priceCurrency: e.currency ?? 'NGN', availability: 'https://schema.org/InStock', url: e.payment_link ?? eventUrl },
  }

  function OrganizerCard() {
    const org = e.churches
      ? { href: `/churches/${e.churches.slug}`, name: e.churches.name, img: e.churches.logo_url, sub: `${e.churches.city ?? ''} · ${organizerEventCount ?? 0} events`, verified: e.churches.verified_badge, icon: <Building2 className="w-4 h-4 text-gray-400" /> }
      : e.seeded_organizers
      ? { href: `/organizers/${e.seeded_organizers.slug}`, name: e.seeded_organizers.name, img: e.seeded_organizers.logo_url, sub: `${e.seeded_organizers.city ?? ''} · ${organizerEventCount ?? 0} events`, verified: false, icon: null }
      : e.profiles
      ? { href: `/organizers/${e.profiles.id}`, name: e.profiles.display_name, img: e.profiles.avatar_url, sub: `${organizerEventCount ?? 0} events`, verified: true, icon: null }
      : null
    if (!org) return null
    return (
      <Link href={org.href} className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          {org.img
            ? <Image src={org.img} alt="" width={40} height={40} className="object-cover w-full h-full" />
            : <div className="w-full h-full flex items-center justify-center">{org.icon ?? <span className="font-bold text-gray-500 text-sm">{org.name?.[0]?.toUpperCase()}</span>}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{org.name}</p>
          <p className="text-xs text-gray-400">{org.sub}</p>
        </div>
        <span className="text-xs text-indigo-600 font-semibold group-hover:underline">View →</span>
      </Link>
    )
  }

  function RelatedEvents() {
    if (!related.length) return null
    return (
      <section>
        <p className="text-sm font-semibold text-gray-900 mb-3">More events</p>
        <div className="grid grid-cols-2 gap-2.5">
          {related.slice(0, 4).map(ev => (
            <Link key={ev.id} href={`/events/${ev.slug}`} className="group block rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-colors">
              <div className="aspect-square relative bg-gray-100">
                {ev.banner_url
                  ? <Image src={ev.banner_url} alt={ev.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-300 text-2xl font-bold">{ev.title[0]}</div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-[11px] font-semibold line-clamp-2 leading-snug">{ev.title}</p>
                  <p className="text-white/60 text-[10px] mt-0.5">{formatDate(ev.start_date, { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ═══ MOBILE ═══════════════════════════════════════════════ */}
      <div className="lg:hidden">

        {/* Hero image */}
        <div className="relative w-full" style={{ height: 'min(72svh, 600px)' }}>
          <div className="absolute inset-0">
            {e.banner_url
              ? <Image src={e.banner_url} alt={e.title} fill className="object-cover" priority />
              : <div className="absolute inset-0 bg-gray-900" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
          </div>

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
            <BackButton />
            <SaveButton eventId={e.id} eventTitle={e.title} initialSaved={initialSaved}
              serverUserId={currentUser?.id ?? null} variant="icon" size="md" />
          </div>

          {/* Title block at bottom */}
          <div className="absolute bottom-8 left-0 right-0 px-5">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <EventStatusBadge startDate={e.start_date} endDate={e.end_date} />
              {e.is_free
                ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white">Free</span>
                : <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">Paid</span>}
              {almostFull && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-500 text-white">Almost Full</span>}
            </div>
            <h1 className="text-2xl font-bold text-white leading-snug mb-2">{e.title}</h1>
            <div className="flex flex-col gap-1 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                {e.daily_schedule?.length
                  ? `${fmtScheduleDay(e.daily_schedule[0].date)} – ${fmtScheduleDay(e.daily_schedule[e.daily_schedule.length - 1].date)}`
                  : formatDate(e.start_date, { weekday: 'short', month: 'long', day: 'numeric' })}
                {' · '}{e.daily_schedule?.length ? fmt12(e.daily_schedule[0].start_time) : formatTime(e.start_date)}
              </span>
              {!e.is_online && e.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {[e.location_name, e.city].filter(Boolean).join(', ')}
                </span>
              )}
              {e.is_online && (
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                  {e.online_platform ?? 'Online Event'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pt-6 pb-40 space-y-7">

          {/* Stats row */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              {safeAttendance > 0 && <><Users className="w-4 h-4" /><span><strong className="text-gray-900">{safeAttendance}</strong> going</span></>}
            </div>
            <ViewCounter eventId={e.id} initialCount={e.views_count ?? 0} />
          </div>

          {/* Countdown */}
          {lifecycle === 'upcoming' && (
            <div className="text-sm text-gray-500">
              Starts in: <CountdownTimer startDate={e.start_date} />
            </div>
          )}

          {/* CTA */}
          <div id="attend">
            {lifecycle !== 'ended' ? (
              <RegistrationButton
                event={{ id: e.id, registration_type: e.registration_type, price: e.price, payment_link: e.payment_link, rsvp_required: e.rsvp_required, is_free: e.is_free, title: e.title }}
                userId={currentUser?.id ?? null}
                userName={currentUser?.user_metadata?.display_name ?? null}
                userEmail={currentUser?.email ?? null}
                isOrganizer={!!currentUser && currentUser.id === e.organizer_id}
                initialRegistered={initialAttended}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center py-3 border border-gray-100 rounded-xl">This event has ended</p>
            )}
          </div>

          {/* Price */}
          {!e.is_free && e.price != null && (
            <div className="flex items-center gap-2 text-sm">
              <Ticket className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900">{e.currency} {e.price.toLocaleString()}</span>
              {e.payment_link && <a href={e.payment_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-xs hover:underline ml-auto">Payment page →</a>}
            </div>
          )}

          {/* Capacity */}
          {e.capacity != null && e.capacity > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{safeAttendance} / {e.capacity} spots taken</span>
                <span className={capacityPct >= 90 ? 'text-red-500 font-semibold' : capacityPct >= 70 ? 'text-amber-500 font-semibold' : 'text-emerald-600 font-semibold'}>{capacityPct}% full</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${capacityPct}%` }} />
              </div>
            </div>
          )}

          {/* Multi-day schedule */}
          {(e.daily_schedule?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Schedule</p>
              <div className="space-y-2">
                {e.daily_schedule!.map((day: DaySchedule, idx: number) => (
                  <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{fmtScheduleDay(day.date)}</span>
                    </div>
                    <span className="text-sm text-gray-500 tabular-nums">{fmt12(day.start_time)}{day.end_time ? ` – ${fmt12(day.end_time)}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          {e.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">About</p>
              <ReadMoreText text={e.description} limit={280} />
            </div>
          )}

          {/* Speakers */}
          {e.speakers && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ministers &amp; Speakers</p>
              <p className="text-sm text-gray-700 leading-relaxed">{e.speakers}</p>
            </div>
          )}

          {/* Livestream */}
          {e.livestream_url && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-gray-400" />
              <a href={e.livestream_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium hover:underline">Watch Livestream →</a>
            </div>
          )}

          {/* Location map link */}
          {!e.is_online && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Venue</p>
              <p className="text-sm font-medium text-gray-900">{e.location_name}</p>
              {e.address && <p className="text-sm text-gray-500">{e.address}</p>}
              <p className="text-sm text-gray-500">{e.city}, {e.state}</p>
              <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline mt-1 inline-block">Open in Google Maps →</a>
            </div>
          )}

          {/* Amenities */}
          {(e.parking_available || e.child_friendly) && (
            <div className="flex gap-3">
              {e.parking_available && <span className="flex items-center gap-1.5 text-sm text-gray-600"><Car className="w-4 h-4 text-gray-400" /> Parking</span>}
              {e.child_friendly && <span className="flex items-center gap-1.5 text-sm text-gray-600"><Baby className="w-4 h-4 text-gray-400" /> Child friendly</span>}
            </div>
          )}

          {/* Notes */}
          {e.notes && (
            <div className="flex items-start gap-2.5 text-sm text-gray-600 border-l-2 border-amber-300 pl-3">
              <p>{e.notes}</p>
            </div>
          )}

          {/* Tags */}
          {(e.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {e.tags!.map(tag => (
                <span key={tag} className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          {/* Add to calendar + save flyer */}
          <div className="flex flex-wrap gap-2">
            <AddToCalendar title={e.title} startDate={e.start_date} endDate={e.end_date} location={shareEventLocation} description={e.description} />
            {e.banner_url && <SaveFlyerButton bannerUrl={e.banner_url} eventTitle={e.title} />}
            {e.timezone && e.timezone !== 'UTC' && <EventTimezone timezone={e.timezone} startDate={e.start_date} />}
          </div>

          {/* Share */}
          <ShareButton eventTitle={e.title} eventUrl={eventUrl} eventDate={shareEventDate}
            eventLocation={shareEventLocation} eventDescription={e.description ?? ''} bannerUrl={e.banner_url} />

          <hr className="border-gray-100" />

          {/* Organizer */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Hosted by</p>
            {OrganizerCard()}
          </div>

          <hr className="border-gray-100" />

          {RelatedEvents()}

          <HaveAnEventCTA />
        </div>
      </div>

      {/* ═══ DESKTOP ═══════════════════════════════════════════════ */}
      <div className="hidden lg:block max-w-5xl mx-auto px-6 lg:px-8 pb-16 pt-6">

        <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Events
        </Link>

        <div className="flex gap-10">

          {/* Left */}
          <div className="flex-1 min-w-0">

            {/* Banner */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-6">
              {e.banner_url
                ? <Image src={e.banner_url} alt={e.title} fill className="object-cover" priority />
                : <div className="absolute inset-0 bg-gray-200" />}
            </div>

            {/* Title + meta */}
            <div className="flex items-start justify-between gap-4 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <EventStatusBadge startDate={e.start_date} endDate={e.end_date} />
                {e.is_free
                  ? <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Free</span>
                  : <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">Paid</span>}
                {almostFull && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">Almost Full</span>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {e.banner_url && <SaveFlyerButton bannerUrl={e.banner_url} eventTitle={e.title} />}
                <SaveButton eventId={e.id} eventTitle={e.title} initialSaved={initialSaved}
                  serverUserId={currentUser?.id ?? null} variant="button" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 leading-snug mt-3 mb-3">{e.title}</h1>

            {/* Date / location / views row */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 mb-6">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                {e.daily_schedule?.length
                  ? `${fmtScheduleDay(e.daily_schedule[0].date)} – ${fmtScheduleDay(e.daily_schedule[e.daily_schedule.length - 1].date)}`
                  : formatDate(e.start_date, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                {e.daily_schedule?.length ? fmt12(e.daily_schedule[0].start_time) : formatTime(e.start_date)}
                {e.timezone && e.timezone !== 'UTC' && <EventTimezone timezone={e.timezone} startDate={e.start_date} />}
              </span>
              {!e.is_online && (e.location_name || e.city) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {[e.location_name, e.city].filter(Boolean).join(', ')}
                </span>
              )}
              {e.is_online && (
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {e.online_platform ?? 'Online Event'}
                </span>
              )}
              {safeAttendance > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  {safeAttendance} going
                </span>
              )}
              <ViewCounter eventId={e.id} initialCount={e.views_count ?? 0} />
            </div>

            <hr className="border-gray-100 mb-6" />

            {/* Schedule */}
            {(e.daily_schedule?.length ?? 0) > 0 && (
              <div className="mb-7">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Schedule · {e.daily_schedule!.length} days</p>
                <div className="space-y-0">
                  {e.daily_schedule!.map((day: DaySchedule, idx: number) => (
                    <div key={day.date} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4 font-bold">{idx + 1}</span>
                        <span className="text-sm font-medium text-gray-900">{fmtScheduleDay(day.date)}</span>
                      </div>
                      <span className="text-sm text-gray-500 tabular-nums">{fmt12(day.start_time)}{day.end_time ? ` – ${fmt12(day.end_time)}` : ''}</span>
                    </div>
                  ))}
                </div>
                <hr className="border-gray-100 mt-6 mb-6" />
              </div>
            )}

            {/* About */}
            {e.description && (
              <div className="mb-7">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">About this event</p>
                <ReadMoreText text={e.description} limit={400} />
                <hr className="border-gray-100 mt-6" />
              </div>
            )}

            {/* Speakers */}
            {e.speakers && (
              <div className="mb-7">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ministers &amp; Speakers</p>
                <p className="text-sm text-gray-700 leading-relaxed">{e.speakers}</p>
                <hr className="border-gray-100 mt-6" />
              </div>
            )}

            {/* Livestream */}
            {e.livestream_url && (
              <div className="mb-7">
                <a href={e.livestream_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline">
                  <Globe className="w-4 h-4" /> Watch Livestream →
                </a>
                <hr className="border-gray-100 mt-6" />
              </div>
            )}

            {/* Venue */}
            {!e.is_online && (
              <div className="mb-7">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Venue</p>
                <p className="text-sm font-medium text-gray-900">{e.location_name}</p>
                {e.address && <p className="text-sm text-gray-500">{e.address}</p>}
                <p className="text-sm text-gray-500">{e.city}, {e.state}</p>
                <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline mt-1 inline-block">Open in Google Maps →</a>
                <hr className="border-gray-100 mt-6" />
              </div>
            )}

            {/* Amenities + notes */}
            {(e.parking_available || e.child_friendly || e.notes) && (
              <div className="mb-7 space-y-3">
                {(e.parking_available || e.child_friendly) && (
                  <div className="flex gap-4">
                    {e.parking_available && <span className="flex items-center gap-1.5 text-sm text-gray-600"><Car className="w-4 h-4 text-gray-400" /> Parking available</span>}
                    {e.child_friendly && <span className="flex items-center gap-1.5 text-sm text-gray-600"><Baby className="w-4 h-4 text-gray-400" /> Child friendly</span>}
                  </div>
                )}
                {e.notes && (
                  <p className="text-sm text-gray-600 border-l-2 border-amber-300 pl-3">{e.notes}</p>
                )}
                <hr className="border-gray-100" />
              </div>
            )}

            {/* Tags */}
            {(e.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 mb-7">
                {e.tags!.map(tag => <span key={tag} className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full">#{tag}</span>)}
              </div>
            )}

            {/* Hosted by */}
            <div className="mb-7">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Hosted by</p>
              {OrganizerCard()}
            </div>

            <hr className="border-gray-100 mb-6" />
            {RelatedEvents()}
            <HaveAnEventCTA />
          </div>

          {/* Right sidebar */}
          <div className="w-[300px] flex-shrink-0">
            <div className="sticky top-6 space-y-5">

              {/* CTA card */}
              <div className="border border-gray-200 rounded-2xl p-5 space-y-3">
                {safeAttendance > 0 && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span><strong className="text-gray-900">{safeAttendance}</strong> {safeAttendance === 1 ? 'person' : 'people'} going</span>
                  </p>
                )}
                {lifecycle !== 'ended' ? (
                  <RegistrationButton
                    event={{ id: e.id, registration_type: e.registration_type, price: e.price, payment_link: e.payment_link, rsvp_required: e.rsvp_required, is_free: e.is_free, title: e.title }}
                    userId={currentUser?.id ?? null}
                    userName={currentUser?.user_metadata?.display_name ?? null}
                    userEmail={currentUser?.email ?? null}
                    isOrganizer={!!currentUser && currentUser.id === e.organizer_id}
                    initialRegistered={initialAttended}
                  />
                ) : (
                  <p className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded-xl">This event has ended</p>
                )}
                {lifecycle !== 'ended' && (
                  <>
                    {lifecycle === 'upcoming' && <CountdownTimer startDate={e.start_date} />}
                    <AddToCalendar title={e.title} startDate={e.start_date} endDate={e.end_date} location={shareEventLocation} description={e.description} />
                  </>
                )}
              </div>

              {/* Details list */}
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {e.daily_schedule?.length
                        ? `${fmtScheduleDay(e.daily_schedule[0].date)} – ${fmtScheduleDay(e.daily_schedule[e.daily_schedule.length - 1].date)}`
                        : formatDate(e.start_date, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-gray-500">
                      {e.daily_schedule?.length ? fmt12(e.daily_schedule[0].start_time) : formatTime(e.start_date)}
                      {e.end_date && !e.daily_schedule?.length ? ` – ${formatTime(e.end_date)}` : ''}
                    </p>
                  </div>
                </div>

                {!e.is_online ? (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{e.location_name}</p>
                      <p className="text-gray-500">{e.city}, {e.state}</p>
                      <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline">Open in Maps →</a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{e.online_platform ?? 'Online Event'}</p>
                      {e.online_link && <a href={e.online_link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">Join →</a>}
                    </div>
                  </div>
                )}

                {!e.is_free && e.price != null && (
                  <div className="flex items-center gap-3">
                    <Ticket className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{e.currency} {e.price.toLocaleString()}</p>
                      {e.payment_link && <a href={e.payment_link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">Payment page →</a>}
                    </div>
                  </div>
                )}

                {e.capacity != null && e.capacity > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{safeAttendance} / {e.capacity} spots</span>
                      <span className={capacityPct >= 90 ? 'text-red-500 font-semibold' : 'text-gray-500'}>{capacityPct}% full</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${capacityPct}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Share */}
              <ShareButton eventTitle={e.title} eventUrl={eventUrl} eventDate={shareEventDate}
                eventLocation={shareEventLocation} eventDescription={e.description ?? ''} bannerUrl={e.banner_url} />
            </div>
          </div>

        </div>
      </div>

      <EventQuickActions
        eventId={e.id}
        eventTitle={e.title}
        eventDate={formatDate(e.start_date, { month: 'short', day: 'numeric' })}
        eventUrl={eventUrl}
        isFree={e.is_free}
        rsvpRequired={e.rsvp_required}
        lifecycle={lifecycle}
        attendanceCount={safeAttendance}
        registrationType={e.registration_type}
        isOrganizer={!!currentUser && currentUser.id === e.organizer_id}
        initialAttended={initialAttended}
      />
    </div>
  )
}
