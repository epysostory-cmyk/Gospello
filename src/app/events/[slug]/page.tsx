import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import BackButton from '@/components/ui/BackButton'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { formatDate, formatTime } from '@/lib/utils'
import { getCategoryMap } from '@/lib/categories'
import { Calendar, MapPin, Clock, Building2, Globe, ChevronLeft, Car, Baby, Mic, Ticket, Users, ChevronRight, Bus, Accessibility, UtensilsCrossed, BedDouble, ShirtIcon, VideoOff, UserCheck } from 'lucide-react'
import type { DaySchedule } from '@/types/database'
import type { Event } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import RegistrationButton from '@/components/ui/RegistrationButton'
import SaveButton from '@/components/ui/SaveButton'
import ViewCounter from '@/components/ui/ViewCounter'
import ShareEventButton from '@/components/ui/ShareEventButton'
import EventQuickActions from './_components/EventQuickActions'
import HaveAnEventCTA from '@/components/ui/HaveAnEventCTA'
import CountdownTimer from '@/components/ui/CountdownTimer'
import AddToCalendar from './_components/AddToCalendar'
import ReadMoreText from './_components/ReadMoreText'
import { EventStatusBadge } from './_components/EventStatusBadge'
import EventTimezone from './_components/EventTimezone'
import { checkUserAttended } from '@/app/actions/attendance'
import { checkEventSaved } from '@/app/actions/saved-events'
import DownloadFlyerButton from './_components/DownloadFlyerButton'

export const dynamic = 'force-dynamic'

type EventWithRelations = Event & {
  seeded_organizers?: { slug: string; name: string; logo_url?: string | null; city?: string | null; state?: string | null } | null
}

function fmt12(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function fmtDay(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NG', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Lagos',
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const COLS = 'title, description, banner_url, start_date, end_date, city, state, is_free, location_name'
  type Meta = { title: string; description: string | null; banner_url: string | null; start_date: string; end_date: string | null; city: string | null; state: string | null; is_free: boolean; location_name: string | null }
  let data: Meta | null = null
  try {
    const { data: d, error } = await createAdminClient().from('events').select(COLS).eq('slug', slug).eq('status', 'approved').maybeSingle()
    if (!error && d) data = d as Meta
  } catch { /* */ }
  if (!data) {
    try {
      const { data: d } = await createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!).from('events').select(COLS).eq('slug', slug).eq('status', 'approved').maybeSingle()
      data = d as Meta | null
    } catch { /* */ }
  }
  if (!data) return {}
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
  const dateStr = formatDate(data.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const venue = data.location_name ? `${data.location_name}, ${data.city}` : [data.city, data.state].filter(Boolean).join(', ')
  const desc = data.description?.slice(0, 200) ?? `${dateStr} · ${venue}${data.is_free ? ' · Free' : ''}`
  return {
    title: data.title,
    description: desc,
    openGraph: { title: `${data.title} | Gospello`, description: desc, url: `${siteUrl}/events/${slug}`, type: 'article', siteName: 'Gospello', images: data.banner_url ? [{ url: data.banner_url, width: 1200, height: 630, alt: data.title }] : [] },
    twitter: { card: 'summary_large_image' as const, site: '@gospello', title: `${data.title} | Gospello`, description: desc, images: data.banner_url ? [data.banner_url] : [] },
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select('*, churches(*), profiles(*), seeded_organizers(*)')
    .eq('slug', slug).eq('status', 'approved').single()
  if (!event) notFound()

  const e = event as EventWithRelations

  const hostEventsQuery = e.church_id
    ? admin.from('events').select('id,title,slug,start_date,city,banner_url,is_free,location_name').eq('church_id',e.church_id).eq('status','approved').neq('id',e.id).gte('start_date',new Date().toISOString()).order('start_date',{ascending:true}).limit(3)
    : e.seeded_organizer_id
    ? admin.from('events').select('id,title,slug,start_date,city,banner_url,is_free,location_name').eq('seeded_organizer_id',e.seeded_organizer_id).eq('status','approved').neq('id',e.id).gte('start_date',new Date().toISOString()).order('start_date',{ascending:true}).limit(3)
    : admin.from('events').select('id,title,slug,start_date,city,banner_url,is_free,location_name').eq('organizer_id',e.organizer_id!).eq('status','approved').neq('id',e.id).gte('start_date',new Date().toISOString()).order('start_date',{ascending:true}).limit(3)

  const [
    { count: attendanceCount },
    initialAttended,
    initialSaved,
    { data: relatedCat },
    { data: relatedCity },
    { count: hostEventCount },
    { data: hostEventsRaw },
  ] = await Promise.all([
    admin.from('attendances').select('id', { count: 'exact', head: true }).eq('event_id', e.id),
    checkUserAttended(e.id),
    checkEventSaved(e.id),
    supabase.from('events').select('id,title,slug,start_date,city,banner_url,is_free').eq('status','approved').eq('category',e.category).neq('id',e.id).gte('start_date',new Date().toISOString()).limit(4),
    supabase.from('events').select('id,title,slug,start_date,city,banner_url,is_free').eq('status','approved').eq('city',e.city).neq('category',e.category).neq('id',e.id).gte('start_date',new Date().toISOString()).limit(3),
    e.church_id
      ? admin.from('events').select('id',{count:'exact',head:true}).eq('church_id',e.church_id).eq('status','approved')
      : e.seeded_organizer_id
      ? admin.from('events').select('id',{count:'exact',head:true}).eq('seeded_organizer_id',e.seeded_organizer_id).eq('status','approved')
      : admin.from('events').select('id',{count:'exact',head:true}).eq('organizer_id',e.organizer_id!).eq('status','approved'),
    hostEventsQuery,
  ])

  const hostEvents = (hostEventsRaw ?? []) as (Event & { location_name?: string | null })[]
  const hostEventIds = new Set(hostEvents.map(ev => ev.id))
  const seenIds = new Set<string>([...hostEventIds])
  const related: Event[] = []
  for (const ev of [...(relatedCat ?? []), ...(relatedCity ?? [])]) {
    if (!seenIds.has(ev.id)) { seenIds.add(ev.id); related.push(ev as Event) }
  }

  const catMap = await getCategoryMap()
  const catInfo = e.category ? catMap[e.category] : null
  const lifecycle = getEventLifecycle(e.start_date, e.end_date, e.daily_schedule)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
  const eventUrl = `${siteUrl}/events/${e.slug}`
  const attendance = attendanceCount ?? 0
  const mapsQ = encodeURIComponent([e.location_name, e.city, e.state].filter(Boolean).join(' '))
  const shareDate = formatDate(e.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const shareLocation = e.is_online ? 'Online Event' : [e.location_name, e.city].filter(Boolean).join(', ')
  const almostFull = e.capacity != null && attendance >= e.capacity * 0.8
  const capacityPct = e.capacity ? Math.min(Math.round((attendance / e.capacity) * 100), 100) : 0
  const isOrganizer = !!user && user.id === e.organizer_id

  /* Date/time display */
  const hasSchedule = (e.daily_schedule?.length ?? 0) > 0
  const displayDate = hasSchedule
    ? `${fmtDay(e.daily_schedule![0].date)} – ${fmtDay(e.daily_schedule![e.daily_schedule!.length - 1].date)}`
    : formatDate(e.start_date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const firstSessionTime = e.daily_schedule?.[0]?.sessions?.find((s: { start_time: string | null }) => s.start_time)?.start_time
    ?? e.daily_schedule?.[0]?.start_time
  const displayTime = hasSchedule
    ? (firstSessionTime ? fmt12(firstSessionTime) : 'TBD (To Be Announced)')
    : e.time_tba ? 'TBD (To Be Announced)' : formatTime(e.start_date)
  const venueKnown = !e.is_online && ((e.location_name && e.location_name !== 'TBD') || e.city)
  const displayVenue = e.is_online
    ? (e.online_platform ?? 'Online Event')
    : venueKnown
      ? [e.location_name !== 'TBD' ? e.location_name : null, e.city].filter(Boolean).join(', ')
      : 'TBD (To Be Announced)'
  const displayPrice = e.is_free
    ? 'Free'
    : e.price != null
    ? `${e.currency ?? '₦'}${e.price.toLocaleString()}`
    : 'Paid'

  /* Organizer data */
  const host = e.churches
    ? { href: `/churches/${e.churches.slug}`, name: e.churches.name, img: e.churches.logo_url, meta: [e.churches.city, `${hostEventCount ?? 0} events`].filter(Boolean).join(' · '), icon: <Building2 className="w-4 h-4 text-gray-400" /> }
    : e.seeded_organizers
    ? { href: `/organizers/${e.seeded_organizers.slug}`, name: e.seeded_organizers.name, img: e.seeded_organizers.logo_url, meta: [e.seeded_organizers.city, `${hostEventCount ?? 0} events`].filter(Boolean).join(' · '), icon: null }
    : e.profiles
    ? { href: `/organizers/${e.profiles.id}`, name: e.profiles.display_name, img: e.profiles.avatar_url, meta: `${hostEventCount ?? 0} events`, icon: null }
    : null

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Event',
    name: e.title, description: e.description ?? undefined,
    startDate: e.start_date, endDate: e.end_date ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: e.is_online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
    location: e.is_online
      ? { '@type': 'VirtualLocation', url: e.online_link ?? eventUrl }
      : { '@type': 'Place', name: e.location_name, address: { '@type': 'PostalAddress', streetAddress: e.address ?? undefined, addressLocality: e.city, addressRegion: e.state, addressCountry: e.country } },
    image: e.banner_url ? [e.banner_url] : undefined,
    organizer: { '@type': 'Organization', name: host?.name ?? 'Gospello', url: eventUrl },
    offers: { '@type': 'Offer', price: e.is_free ? '0' : String(e.price ?? 0), priceCurrency: e.currency ?? 'NGN', url: e.payment_link ?? eventUrl },
  }

  /* ─── Sidebar CTA (shared between desktop + mobile inline) ──── */
  // Drop-in (free_no_registration) stays open during the event — late arrivals can still tap I'm Going.
  // Ticket (free_registration) and paid events close at start time — no late registrations.
  const regType = e.registration_type
  const isTicketOrPaid = regType === 'free_registration' || regType === 'paid'
  const registrationOpen = lifecycle === 'ended'
    ? false
    : isTicketOrPaid
    ? lifecycle === 'upcoming'
    : true // drop-in: open until ended

  const CtaBlock = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? '' : 'space-y-3'}>
      {registrationOpen ? (
        <RegistrationButton
          event={{ id: e.id, registration_type: e.registration_type, price: e.price, payment_link: e.payment_link, rsvp_required: e.rsvp_required, is_free: e.is_free, title: e.title, is_online: e.is_online }}
          userId={user?.id ?? null}
          userName={user?.user_metadata?.display_name ?? null}
          userEmail={user?.email ?? null}
          isOrganizer={isOrganizer}
          initialRegistered={initialAttended}
        />
      ) : (
        <div className="w-full text-center py-3 text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
          {lifecycle === 'ended'
            ? 'This event has ended'
            : 'Registration is now closed'}
        </div>
      )}
      {!compact && lifecycle !== 'ended' && (
        <SaveButton eventId={e.id} eventTitle={e.title} initialSaved={initialSaved}
          serverUserId={user?.id ?? null} variant="button" />
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ══════════════════════════════════════════════════════════════
          MOBILE  (hidden on lg+)
      ══════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden font-jakarta">

        {/* Hero image — full bleed */}
        <div className="relative w-full bg-gray-100" style={{ aspectRatio: '1 / 1.05', maxHeight: '92vw' }}>
          {e.banner_url
            ? <Image src={e.banner_url} alt={e.title} fill className="object-cover" priority />
            : <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <span className="text-7xl font-black text-gray-200">{e.title[0]}</span>
              </div>
          }
          {/* Floating nav */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-5">
            <BackButton variant="overlay" />
            <div className="flex items-center gap-2">
              <div className="bg-black/30 backdrop-blur-sm rounded-full">
                <SaveButton eventId={e.id} eventTitle={e.title} initialSaved={initialSaved}
                  serverUserId={user?.id ?? null} variant="icon" size="md" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Title block ── */}
        <div className="px-5 pt-6 pb-5">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <EventStatusBadge startDate={e.start_date} endDate={e.end_date} dailySchedule={e.daily_schedule} />
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              e.is_free
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}>
              {displayPrice}
            </span>
            {catInfo && e.category && (
              <Link
                href={`/events?category=${e.category}`}
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border transition-colors hover:opacity-80"
                style={{
                  background: catInfo.color ? `${catInfo.color}15` : '#f3f4f6',
                  color: catInfo.color ?? '#374151',
                  borderColor: catInfo.color ? `${catInfo.color}40` : '#e5e7eb',
                }}
              >
                {catInfo.icon && <span>{catInfo.icon}</span>}
                {catInfo.name}
              </Link>
            )}
            {almostFull && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                Almost full
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-[24px] font-extrabold text-gray-950 leading-tight tracking-tight mb-2">
            {e.title}
          </h1>

          {/* Attendance + countdown */}
          <div className="flex items-center gap-3 flex-wrap">
            {attendance > 0 && (
              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{attendance.toLocaleString()}</span> {attendance === 1 ? 'person' : 'people'} going
              </p>
            )}
            {lifecycle === 'upcoming' && (
              <p className="text-sm text-gray-400">
                <CountdownTimer startDate={e.start_date} />
              </p>
            )}
          </div>

          {/* Share */}
          <div className="mt-4">
            <ShareEventButton slug={e.slug} eventTitle={e.title} eventUrl={eventUrl}
              eventDate={shareDate} eventLocation={shareLocation} eventDescription={e.description ?? ''} bannerUrl={e.banner_url} />
          </div>

          {/* Flyer actions */}
          {e.banner_url && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={e.banner_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-indigo-200 text-sm font-semibold transition-all shadow-sm group"
              >
                <svg className="w-4 h-4 text-indigo-500 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Flyer
              </a>
              <DownloadFlyerButton bannerUrl={e.banner_url} eventTitle={e.title} />
            </div>
          )}
        </div>

        {/* ── Date / Location / Host card ── */}
        <div className="mx-5 mb-5 rounded-2xl border border-gray-100 bg-gray-50 divide-y divide-gray-100 overflow-hidden">
          {/* Date */}
          <div className="flex items-start gap-4 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4.5 h-4.5 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-snug">{displayDate}</p>
              <p className="text-sm text-gray-500 mt-0.5">{displayTime}
                {!e.time_tba && e.timezone && e.timezone !== 'UTC' && <> · <EventTimezone timezone={e.timezone} startDate={e.start_date} /></>}
              </p>
            </div>
          </div>
          {/* Location */}
          <div className="flex items-start gap-4 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              {e.is_online
                ? <Globe className="w-4.5 h-4.5 text-indigo-500" />
                : <MapPin className="w-4.5 h-4.5 text-indigo-500" />
              }
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-snug">{displayVenue}</p>
              {!e.is_online && e.city && (
                <p className="text-sm text-gray-500 mt-0.5">{[e.address, e.city, e.state].filter(Boolean).join(', ')}</p>
              )}
              {!e.is_online && ((e.location_name && e.location_name !== 'TBD') || e.address) && (
                <a href={`https://maps.google.com/?q=${mapsQ}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-semibold text-indigo-600 mt-1 inline-block">
                  Get directions →
                </a>
              )}
              {e.is_online && e.online_link && (
                <a href={e.online_link} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-semibold text-indigo-600 mt-1 inline-block">
                  Join link →
                </a>
              )}
            </div>
          </div>
          {/* Host */}
          {host && (
            <Link href={host.href} className="flex items-center gap-4 px-4 py-4 group">
              <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {host.img
                  ? <Image src={host.img} alt="" width={36} height={36} className="object-cover w-full h-full" />
                  : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">{host.name?.[0]}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Organised by</p>
                <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{host.name}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </Link>
          )}
        </div>

        {/* Inline CTA for rsvp/paid */}
        {registrationOpen && (e.registration_type === 'free_registration' || e.registration_type === 'paid' || (!e.registration_type && (e.rsvp_required || !e.is_free))) && (
          <div id="mobile-attend-form" className="px-5 pb-5">
            <CtaBlock compact />
          </div>
        )}

        {/* ── About ── */}
        {e.description && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="px-5 py-6">
              <h2 className="text-[17px] font-bold text-gray-900 mb-3">About this event</h2>
              <ReadMoreText text={e.description} limit={320} />
            </div>
          </>
        )}

        {/* ── Schedule ── */}
        {hasSchedule && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="px-5 py-6">
              <h2 className="text-[17px] font-bold text-gray-900 mb-4">Schedule</h2>
              <div className="space-y-5">
                {e.daily_schedule!.map((day: DaySchedule, i: number) => {
                  const sessions = day.sessions?.length ? day.sessions
                    : (day.start_time ? [{ title: null, start_time: day.start_time, end_time: day.end_time ?? null, speaker: null }] : [])
                  return (
                    <div key={day.date}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Day {i + 1}</span>
                        <span className="text-sm font-bold text-gray-900">{fmtDay(day.date)}</span>
                        {day.label && <span className="text-xs font-semibold text-indigo-500">— {day.label}</span>}
                      </div>
                      {sessions.length > 0 && (
                        <div className="ml-1 border-l-2 border-indigo-100 pl-4 space-y-0">
                          {sessions.map((s: { title: string | null; start_time: string | null; end_time: string | null; speaker: string | null }, sIdx: number) => (
                            <div key={sIdx} className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
                              <div>
                                {s.title && <p className="text-sm font-semibold text-gray-900">{s.title}</p>}
                                {s.speaker && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Mic className="w-3 h-3" />{s.speaker}</p>}
                              </div>
                              {s.start_time && (
                                <span className="text-xs font-semibold text-gray-400 tabular-nums flex-shrink-0 ml-3 pt-0.5">
                                  {fmt12(s.start_time)}{s.end_time ? ` – ${fmt12(s.end_time)}` : ''}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Speakers ── */}
        {e.speakers && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="px-5 py-6">
              <h2 className="text-[17px] font-bold text-gray-900 mb-3">Ministers &amp; Speakers</h2>
              <p className="text-[15px] text-gray-600 leading-relaxed">{e.speakers}</p>
            </div>
          </>
        )}

        {/* ── Tickets ── */}
        {!e.is_free && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="px-5 py-6">
              <h2 className="text-[17px] font-bold text-gray-900 mb-3">Tickets</h2>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                <Ticket className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  {e.price != null && <p className="text-base font-bold text-gray-900">{e.currency ?? '₦'}{e.price.toLocaleString()}</p>}
                  {e.payment_link && (
                    <a href={e.payment_link} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold text-indigo-600">Buy tickets →</a>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Capacity bar ── */}
        {e.capacity != null && e.capacity > 0 && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="px-5 py-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">{attendance} of {e.capacity} spots</span>
                <span className={`font-bold tabular-nums ${capacityPct >= 90 ? 'text-red-500' : 'text-gray-400'}`}>{capacityPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div style={{ width: `${capacityPct}%` }}
                  className={`h-full rounded-full transition-all ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              </div>
            </div>
          </>
        )}

        {/* ── Livestream ── */}
        {e.livestream_url && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="px-5 py-6">
              <h2 className="text-[17px] font-bold text-gray-900 mb-3">Livestream</h2>
              <a href={e.livestream_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <Globe className="w-4 h-4" /> Watch live →
              </a>
            </div>
          </>
        )}

        {/* ── Amenities ── */}
        {(e.parking_available || e.child_friendly || e.shuttle_available || e.wheelchair_accessible || e.food_provided || e.accommodation_available || e.dress_code || e.no_recording || e.gender_restriction || e.notes) && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="px-5 py-6 space-y-3">
              <h2 className="text-[17px] font-bold text-gray-900">Good to know</h2>
              <div className="flex flex-wrap gap-2">
                {e.parking_available       && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl"><Car className="w-4 h-4 text-gray-400" /> Parking available</span>}
                {e.shuttle_available       && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl"><Bus className="w-4 h-4 text-gray-400" /> Bus / shuttle</span>}
                {e.child_friendly          && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl"><Baby className="w-4 h-4 text-gray-400" /> Child-friendly</span>}
                {e.wheelchair_accessible   && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl"><Accessibility className="w-4 h-4 text-gray-400" /> Wheelchair accessible</span>}
                {e.food_provided           && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl"><UtensilsCrossed className="w-4 h-4 text-gray-400" /> Food provided</span>}
                {e.accommodation_available && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl"><BedDouble className="w-4 h-4 text-gray-400" /> Accommodation available</span>}
                {e.dress_code              && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl"><ShirtIcon className="w-4 h-4 text-amber-500" /> Dress code: {e.dress_code}</span>}
                {e.no_recording            && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl"><VideoOff className="w-4 h-4 text-red-400" /> No recording</span>}
                {e.gender_restriction      && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl"><UserCheck className="w-4 h-4 text-indigo-400" />{e.gender_restriction === 'women_only' ? 'Women only' : 'Men only'}</span>}
              </div>
              {e.notes && (
                <p className="text-sm text-gray-600 pl-4 border-l-2 border-indigo-200 leading-relaxed">{e.notes}</p>
              )}
            </div>
          </>
        )}

        {/* ── Tags ── */}
        {(e.tags?.length ?? 0) > 0 && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="px-5 py-5 flex flex-wrap gap-2">
              {e.tags!.map(tag => (
                <span key={tag} className="text-xs font-semibold text-gray-500 border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </>
        )}

        {/* ── Calendar + Share ── */}
        <div className="h-px bg-gray-100" />
        <div className="px-5 py-6 space-y-3">
          <h2 className="text-[17px] font-bold text-gray-900 mb-4">Save &amp; Share</h2>
          <div className="flex flex-wrap gap-2">
            <AddToCalendar title={e.title} startDate={e.start_date} endDate={e.end_date}
              location={shareLocation} description={e.description} />
            {!e.time_tba && e.timezone && e.timezone !== 'UTC' && <EventTimezone timezone={e.timezone} startDate={e.start_date} />}
          </div>
          <div className="mt-3">
            <ShareEventButton slug={e.slug} eventTitle={e.title} eventUrl={eventUrl}
              eventDate={shareDate} eventLocation={shareLocation} eventDescription={e.description ?? ''} bannerUrl={e.banner_url} />
          </div>
        </div>

        {/* ── Organizer ── */}
        {host && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="px-5 py-6">
              <h2 className="text-[17px] font-bold text-gray-900 mb-4">Hosted by</h2>
              <Link href={host.href} className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                  {host.img
                    ? <Image src={host.img} alt="" width={48} height={48} className="object-cover w-full h-full" />
                    : <div className="w-full h-full flex items-center justify-center text-base font-bold text-gray-400">{host.name?.[0]}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{host.name}</p>
                  {host.meta && <p className="text-sm text-gray-400 mt-0.5">{host.meta}</p>}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
              </Link>
            </div>
          </>
        )}

        {/* Views */}
        <div className="px-5 pb-4">
          <p className="text-xs text-gray-400">
            <ViewCounter eventId={e.id} initialCount={e.views_count ?? 0} />
          </p>
        </div>

        {/* ── More from this host ── */}
        {hostEvents.length > 0 && host && (
          <>
            <div className="h-2 bg-gray-50" />
            <div className="py-6">
              <div className="flex items-center justify-between px-5 mb-4">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">More from</p>
                  <h2 className="text-[17px] font-bold text-gray-900 leading-tight">{host.name}</h2>
                </div>
                <Link href={host.href} className="text-sm font-semibold text-indigo-600 flex-shrink-0">View all →</Link>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto pb-2 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
                {hostEvents.map(ev => (
                  <Link key={ev.id} href={`/events/${ev.slug}`} className="flex-shrink-0 w-[180px] group">
                    <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-2 relative">
                      {(ev as Event & { banner_url?: string | null }).banner_url
                        ? <Image src={(ev as Event & { banner_url?: string | null }).banner_url!} alt={ev.title} width={180} height={101} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-xl">{ev.title[0]}</div>
                      }
                      <span className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.is_free ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white'}`}>
                        {ev.is_free ? 'Free' : 'Paid'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">{ev.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(ev.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── You might also like ── */}
        {related.length > 0 && (
          <>
            <div className="h-2 bg-gray-50" />
            <div className="px-5 py-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[17px] font-bold text-gray-900">You might also like</h2>
                <Link href="/events" className="text-sm font-semibold text-indigo-600 hover:underline">See all</Link>
              </div>
              <div className="space-y-4">
                {related.slice(0, 3).map(ev => (
                  <Link key={ev.id} href={`/events/${ev.slug}`} className="flex gap-4 group">
                    <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {(ev as Event & { banner_url?: string | null }).banner_url
                        ? <Image src={(ev as Event & { banner_url?: string | null }).banner_url!} alt={ev.title} width={72} height={72} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200" />
                        : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 font-bold text-lg">{ev.title[0]}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-[15px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">{ev.title}</p>
                      <p className="text-sm text-gray-400 mt-1">{formatDate(ev.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="h-2 bg-gray-50" />
        <div className="px-5 py-6">
          <HaveAnEventCTA />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP  (hidden below lg)
      ══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block font-jakarta">

        {/* ── Full-width hero banner ── */}
        <div className="relative w-full bg-gray-100 overflow-hidden" style={{ height: '420px' }}>
          {e.banner_url
            ? <Image src={e.banner_url} alt={e.title} fill className="object-cover" priority />
            : <div className="absolute inset-0 flex items-center justify-center text-9xl font-black text-gray-200">{e.title[0]}</div>
          }
          {/* Back button overlaid */}
          <div className="absolute top-6 left-6">
            <Link href="/events"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-black/30 backdrop-blur-md px-3 py-2 rounded-full hover:bg-black/50 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Events
            </Link>
          </div>

          {/* Save button overlaid */}
          <div className="absolute top-6 right-6 bg-black/30 backdrop-blur-md rounded-full">
            <SaveButton eventId={e.id} eventTitle={e.title} initialSaved={initialSaved}
              serverUserId={user?.id ?? null} variant="icon" size="md" />
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="max-w-5xl mx-auto px-6 lg:px-8 pt-8 pb-16">
          <div className="flex gap-10">

            {/* ── LEFT: main content ─────────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* Title + badges — below banner */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <EventStatusBadge startDate={e.start_date} endDate={e.end_date} dailySchedule={e.daily_schedule} />
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    e.is_free
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>{displayPrice}</span>
                  {catInfo && e.category && (
                    <Link
                      href={`/events?category=${e.category}`}
                      className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border transition-colors hover:opacity-80"
                      style={{
                        background: catInfo.color ? `${catInfo.color}15` : '#f3f4f6',
                        color: catInfo.color ?? '#374151',
                        borderColor: catInfo.color ? `${catInfo.color}40` : '#e5e7eb',
                      }}
                    >
                      {catInfo.icon && <span>{catInfo.icon}</span>}
                      {catInfo.name}
                    </Link>
                  )}
                  {almostFull && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">Almost Full</span>
                  )}
                  {attendance > 0 && (
                    <span className="ml-auto text-sm text-gray-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {attendance.toLocaleString()} going
                    </span>
                  )}
                </div>
                <h1 className="text-[32px] font-extrabold text-gray-950 leading-tight tracking-tight">
                  {e.title}
                </h1>
              </div>

              {/* Date / Location / Host — unified card */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 divide-y divide-gray-100 overflow-hidden mb-8">
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-snug">{displayDate}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{displayTime}
                      {!e.time_tba && e.timezone && e.timezone !== 'UTC' && <> · <EventTimezone timezone={e.timezone} startDate={e.start_date} /></>}
                    </p>
                    {lifecycle === 'upcoming' && (
                      <p className="text-xs text-indigo-500 font-semibold mt-1">
                        <CountdownTimer startDate={e.start_date} />
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    {e.is_online
                      ? <Globe className="w-4 h-4 text-indigo-500" />
                      : <MapPin className="w-4 h-4 text-indigo-500" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-snug">{displayVenue}</p>
                    {!e.is_online && e.city && (
                      <p className="text-sm text-gray-500 mt-0.5">{[e.address, e.city, e.state].filter(Boolean).join(', ')}</p>
                    )}
                    {!e.is_online && ((e.location_name && e.location_name !== 'TBD') || e.address) && (
                      <a href={`https://maps.google.com/?q=${mapsQ}`} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-indigo-600 mt-1 inline-block">Get directions →</a>
                    )}
                    {e.is_online && e.online_link && (
                      <a href={e.online_link} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-indigo-600 mt-1 inline-block">Join link →</a>
                    )}
                  </div>
                </div>
                {host && (
                  <Link href={host.href} className="flex items-center gap-4 px-5 py-4 group">
                    <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {host.img
                        ? <Image src={host.img} alt="" width={36} height={36} className="object-cover w-full h-full" />
                        : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">{host.name?.[0]}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Organised by</p>
                      <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{host.name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </Link>
                )}
              </div>

              {/* About */}
              {e.description && (
                <div className="mb-8">
                  <h2 className="text-[17px] font-bold text-gray-900 mb-3">About this event</h2>
                  <ReadMoreText text={e.description} limit={600} />
                </div>
              )}

              <div className="h-px bg-gray-100 mb-8" />

              {/* Schedule */}
              {hasSchedule && (
                <div className="mb-8">
                  <h2 className="text-[17px] font-bold text-gray-900 mb-4">Schedule</h2>
                  <div className="space-y-5">
                    {e.daily_schedule!.map((day: DaySchedule, i: number) => {
                      const sessions = day.sessions?.length ? day.sessions
                        : (day.start_time ? [{ title: null, start_time: day.start_time, end_time: day.end_time ?? null, speaker: null }] : [])
                      return (
                        <div key={day.date}>
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Day {i + 1}</span>
                            <span className="text-sm font-bold text-gray-900">{fmtDay(day.date)}</span>
                            {day.label && <span className="text-xs font-semibold text-indigo-500">— {day.label}</span>}
                          </div>
                          {sessions.length > 0 && (
                            <div className="ml-1 border-l-2 border-indigo-100 pl-4 space-y-0">
                              {sessions.map((s: { title: string | null; start_time: string | null; end_time: string | null; speaker: string | null }, sIdx: number) => (
                                <div key={sIdx} className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
                                  <div>
                                    {s.title && <p className="text-sm font-semibold text-gray-900">{s.title}</p>}
                                    {s.speaker && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Mic className="w-3 h-3" />{s.speaker}</p>}
                                  </div>
                                  {s.start_time && (
                                    <span className="text-xs font-semibold text-gray-400 tabular-nums flex-shrink-0 ml-3 pt-0.5">
                                      {fmt12(s.start_time)}{s.end_time ? ` – ${fmt12(s.end_time)}` : ''}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Speakers */}
              {e.speakers && (
                <div className="mb-8">
                  <h2 className="text-[17px] font-bold text-gray-900 mb-3">Ministers &amp; Speakers</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{e.speakers}</p>
                </div>
              )}

              {/* Tickets */}
              {!e.is_free && e.price != null && (
                <div className="mb-8">
                  <h2 className="text-[17px] font-bold text-gray-900 mb-3">Tickets</h2>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                    <Ticket className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-base font-bold text-gray-900">{e.currency ?? '₦'}{e.price.toLocaleString()}</p>
                      {e.payment_link && (
                        <a href={e.payment_link} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-semibold text-indigo-600">Buy tickets →</a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Livestream */}
              {e.livestream_url && (
                <div className="mb-8">
                  <h2 className="text-[17px] font-bold text-gray-900 mb-3">Livestream</h2>
                  <a href={e.livestream_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                    <Globe className="w-4 h-4" /> Watch live →
                  </a>
                </div>
              )}

              {/* Amenities */}
              {(e.parking_available || e.child_friendly || e.shuttle_available || e.wheelchair_accessible || e.food_provided || e.accommodation_available || e.dress_code || e.no_recording || e.gender_restriction || e.notes) && (
                <div className="mb-8">
                  <h2 className="text-[17px] font-bold text-gray-900 mb-3">Good to know</h2>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {e.parking_available       && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl"><Car className="w-4 h-4 text-gray-400" /> Parking available</span>}
                    {e.shuttle_available       && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl"><Bus className="w-4 h-4 text-gray-400" /> Bus / shuttle</span>}
                    {e.child_friendly          && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl"><Baby className="w-4 h-4 text-gray-400" /> Child-friendly</span>}
                    {e.wheelchair_accessible   && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl"><Accessibility className="w-4 h-4 text-gray-400" /> Wheelchair accessible</span>}
                    {e.food_provided           && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl"><UtensilsCrossed className="w-4 h-4 text-gray-400" /> Food provided</span>}
                    {e.accommodation_available && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl"><BedDouble className="w-4 h-4 text-gray-400" /> Accommodation available</span>}
                    {e.dress_code              && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl"><ShirtIcon className="w-4 h-4 text-amber-500" /> Dress code: {e.dress_code}</span>}
                    {e.no_recording            && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl"><VideoOff className="w-4 h-4 text-red-400" /> No recording</span>}
                    {e.gender_restriction      && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl"><UserCheck className="w-4 h-4 text-indigo-400" />{e.gender_restriction === 'women_only' ? 'Women only' : 'Men only'}</span>}
                  </div>
                  {e.notes && <p className="text-sm text-gray-600 pl-4 border-l-2 border-indigo-200 leading-relaxed">{e.notes}</p>}
                </div>
              )}

              {/* Tags */}
              {(e.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {e.tags!.map(tag => (
                    <span key={tag} className="text-xs font-semibold text-gray-500 border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="h-px bg-gray-100 mb-8" />

              {/* Organizer */}
              {host && (
                <div className="mb-8">
                  <h2 className="text-[17px] font-bold text-gray-900 mb-4">Hosted by</h2>
                  <Link href={host.href} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      {host.img
                        ? <Image src={host.img} alt="" width={48} height={48} className="object-cover w-full h-full" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-base">{host.name?.[0]}</div>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{host.name}</p>
                      {host.meta && <p className="text-sm text-gray-400 mt-0.5">{host.meta}</p>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                  </Link>
                </div>
              )}

              <div className="h-px bg-gray-100 mb-8" />

              {/* More from this host */}
              {hostEvents.length > 0 && host && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">More from</p>
                      <h2 className="text-[17px] font-bold text-gray-900">{host.name}</h2>
                    </div>
                    <Link href={host.href} className="text-sm font-semibold text-indigo-600 hover:underline">View all →</Link>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {hostEvents.map(ev => (
                      <Link key={ev.id} href={`/events/${ev.slug}`} className="group block">
                        <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-2.5 relative">
                          {(ev as Event & { banner_url?: string | null }).banner_url
                            ? <Image src={(ev as Event & { banner_url?: string | null }).banner_url!} alt={ev.title} width={240} height={135} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200" />
                            : <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-lg">{ev.title[0]}</div>
                          }
                          <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.is_free ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white'}`}>
                            {ev.is_free ? 'Free' : 'Paid'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">{ev.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(ev.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* You might also like */}
              {related.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[17px] font-bold text-gray-900">You might also like</h2>
                    <Link href="/events" className="text-sm font-semibold text-indigo-600 hover:underline">See all</Link>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {related.slice(0, 3).map(ev => (
                      <Link key={ev.id} href={`/events/${ev.slug}`} className="group block">
                        <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-2.5">
                          {(ev as Event & { banner_url?: string | null }).banner_url
                            ? <Image src={(ev as Event & { banner_url?: string | null }).banner_url!} alt={ev.title} width={240} height={135} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200" />
                            : <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-lg">{ev.title[0]}</div>
                          }
                        </div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">{ev.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(ev.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <HaveAnEventCTA />
            </div>

            {/* ── RIGHT: sticky sidebar ──────────────────────────── */}
            <div className="w-[290px] flex-shrink-0">
              <div className="sticky top-6 space-y-4">

                {/* CTA card */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 space-y-3">
                    <CtaBlock />
                  </div>

                  {/* Key info */}
                  <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50/60">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{displayDate}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{displayTime}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      {e.is_online ? <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" /> : <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{displayVenue}</p>
                        {!e.is_online && e.city && <p className="text-xs text-gray-500 mt-0.5">{e.city}, {e.state}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Ticket className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className={`text-sm font-bold ${e.is_free ? 'text-emerald-700' : 'text-gray-900'}`}>{displayPrice}</p>
                    </div>
                    {attendance > 0 && (
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-500">{attendance.toLocaleString()} {attendance === 1 ? 'person' : 'people'} going</p>
                      </div>
                    )}
                    {e.capacity != null && e.capacity > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                          <span>{attendance} / {e.capacity} spots</span>
                          <span>{capacityPct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div style={{ width: `${capacityPct}%` }}
                            className={`h-full rounded-full ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Calendar + share */}
                  <div className="border-t border-gray-100 px-5 py-4 space-y-2">
                    <AddToCalendar title={e.title} startDate={e.start_date} endDate={e.end_date}
                      location={shareLocation} description={e.description} />
                    <ShareEventButton slug={e.slug} eventTitle={e.title} eventUrl={eventUrl}
                      eventDate={shareDate} eventLocation={shareLocation} eventDescription={e.description ?? ''} bannerUrl={e.banner_url} />
                  </div>

                  {/* Flyer actions */}
                  {e.banner_url && (
                    <div className="border-t border-gray-100 px-5 py-4">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Event Flyer</p>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={e.banner_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-indigo-200 text-sm font-semibold transition-all shadow-sm group"
                        >
                          <svg className="w-4 h-4 text-indigo-500 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          View Flyer
                        </a>
                        <DownloadFlyerButton bannerUrl={e.banner_url} eventTitle={e.title} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Views */}
                <p className="text-xs text-gray-400 flex justify-end px-1">
                  <ViewCounter eventId={e.id} initialCount={e.views_count ?? 0} />
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <EventQuickActions
        eventId={e.id}
        eventTitle={e.title}
        eventDate={shareDate}
        eventUrl={e.payment_link ?? eventUrl}
        isFree={e.is_free}
        rsvpRequired={e.rsvp_required}
        lifecycle={registrationOpen ? lifecycle : 'ended'}
        attendanceCount={attendance}
        registrationType={e.registration_type}
        isOrganizer={isOrganizer}
        initialAttended={initialAttended}
        serverUserId={user?.id ?? null}
      />
    </div>
  )
}
