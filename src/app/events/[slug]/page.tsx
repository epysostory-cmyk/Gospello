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
  Car, Baby, StickyNote, Mic, Ticket,
} from 'lucide-react'
import type { Event } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import RegistrationButton from '@/components/ui/RegistrationButton'
import SaveButton from '@/components/ui/SaveButton'
import ViewCounter from '@/components/ui/ViewCounter'
import ShareButton from '@/components/ui/ShareButton'
import EventQuickActions from './_components/EventQuickActions'
import HaveAnEventCTA from '@/components/ui/HaveAnEventCTA'
import AddToCalendar from './_components/AddToCalendar'
import ReadMoreText from './_components/ReadMoreText'
import { EventStatusBadge, EventDaysChip } from './_components/EventStatusBadge'
import { checkUserAttended } from '@/app/actions/attendance'
import { checkEventSaved } from '@/app/actions/saved-events'

export const dynamic = 'force-dynamic'

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
    .select('*, churches(*), profiles(*)')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (!event) notFound()

  const e = event as Event

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

  return (
    <div className="min-h-screen bg-gray-50 font-[var(--font-plus-jakarta)]">

      {/* Main content wrapper */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-4 lg:pt-6">
        <BackButton />
        <div className="animate-fadeInUp flex flex-col lg:flex-row gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:w-[62%] min-w-0">

            {/* Back navigation — desktop only */}
            <Link
              href="/events"
              className="hidden lg:inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Events
            </Link>

            {/* Banner — mobile (full-bleed, below nav) */}
            <div className="lg:hidden relative aspect-video overflow-hidden bg-slate-900 -mx-4 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)]">
              {e.banner_url ? (
                <Image src={e.banner_url} alt={e.title} fill className="object-cover" priority />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900" />
              )}
              {almostFull && (
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500 text-white">Almost Full</span>
                </div>
              )}
            </div>

            {/* Banner — desktop (rounded, in column) */}
            <div className="hidden lg:block relative w-full aspect-video rounded-2xl overflow-hidden shadow-md mb-5">
              {e.banner_url ? (
                <Image src={e.banner_url} alt={e.title} fill className="object-cover" priority />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900" />
              )}
              {almostFull && (
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500 text-white">Almost Full</span>
                </div>
              )}
            </div>

            {/* Badge row */}
            <div className="flex gap-2 flex-wrap mt-4">
              <EventStatusBadge startDate={e.start_date} endDate={e.end_date} />
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: categoryColor }}
              >
                {categoryIcon && <span className="mr-1">{categoryIcon}</span>}{categoryLabel}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${priceBadge.cls}`}>
                {priceBadge.label}
              </span>
              {e.is_online && (
                <span className="rounded-full px-3 py-1 text-xs font-medium bg-sky-100 text-sky-700 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Online
                </span>
              )}
            </div>

            {/* Event title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 leading-tight tracking-tight">
              {e.title}
            </h1>

            {/* Quick meta row */}
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                {formatDate(e.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-gray-300 font-normal">·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                {formatTime(e.start_date)}
              </span>
              {!e.is_online && e.city && (
                <>
                  <span className="text-gray-300 font-normal">·</span>
                  <a
                    href={`https://maps.google.com/?q=${mapsQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    {e.location_name}, {e.city}
                  </a>
                </>
              )}
              {e.is_online && (
                <>
                  <span className="text-gray-300 font-normal">·</span>
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                    Online Event
                  </span>
                </>
              )}
            </div>

            {/* Stats row */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 flex items-center gap-1.5">
                <ViewCounter eventId={e.id} initialCount={e.views_count ?? 0} />
              </span>
              <span className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 flex items-center gap-1.5">
                <EventDaysChip startDate={e.start_date} endDate={e.end_date} />
              </span>
            </div>

            <hr className="border-gray-100 my-5" />

            {/* Tags */}
            {e.tags && e.tags.length > 0 && (
              <>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {e.tags.map(tag => (
                      <span
                        key={tag}
                        className="border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 bg-white hover:bg-gray-50 transition-colors cursor-default"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <hr className="border-gray-100 my-5" />
              </>
            )}

            {/* About this event */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About this event</p>
              <ReadMoreText text={e.description} limit={300} />
            </div>

            {/* Speakers */}
            {e.speakers && (
              <>
                <hr className="border-gray-100 my-5" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5" /> Featured Ministers &amp; Speakers
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">{e.speakers}</p>
                </div>
              </>
            )}

            {/* Event info chips */}
            {(e.parking_available || e.child_friendly || e.notes) && (
              <>
                <hr className="border-gray-100 my-5" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Event Information</p>
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
              </>
            )}

            <hr className="border-gray-100 my-5" />

            {/* CTA — mobile only (desktop: right sidebar) */}
            <div id="attend" className="lg:hidden space-y-2">
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
                <SaveButton
                  eventId={e.id}
                  eventTitle={e.title}
                  initialSaved={initialSaved}
                  serverUserId={currentUser?.id ?? null}
                  variant="button"
                />
              )}
              <AddToCalendar
                title={e.title}
                startDate={e.start_date}
                endDate={e.end_date}
                location={shareEventLocation}
                description={e.description}
              />
            </div>

            <hr className="border-gray-100 my-5" />

            {/* Share buttons — mobile only (desktop: right sidebar) */}
            <div className="lg:hidden">
              <ShareButton
                eventTitle={e.title}
                eventUrl={eventUrl}
                eventDate={shareEventDate}
                eventLocation={shareEventLocation}
                eventDescription={e.description ?? ''}
                bannerUrl={e.banner_url}
              />
              <hr className="border-gray-100 my-5" />
            </div>

            {/* Organizer card */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Hosted by</p>
              {e.churches ? (
                <Link
                  href={`/churches/${e.churches.slug}`}
                  className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-indigo-200 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {e.churches.logo_url ? (
                      <Image
                        src={e.churches.logo_url}
                        alt=""
                        width={56}
                        height={56}
                        className="object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-indigo-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {e.churches.name}
                    </p>
                    {e.churches.city && (
                      <p className="text-xs text-gray-500 mt-0.5">{e.churches.city}, {e.churches.state}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{organizerEventCount ?? 0} events on Gospello</p>
                  </div>
                  <span className="text-xs text-indigo-500 font-medium group-hover:underline">View Profile →</span>
                </Link>
              ) : e.profiles ? (
                <Link
                  href={`/organizers/${e.profiles.id}`}
                  className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-indigo-200 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {e.profiles.avatar_url ? (
                      <Image
                        src={e.profiles.avatar_url}
                        alt=""
                        width={56}
                        height={56}
                        className="object-cover"
                      />
                    ) : (
                      <span className="font-black text-indigo-600 text-xl">
                        {e.profiles.display_name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {e.profiles.display_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{e.profiles.account_type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{organizerEventCount ?? 0} events on Gospello</p>
                  </div>
                  <span className="text-xs text-indigo-500 font-medium group-hover:underline">View Profile →</span>
                </Link>
              ) : null}
            </div>

            {/* Have an Event CTA */}
            <HaveAnEventCTA />

            {/* More Events You'll Love */}
            {related.length > 0 && (
              <>
                <hr className="border-gray-100 my-5" />
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900">More Events You&apos;ll Love</h2>
                    <Link href="/events" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                      See all <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4">
                    {related.map((ev) => (
                      <Link
                        key={ev.id}
                        href={`/events/${ev.slug}`}
                        className="w-64 flex-shrink-0 snap-start group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
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
                          <div className="absolute top-2.5 right-2.5">
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
                </section>
              </>
            )}
          </div>

          {/* RIGHT COLUMN — sticky card */}
          <div className="hidden lg:block lg:w-[38%]">
            <div className="sticky top-6 bg-white rounded-[20px] border border-gray-200 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] space-y-4">

              {/* Price/type badge */}
              <div className={`w-full text-center py-2 rounded-full text-sm font-semibold ${sidebarPricePill.cls}`}>
                {sidebarPricePill.label}
              </div>

              {/* Date & time */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm font-bold text-gray-900">
                  <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  {formatDate(e.start_date, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-900">
                  <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  {formatTime(e.start_date)}{e.end_date ? ` – ${formatTime(e.end_date)}` : ''}
                </div>
              </div>

              {/* Location */}
              {e.is_online ? (
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{e.online_platform ?? 'Online Event'}</p>
                    <p className="text-xs text-gray-500">Online Event</p>
                    {e.online_link && (
                      <a
                        href={e.online_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors mt-1"
                      >
                        <Globe className="w-3 h-3" /> Join Event
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{e.location_name}</p>
                    {e.address && <p className="text-xs text-gray-500">{e.address}</p>}
                    <p className="text-xs text-gray-500">{e.city}, {e.state}</p>
                    <a
                      href={`https://maps.google.com/?q=${mapsQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </div>
              )}

              {/* Price detail for paid events */}
              {!e.is_free && e.price != null && (
                <div className="flex items-center gap-3">
                  <Ticket className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{e.currency} {e.price.toLocaleString()}</p>
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

              <hr className="border-gray-100" />

              {/* Capacity tracker */}
              {e.capacity != null && e.capacity > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                    <span>Capacity</span>
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

              {/* CTA */}
              <div className="space-y-2">
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
                  <SaveButton
                    eventId={e.id}
                    eventTitle={e.title}
                    initialSaved={initialSaved}
                    serverUserId={currentUser?.id ?? null}
                    variant="button"
                  />
                )}
                <AddToCalendar
                  title={e.title}
                  startDate={e.start_date}
                  endDate={e.end_date}
                  location={shareEventLocation}
                  description={e.description}
                />
              </div>

              <hr className="border-gray-100" />

              {/* Share — desktop only */}
              <ShareButton
                eventTitle={e.title}
                eventUrl={eventUrl}
                eventDate={shareEventDate}
                eventLocation={shareEventLocation}
                eventDescription={e.description ?? ''}
                bannerUrl={e.banner_url}
              />
            </div>
          </div>

        </div>
      </div>

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
      />
    </div>
  )
}
