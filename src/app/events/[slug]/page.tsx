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

/* "HH:MM" → "9:00 AM" */
function fmt12(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

/* "2026-05-04" → "Mon, 4 May" */
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
import { EventStatusBadge, EventDaysChip } from './_components/EventStatusBadge'
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

  // Try admin client first (bypasses RLS for unauthenticated scrapers).
  // If the service-role key is missing/wrong, admin silently returns null —
  // fall back to the anon/public client so approved events are still readable.
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
      .from('events')
      .select(QUERY_COLS)
      .eq('slug', slug)
      .eq('status', 'approved')
      .maybeSingle()
    if (!error && adminData) {
      data = adminData as EventMeta
    }
  } catch { /* ignore */ }

  if (!data) {
    // Fallback: approved events are public-readable via anon key
    try {
      const anon = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data: anonData } = await anon
        .from('events')
        .select(QUERY_COLS)
        .eq('slug', slug)
        .eq('status', 'approved')
        .maybeSingle()
      data = anonData as EventMeta | null
    } catch { /* ignore */ }
  }

  if (!data) return {}

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
  const pageUrl = `${siteUrl}/events/${slug}`

  const dateStr    = formatDate(data.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const venueLine  = data.location_name ? `${data.location_name}, ${data.city}` : [data.city, data.state].filter(Boolean).join(', ')
  const caption    = `Hey 👋 Check out this gospel event I found on Gospello!\n\n🎵 ${data.title}${dateStr ? `\n📅 ${dateStr}` : ''}${venueLine ? `\n📍 ${venueLine}` : ''}\n\nDon't miss it 👉 gospello.com/events/${slug}`

  // Use the actual banner_url directly — dynamic /og-image is too slow for WhatsApp's scraper
  const ogImageUrl = data.banner_url ?? null

  const ogTitle       = `${data.title} | Gospello`
  const ogDescription = data.description
    ? data.description.slice(0, 200)
    : `${dateStr ? `${dateStr} · ` : ''}${venueLine}${data.is_free ? ' · Free Event' : ''}`

  return {
    title: data.title,
    description: ogDescription,
    openGraph: {
      title:       ogTitle,
      description: ogDescription,
      url:         pageUrl,
      type:        'article',
      siteName:    'Gospello',
      images: ogImageUrl
        ? [{ url: ogImageUrl, width: 1200, height: 630, alt: data.title }]
        : [],
    },
    twitter: {
      card:        'summary_large_image',
      site:        '@gospello',
      title:       ogTitle,
      description: ogDescription,
      images: ogImageUrl
        ? [{ url: ogImageUrl, width: 1200, height: 630, alt: data.title }]
        : [],
    },
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user server-side (passed to RegistrationButton to skip client-side auth fetch)
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select('*, churches(*), profiles(*), seeded_organizers(*)')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (!event) notFound()

  const e = event as EventWithRelations

  // Parallel data fetches
  const [
    { count: attendanceCount },
    initialAttended,
    initialSaved,
    { data: relatedCat },
    { data: relatedCity },
    { count: organizerEventCount },
  ] = await Promise.all([
    adminClient
      .from('attendances')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', e.id),
    checkUserAttended(e.id),
    checkEventSaved(e.id),
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
    e.church_id
      ? adminClient
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('church_id', e.church_id)
          .eq('status', 'approved')
      : e.seeded_organizer_id
      ? adminClient
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('seeded_organizer_id', e.seeded_organizer_id)
          .eq('status', 'approved')
      : adminClient
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('organizer_id', e.organizer_id)
          .eq('status', 'approved'),
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

  const catMap = await getCategoryMap()
  const catInfo = catMap[e.category]
  const categoryLabel = catInfo?.name ?? e.category
  const categoryIcon  = catInfo?.icon ?? null
  const categoryColor = catInfo?.color ?? '#6B7280'
  const lifecycle = getEventLifecycle(e.start_date, e.end_date)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
  const eventUrl = `${siteUrl}/events/${e.slug}`

  const safeAttendance = attendanceCount ?? 0

  // Price badge
  const priceBadge = e.is_free
    ? { label: 'Free', cls: 'bg-emerald-100 text-emerald-700' }
    : { label: 'Paid', cls: 'bg-blue-100 text-blue-700' }

  // Right sidebar price/type pill
  const registrationType = e.registration_type
  let sidebarPricePill: { label: string; cls: string }
  if (registrationType === 'free_no_registration' || (e.is_free && !e.rsvp_required)) {
    sidebarPricePill = { label: 'Free Event', cls: 'bg-emerald-100 text-emerald-700' }
  } else if (registrationType === 'free_registration' || (e.is_free && e.rsvp_required)) {
    sidebarPricePill = { label: 'Free — Registration Required', cls: 'bg-amber-100 text-amber-800' }
  } else {
    sidebarPricePill = { label: 'Paid Event', cls: 'bg-blue-100 text-blue-700' }
  }

  const almostFull = e.capacity != null && safeAttendance >= e.capacity * 0.8
  const capacityPct = e.capacity != null && e.capacity > 0
    ? Math.min(Math.round((safeAttendance / e.capacity) * 100), 100)
    : 0
  const capacityBarColor =
    capacityPct >= 90 ? 'bg-red-500' :
    capacityPct >= 70 ? 'bg-amber-500' :
    'bg-emerald-500'

  const mapsQuery = encodeURIComponent(`${e.location_name} ${e.city} ${e.state}`)

  const shareEventDate = formatDate(e.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const shareEventLocation = e.is_online ? 'Online Event' : `${e.location_name}, ${e.city}`

  const hostName = e.churches?.name ?? e.seeded_organizers?.name ?? e.profiles?.display_name ?? 'Gospello'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    description: e.description ?? undefined,
    startDate: e.start_date,
    endDate: e.end_date ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: e.is_online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: e.is_online
      ? { '@type': 'VirtualLocation', url: e.online_link ?? eventUrl }
      : {
          '@type': 'Place',
          name: e.location_name,
          address: {
            '@type': 'PostalAddress',
            streetAddress: e.address ?? undefined,
            addressLocality: e.city,
            addressRegion: e.state,
            addressCountry: e.country,
          },
        },
    image: e.banner_url ? [e.banner_url] : undefined,
    organizer: {
      '@type': 'Organization',
      name: hostName,
      url: eventUrl,
    },
    offers: {
      '@type': 'Offer',
      price: e.is_free ? '0' : String(e.price ?? 0),
      priceCurrency: e.currency ?? 'NGN',
      availability: 'https://schema.org/InStock',
      url: e.payment_link ?? eventUrl,
    },
  }

  /* ─── shared organizer card renderer ──────────────────────── */
  function OrganizerCard() {
    if (e.churches) {
      return (
        <Link href={`/churches/${e.churches.slug}`}
          className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-gray-50/50 transition-all group">
          <div className="w-[52px] h-[52px] rounded-full flex-shrink-0 overflow-hidden bg-indigo-50 ring-2 ring-white shadow">
            {e.churches.logo_url
              ? <Image src={e.churches.logo_url} alt="" width={52} height={52} className="object-cover w-full h-full" />
              : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-5 h-5 text-indigo-400" /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{e.churches.name}</p>
              {e.churches.verified_badge
                ? <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.723 3.066 3.745 3.745 0 01-3.066.723A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.066-.723 3.745 3.745 0 01-.723-3.066A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.723-3.066 3.746 3.746 0 013.066-.723A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.066.723 3.746 3.746 0 01.723 3.066A3.745 3.745 0 0121 12z" /></svg>
                : e.churches.is_claimed
                ? <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                : null}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {e.churches.city ? `${e.churches.city} · ` : ''}{organizerEventCount ?? 0} events
            </p>
          </div>
          <span className="flex-shrink-0 text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full group-hover:bg-indigo-100 transition-colors">View</span>
        </Link>
      )
    }
    if (e.seeded_organizers) {
      return (
        <Link href={`/organizers/${e.seeded_organizers.slug}`}
          className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-gray-50/50 transition-all group">
          <div className="w-[52px] h-[52px] rounded-full flex-shrink-0 overflow-hidden bg-indigo-50 ring-2 ring-white shadow">
            {e.seeded_organizers.logo_url
              ? <Image src={e.seeded_organizers.logo_url} alt="" width={52} height={52} className="object-cover w-full h-full" />
              : <div className="w-full h-full flex items-center justify-center"><span className="font-black text-indigo-600 text-xl">{e.seeded_organizers.name?.[0]?.toUpperCase()}</span></div>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{e.seeded_organizers.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {e.seeded_organizers.city ? `${e.seeded_organizers.city} · ` : ''}{organizerEventCount ?? 0} events
            </p>
          </div>
          <span className="flex-shrink-0 text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full group-hover:bg-indigo-100 transition-colors">View</span>
        </Link>
      )
    }
    if (e.profiles) {
      return (
        <Link href={`/organizers/${e.profiles.id}`}
          className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-gray-50/50 transition-all group">
          <div className="w-[52px] h-[52px] rounded-full flex-shrink-0 overflow-hidden bg-indigo-50 ring-2 ring-white shadow">
            {e.profiles.avatar_url
              ? <Image src={e.profiles.avatar_url} alt="" width={52} height={52} className="object-cover w-full h-full" />
              : <div className="w-full h-full flex items-center justify-center"><span className="font-black text-indigo-600 text-xl">{e.profiles.display_name?.[0]?.toUpperCase()}</span></div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{e.profiles.display_name}</p>
              <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.723 3.066 3.745 3.745 0 01-3.066.723A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.066-.723 3.745 3.745 0 01-.723-3.066A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.723-3.066 3.746 3.746 0 013.066-.723A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.066.723 3.746 3.746 0 01.723 3.066A3.745 3.745 0 0121 12z" /></svg>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{e.profiles.account_type} · {organizerEventCount ?? 0} events</p>
          </div>
          <span className="flex-shrink-0 text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full group-hover:bg-indigo-100 transition-colors">View</span>
        </Link>
      )
    }
    return null
  }

  /* ─── 2-col related events grid (shared mobile + desktop) ──── */
  function RelatedGrid() {
    if (!related.length) return null
    return (
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">More You&apos;ll Love</p>
          <Link href="/events" className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-0.5">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {related.slice(0, 4).map(ev => (
            <Link key={ev.id} href={`/events/${ev.slug}`}
              className="rounded-2xl overflow-hidden border border-gray-100 active:scale-95 transition-transform block">
              <div className="aspect-square relative bg-indigo-50">
                {ev.banner_url
                  ? <Image src={ev.banner_url} alt={ev.title} fill className="object-cover" />
                  : <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center"><span className="text-3xl">🎵</span></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ev.is_free ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {ev.is_free ? 'Free' : 'Paid'}
                  </span>
                  <p className="text-[11px] font-bold text-white leading-tight mt-1 line-clamp-2">{ev.title}</p>
                  <p className="text-[10px] text-white/70 mt-0.5">{formatDate(ev.start_date, { month: 'short', day: 'numeric' })} · {ev.city}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-white font-[var(--font-plus-jakarta)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ════════════════════════════════════════════════════════════
          MOBILE — full-screen hero + bottom sheet
          ════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden">

        {/* ── Hero banner ── */}
        <div className="relative -mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)]"
             style={{ height: 'min(75svh, 640px)' }}>

          {/* Background */}
          <div className="absolute inset-0 overflow-hidden">
            {e.banner_url
              ? <Image src={e.banner_url} alt={e.title} fill className="object-cover" priority />
              : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${categoryColor}44 0%, #1e1b4b 55%, #0f172a 100%)` }} />}
            {/* top gradient: nav legibility */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/65 to-transparent" />
            {/* bottom gradient: title legibility */}
            <div className="absolute bottom-0 left-0 right-0 h-[65%] bg-gradient-to-t from-black/92 via-black/55 to-transparent" />
          </div>

          {/* Top row: back + badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <BackButton />
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {almostFull && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-md">🔥 Almost Full</span>
              )}
              <EventStatusBadge startDate={e.start_date} endDate={e.end_date} />
            </div>
          </div>

          {/* Floating save heart — top-right below badges */}
          <div className="absolute right-4 top-16">
            <SaveButton eventId={e.id} eventTitle={e.title} initialSaved={initialSaved}
              serverUserId={currentUser?.id ?? null} variant="icon" size="md" />
          </div>

          {/* Bottom: category pill + title + meta */}
          <div className="absolute bottom-10 left-0 right-0 px-5">
            <div className="flex gap-2 mb-3 flex-wrap">
              <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: categoryColor }}>
                {categoryIcon && <span className="mr-0.5">{categoryIcon}</span>}{categoryLabel}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${priceBadge.cls}`}>
                {priceBadge.label}
              </span>
              {e.is_online
                ? <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-sky-100/95 text-sky-800 shadow-sm">Online</span>
                : <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-white/20 text-white backdrop-blur-sm">In Person</span>}
            </div>
            <h1 className="text-[27px] leading-tight font-black text-white drop-shadow-lg mb-2 tracking-tight">
              {e.title}
            </h1>
            <div className="flex items-center gap-2.5 text-[13px] text-white/85 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                {e.daily_schedule?.length
                  ? `${fmtScheduleDay(e.daily_schedule[0].date)} – ${fmtScheduleDay(e.daily_schedule[e.daily_schedule.length - 1].date)}`
                  : formatDate(e.start_date, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              {!e.is_online && e.city && (
                <>
                  <span className="text-white/35">·</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-300 flex-shrink-0" />
                    {e.city}
                  </span>
                </>
              )}
              {e.is_online && (
                <>
                  <span className="text-white/35">·</span>
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
                    Online
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Drag indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/30" />
        </div>

        {/* ── Bottom sheet ── */}
        <div className="relative z-10 -mt-7 bg-white rounded-t-[28px] shadow-[0_-6px_40px_rgba(0,0,0,0.13)] pb-36">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-0.5">
            <div className="w-10 h-1.5 rounded-full bg-gray-200" />
          </div>

          <div className="px-5 pt-4 space-y-5">

            {/* Social proof */}
            <div className="flex items-center justify-between">
              {safeAttendance > 0 ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(safeAttendance, 4))].map((_, i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                        {['✝', '♪', '✦', '🙏'][i]}
                      </div>
                    ))}
                    {safeAttendance > 4 && (
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 text-gray-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        +{safeAttendance - 4}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">{safeAttendance.toLocaleString()}</span>
                    {' '}{safeAttendance === 1 ? 'person' : 'people'} going
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Be the first to go ✨</p>
              )}
              <div className="text-xs text-gray-400 flex-shrink-0">
                <ViewCounter eventId={e.id} initialCount={e.views_count ?? 0} />
              </div>
            </div>

            {/* Countdown banner */}
            {lifecycle === 'upcoming' && (
              <div className="flex items-center gap-3 bg-indigo-50 rounded-2xl px-4 py-3 border border-indigo-100">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Starts in</p>
                  <CountdownTimer startDate={e.start_date} />
                </div>
              </div>
            )}

            {/* Primary CTA */}
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
                <div className="w-full text-center text-sm text-gray-400 py-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  This event has ended
                </div>
              )}
            </div>

            {/* Quick detail grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                </div>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {e.daily_schedule?.length
                    ? fmtScheduleDay(e.daily_schedule[0].date)
                    : formatDate(e.start_date, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {e.daily_schedule?.length ? fmt12(e.daily_schedule[0].start_time) : formatTime(e.start_date)}
                </p>
                {(e.daily_schedule?.length ?? 0) > 1 && (
                  <p className="text-[11px] text-indigo-500 font-semibold mt-0.5">{e.daily_schedule!.length} days</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  {e.is_online ? <Globe className="w-3.5 h-3.5 text-sky-400" /> : <MapPin className="w-3.5 h-3.5 text-rose-400" />}
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{e.is_online ? 'Online' : 'Location'}</p>
                </div>
                {e.is_online ? (
                  <>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{e.online_platform ?? 'Online Event'}</p>
                    {e.online_link && (
                      <a href={e.online_link} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-sky-500 font-semibold mt-0.5 hover:underline block">Join link →</a>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">{e.location_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{e.city}, {e.state}</p>
                    <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-500 font-semibold mt-0.5 hover:underline block">Open Maps →</a>
                  </>
                )}
              </div>
            </div>

            {/* Paid event price */}
            {!e.is_free && e.price != null && (
              <div className="flex items-center gap-3 bg-amber-50 rounded-2xl px-4 py-3 border border-amber-100">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{e.currency} {e.price.toLocaleString()}</p>
                  {e.payment_link && (
                    <a href={e.payment_link} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline">View payment page →</a>
                  )}
                </div>
              </div>
            )}

            {/* Capacity bar */}
            {e.capacity != null && e.capacity > 0 && (
              <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-400" />Capacity</span>
                  <span className={`font-bold ${capacityPct >= 90 ? 'text-red-500' : capacityPct >= 70 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {safeAttendance} / {e.capacity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${capacityBarColor}`} style={{ width: `${capacityPct}%` }} />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">{capacityPct}% full</p>
              </div>
            )}

            {/* Livestream */}
            {e.livestream_url && (
              <div className="flex items-center gap-3 bg-sky-50 rounded-2xl px-4 py-3 border border-sky-100">
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-sky-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Watch Live</p>
                  <a href={e.livestream_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-sky-600 font-medium hover:underline">Join Livestream →</a>
                </div>
              </div>
            )}

            {/* Multi-day schedule */}
            {(e.daily_schedule?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Schedule · {e.daily_schedule!.length} days
                </p>
                <div className="space-y-2">
                  {e.daily_schedule!.map((day: DaySchedule, idx: number) => (
                    <div key={day.date} className="flex items-center gap-3 py-2.5 px-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center flex-shrink-0">{idx + 1}</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{fmtScheduleDay(day.date)}</p>
                      </div>
                      <p className="text-xs text-gray-500 tabular-nums">
                        {fmt12(day.start_time)}{day.end_time ? ` – ${fmt12(day.end_time)}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            {e.description && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</p>
                <ReadMoreText text={e.description} limit={280} />
              </div>
            )}

            {/* Tags */}
            {(e.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {e.tags!.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs text-gray-600 border border-gray-200 bg-gray-50">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Speakers */}
            {e.speakers && (
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" /> Ministers &amp; Speakers
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{e.speakers}</p>
              </div>
            )}

            {/* Event info chips */}
            {(e.parking_available || e.child_friendly || e.notes) && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-2">
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
                  <div className="flex items-start gap-2.5 text-sm text-gray-700 bg-amber-50 px-4 py-3 rounded-xl border border-amber-100">
                    <StickyNote className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p>{e.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Calendar + Flyer + Timezone row */}
            <div className="space-y-2">
              <AddToCalendar title={e.title} startDate={e.start_date} endDate={e.end_date}
                location={shareEventLocation} description={e.description} />
              <div className="flex items-center gap-2 flex-wrap">
                {e.banner_url && <SaveFlyerButton bannerUrl={e.banner_url} eventTitle={e.title} />}
                {e.timezone && e.timezone !== 'UTC' && <EventTimezone timezone={e.timezone} startDate={e.start_date} />}
              </div>
            </div>

            {/* Share */}
            <ShareButton eventTitle={e.title} eventUrl={eventUrl} eventDate={shareEventDate}
              eventLocation={shareEventLocation} eventDescription={e.description ?? ''} bannerUrl={e.banner_url} />

            <hr className="border-gray-100" />

            {/* Organizer */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Hosted by</p>
              {OrganizerCard()}
            </div>

            <hr className="border-gray-100" />

            {/* Related events grid */}
            {RelatedGrid()}

            {/* HaveAnEvent */}
            <HaveAnEventCTA />

          </div>
        </div>
      </div>
      {/* END MOBILE */}


      {/* ════════════════════════════════════════════════════════════
          DESKTOP — two-column layout
          ════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-6">
        <div className="flex gap-8">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:w-[62%] min-w-0">
            <Link href="/events"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Events
            </Link>

            {/* Desktop banner with gradient + title overlay */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg mb-5">
              {e.banner_url
                ? <Image src={e.banner_url} alt={e.title} fill className="object-cover" priority />
                : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${categoryColor}44 0%, #1e1b4b 55%, #0f172a 100%)` }} />}
              <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-black/88 via-black/45 to-transparent" />

              {/* Top: badges */}
              <div className="absolute top-4 left-5 right-5 flex items-center justify-between">
                <div className="flex gap-2">
                  <EventStatusBadge startDate={e.start_date} endDate={e.end_date} />
                  {almostFull && <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500 text-white">🔥 Almost Full</span>}
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: categoryColor }}>
                  {categoryIcon && <span className="mr-0.5">{categoryIcon}</span>}{categoryLabel}
                </span>
              </div>

              {/* Bottom: title + meta */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex gap-2 mb-3 flex-wrap">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ${priceBadge.cls}`}>{priceBadge.label}</span>
                  {e.is_online
                    ? <span className="rounded-full px-3 py-1 text-xs font-medium bg-sky-100/95 text-sky-800">Online Event</span>
                    : <span className="rounded-full px-3 py-1 text-xs font-medium bg-white/20 text-white backdrop-blur-sm">In Person</span>}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md mb-2">
                  {e.title}
                </h1>
                <div className="flex items-center gap-2.5 text-sm font-medium text-white/85 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-300" />
                    {e.daily_schedule?.length
                      ? `${fmtScheduleDay(e.daily_schedule[0].date)} – ${fmtScheduleDay(e.daily_schedule[e.daily_schedule.length - 1].date)}`
                      : formatDate(e.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    {e.daily_schedule?.length ? fmt12(e.daily_schedule[0].start_time) : formatTime(e.start_date)}
                  </span>
                  {!e.is_online && e.city && (
                    <>
                      <span className="text-white/30">·</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-300" />{e.location_name}, {e.city}</span>
                    </>
                  )}
                  {e.is_online && (
                    <>
                      <span className="text-white/30">·</span>
                      <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-sky-300" />Online Event</span>
                    </>
                  )}
                  {e.timezone && e.timezone !== 'UTC' && (
                    <EventTimezone timezone={e.timezone} startDate={e.start_date} />
                  )}
                </div>
              </div>
            </div>

            {/* Social proof + countdown row */}
            <div className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-3">
                {safeAttendance > 0 ? (
                  <div className="flex items-center gap-2.5">
                    <div className="flex -space-x-1.5">
                      {[...Array(Math.min(safeAttendance, 3))].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-[8px] font-black flex items-center justify-center">
                          {['✝', '♪', '✦'][i]}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-800">{safeAttendance.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">{safeAttendance === 1 ? 'person' : 'people'} going</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Be the first to go ✨</span>
                )}
                <span className="text-gray-200">·</span>
                <div className="text-sm text-gray-400">
                  <ViewCounter eventId={e.id} initialCount={e.views_count ?? 0} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lifecycle === 'upcoming' && <CountdownTimer startDate={e.start_date} />}
                {e.banner_url && <SaveFlyerButton bannerUrl={e.banner_url} eventTitle={e.title} />}
              </div>
            </div>

            <hr className="border-gray-100 my-5" />

            {/* Multi-day schedule */}
            {(e.daily_schedule?.length ?? 0) > 0 && (
              <>
                <div className="mb-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Schedule · {e.daily_schedule!.length} days
                  </p>
                  <div className="space-y-2">
                    {e.daily_schedule!.map((day: DaySchedule, idx: number) => (
                      <div key={day.date} className="flex items-center gap-3 py-2.5 px-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center flex-shrink-0">{idx + 1}</div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">{fmtScheduleDay(day.date)}</p>
                        </div>
                        <p className="text-xs text-gray-500 tabular-nums">
                          {fmt12(day.start_time)}{day.end_time ? ` – ${fmt12(day.end_time)}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <hr className="border-gray-100 my-5" />
              </>
            )}

            {/* Livestream */}
            {e.livestream_url && (
              <>
                <div className="flex items-center gap-3 bg-sky-50 rounded-2xl px-4 py-3.5 border border-sky-100 mb-5">
                  <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Watch Live</p>
                    <a href={e.livestream_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-sky-600 font-medium hover:underline">Join Livestream →</a>
                  </div>
                </div>
                <hr className="border-gray-100 my-5" />
              </>
            )}

            {/* About */}
            {e.description && (
              <>
                <div className="mb-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">About this event</p>
                  <ReadMoreText text={e.description} limit={300} />
                </div>
                <hr className="border-gray-100 my-5" />
              </>
            )}

            {/* Tags */}
            {(e.tags?.length ?? 0) > 0 && (
              <>
                <div className="flex flex-wrap gap-2 mb-5">
                  {e.tags!.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs text-gray-600 border border-gray-200 bg-white hover:bg-gray-50">
                      #{tag}
                    </span>
                  ))}
                </div>
                <hr className="border-gray-100 my-5" />
              </>
            )}

            {/* Speakers */}
            {e.speakers && (
              <>
                <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 mb-5">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" /> Ministers &amp; Speakers
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed">{e.speakers}</p>
                </div>
                <hr className="border-gray-100 my-5" />
              </>
            )}

            {/* Event info chips */}
            {(e.parking_available || e.child_friendly || e.notes) && (
              <>
                <div className="space-y-3 mb-5">
                  <div className="flex flex-wrap gap-2">
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
                    <div className="flex items-start gap-2.5 text-sm text-gray-700 bg-amber-50 px-4 py-3.5 rounded-xl border border-amber-100">
                      <StickyNote className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p>{e.notes}</p>
                    </div>
                  )}
                </div>
                <hr className="border-gray-100 my-5" />
              </>
            )}

            {/* Organizer */}
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Hosted by</p>
              {OrganizerCard()}
            </div>

            <hr className="border-gray-100 my-5" />

            {/* Related events */}
            {RelatedGrid()}

            <HaveAnEventCTA />
          </div>

          {/* ── RIGHT COLUMN — sticky sidebar ── */}
          <div className="lg:w-[38%]">
            <div className="sticky top-6 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

              {/* CTA block */}
              <div className="p-5 space-y-2.5">
                {safeAttendance > 0 && (
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span className="flex -space-x-1">
                      {[...Array(Math.min(safeAttendance, 3))].map((_, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-[7px] font-black flex items-center justify-center">
                          {['✝', '♪', '✦'][i]}
                        </div>
                      ))}
                    </span>
                    {safeAttendance.toLocaleString()} {safeAttendance === 1 ? 'person' : 'people'} going
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
                  <div className="w-full text-center text-sm text-gray-400 py-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    This event has ended
                  </div>
                )}
                {lifecycle !== 'ended' && (
                  <SaveButton eventId={e.id} eventTitle={e.title} initialSaved={initialSaved}
                    serverUserId={currentUser?.id ?? null} variant="button" />
                )}
                <AddToCalendar title={e.title} startDate={e.start_date} endDate={e.end_date}
                  location={shareEventLocation} description={e.description} />
              </div>

              <hr className="border-gray-100" />

              {/* Details */}
              <div className="p-5 space-y-4 bg-gray-50/40">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${sidebarPricePill.cls}`}>
                    {sidebarPricePill.label}
                  </span>
                  {lifecycle === 'upcoming' && <CountdownTimer startDate={e.start_date} />}
                </div>

                {/* Date/time */}
                {(e.daily_schedule?.length ?? 0) > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Schedule · {e.daily_schedule!.length} days
                    </p>
                    {e.daily_schedule!.map((day: DaySchedule, idx: number) => (
                      <div key={day.date} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                        <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{fmtScheduleDay(day.date)}</p>
                          <p className="text-xs text-gray-500">
                            {fmt12(day.start_time)}{day.end_time ? ` – ${fmt12(day.end_time)}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-sm font-bold text-gray-900">
                      <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      {formatDate(e.start_date, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-bold text-gray-900">
                      <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      {formatTime(e.start_date)}{e.end_date ? ` – ${formatTime(e.end_date)}` : ''}
                    </div>
                  </div>
                )}

                {/* Location */}
                {e.is_online ? (
                  <div className="flex items-start gap-2.5">
                    <Globe className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{e.online_platform ?? 'Online Event'}</p>
                      {e.online_link && (
                        <a href={e.online_link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-sky-600 hover:underline">Join link →</a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{e.location_name}</p>
                      {e.address && <p className="text-xs text-gray-500">{e.address}</p>}
                      <p className="text-xs text-gray-500">{e.city}, {e.state}</p>
                      <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline">Open in Google Maps →</a>
                    </div>
                  </div>
                )}

                {/* Price */}
                {!e.is_free && e.price != null && (
                  <div className="flex items-center gap-2.5">
                    <Ticket className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{e.currency} {e.price.toLocaleString()}</p>
                      {e.payment_link && (
                        <a href={e.payment_link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline">View payment page →</a>
                      )}
                    </div>
                  </div>
                )}

                {/* Capacity */}
                {e.capacity != null && e.capacity > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                      <span className="font-semibold">Capacity</span>
                      <span className="font-bold">{safeAttendance} / {e.capacity} · {capacityPct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${capacityBarColor}`} style={{ width: `${capacityPct}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-gray-100" />

              {/* Share */}
              <div className="p-5">
                <ShareButton eventTitle={e.title} eventUrl={eventUrl} eventDate={shareEventDate}
                  eventLocation={shareEventLocation} eventDescription={e.description ?? ''} bannerUrl={e.banner_url} />
              </div>
            </div>
          </div>

        </div>
      </div>
      {/* END DESKTOP */}

      {/* Mobile sticky bottom bar */}
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
