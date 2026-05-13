import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import BackButton from '@/components/ui/BackButton'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { formatDate, formatTime } from '@/lib/utils'
import { getCategoryMap } from '@/lib/categories'
import { Calendar, MapPin, Clock, Building2, Globe, ChevronLeft, Car, Baby, Mic, Ticket, Users, ChevronRight } from 'lucide-react'
import type { DaySchedule } from '@/types/database'
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

  const [
    { count: attendanceCount },
    initialAttended,
    initialSaved,
    { data: relatedCat },
    { data: relatedCity },
    { count: hostEventCount },
  ] = await Promise.all([
    admin.from('attendances').select('id', { count: 'exact', head: true }).eq('event_id', e.id),
    checkUserAttended(e.id),
    checkEventSaved(e.id),
    supabase.from('events').select('id,title,slug,start_date,city,banner_url,is_free').eq('status','approved').eq('category',e.category).neq('id',e.id).gte('start_date',new Date().toISOString()).limit(3),
    supabase.from('events').select('id,title,slug,start_date,city,banner_url,is_free').eq('status','approved').eq('city',e.city).neq('category',e.category).neq('id',e.id).gte('start_date',new Date().toISOString()).limit(2),
    e.church_id
      ? admin.from('events').select('id',{count:'exact',head:true}).eq('church_id',e.church_id).eq('status','approved')
      : e.seeded_organizer_id
      ? admin.from('events').select('id',{count:'exact',head:true}).eq('seeded_organizer_id',e.seeded_organizer_id).eq('status','approved')
      : admin.from('events').select('id',{count:'exact',head:true}).eq('organizer_id',e.organizer_id).eq('status','approved'),
  ])

  const seenIds = new Set<string>()
  const related: Event[] = []
  for (const ev of [...(relatedCat ?? []), ...(relatedCity ?? [])]) {
    if (!seenIds.has(ev.id)) { seenIds.add(ev.id); related.push(ev as Event) }
  }

  const catMap = await getCategoryMap()
  const lifecycle = getEventLifecycle(e.start_date, e.end_date)
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
    ? (firstSessionTime ? fmt12(firstSessionTime) : 'Time TBA')
    : formatTime(e.start_date)
  const displayVenue = e.is_online
    ? (e.online_platform ?? 'Online Event')
    : [e.location_name, e.city].filter(Boolean).join(', ')
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
  const CtaBlock = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? '' : 'space-y-3'}>
      {lifecycle !== 'ended' ? (
        <RegistrationButton
          event={{ id: e.id, registration_type: e.registration_type, price: e.price, payment_link: e.payment_link, rsvp_required: e.rsvp_required, is_free: e.is_free, title: e.title }}
          userId={user?.id ?? null}
          userName={user?.user_metadata?.display_name ?? null}
          userEmail={user?.email ?? null}
          isOrganizer={isOrganizer}
          initialRegistered={initialAttended}
        />
      ) : (
        <div className="w-full text-center py-3 text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
          This event has ended
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
      <div className="lg:hidden">

        {/* Event flyer — full bleed, no overlay text */}
        <div className="relative w-full bg-gray-100" style={{ aspectRatio: '1 / 1.05', maxHeight: '90vw' }}>
          {e.banner_url
            ? <Image src={e.banner_url} alt={e.title} fill className="object-cover" priority />
            : <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <span className="text-6xl font-black text-gray-200">{e.title[0]}</span>
              </div>
          }
          {/* Minimal back + save — transparent so image reads fully */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
            <div className="bg-black/30 backdrop-blur-sm rounded-full">
              <BackButton />
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-full">
              <SaveButton eventId={e.id} eventTitle={e.title} initialSaved={initialSaved}
                serverUserId={user?.id ?? null} variant="icon" size="md" />
            </div>
          </div>
          {e.banner_url && (
            <div className="absolute bottom-3 right-3">
              <SaveFlyerButton bannerUrl={e.banner_url} eventTitle={e.title} />
            </div>
          )}
        </div>

        {/* Core info — the first thing they read after the image */}
        <div className="px-5 pt-5 pb-2">

          {/* Status + price badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <EventStatusBadge startDate={e.start_date} endDate={e.end_date} />
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              e.is_free
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {displayPrice}
            </span>
            {almostFull && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                Almost Full
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-[22px] font-bold text-gray-900 leading-snug mb-4">
            {e.title}
          </h1>

          {/* The three things people need to know immediately */}
          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{displayDate}</p>
                <p className="text-sm text-gray-500">{displayTime}
                  {e.timezone && e.timezone !== 'UTC' && <> · <EventTimezone timezone={e.timezone} startDate={e.start_date} /></>}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              {e.is_online
                ? <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                : <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              }
              <div>
                <p className="text-sm font-semibold text-gray-900">{displayVenue}</p>
                {!e.is_online && e.city && (
                  <p className="text-sm text-gray-500">{[e.address, e.city, e.state].filter(Boolean).join(', ')}</p>
                )}
                {!e.is_online && (
                  <a href={`https://maps.google.com/?q=${mapsQ}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline">
                    Get directions →
                  </a>
                )}
                {e.is_online && e.online_link && (
                  <a href={e.online_link} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline">
                    Join link →
                  </a>
                )}
              </div>
            </div>
            {host && (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center mt-0.5">
                  {host.img
                    ? <div className="w-4 h-4 rounded-full overflow-hidden"><Image src={host.img} alt="" width={16} height={16} className="object-cover" /></div>
                    : host.icon ?? <span className="w-4 h-4 rounded-full bg-gray-200 text-[8px] font-bold text-gray-500 flex items-center justify-center">{host.name?.[0]}</span>
                  }
                </div>
                <p className="text-sm text-gray-500">
                  Hosted by <Link href={host.href} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">{host.name}</Link>
                </p>
              </div>
            )}
          </div>

          {/* Attendance */}
          {attendance > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              <strong className="text-gray-900">{attendance.toLocaleString()}</strong> {attendance === 1 ? 'person' : 'people'} going
            </p>
          )}

          {/* Countdown */}
          {lifecycle === 'upcoming' && (
            <div className="mb-4 text-sm text-gray-500">
              Starts in: <CountdownTimer startDate={e.start_date} />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-5" />

        {/* About */}
        {e.description && (
          <div className="px-5 py-5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">About</p>
            <ReadMoreText text={e.description} limit={320} />
          </div>
        )}

        {/* Multi-day schedule */}
        {hasSchedule && (
          <>
            <div className="h-px bg-gray-100 mx-5" />
            <div className="px-5 py-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Schedule</p>
              <div className="space-y-5">
                {e.daily_schedule!.map((day: DaySchedule, i: number) => {
                  const sessions = day.sessions?.length ? day.sessions
                    : (day.start_time ? [{ title: null, start_time: day.start_time, end_time: day.end_time ?? null, speaker: null }] : [])
                  return (
                    <div key={day.date}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-gray-300 tabular-nums">Day {i + 1}</span>
                        <span className="text-sm font-semibold text-gray-900">{fmtDay(day.date)}</span>
                        {day.label && <span className="text-xs text-indigo-600 font-medium">— {day.label}</span>}
                      </div>
                      {sessions.length > 0 && (
                        <div className="space-y-0 ml-4 border-l-2 border-gray-100 pl-4">
                          {sessions.map((s: { title: string | null; start_time: string | null; end_time: string | null; speaker: string | null }, sIdx: number) => (
                            <div key={sIdx} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                              <div>
                                {s.title && <p className="text-sm font-medium text-gray-900">{s.title}</p>}
                                {s.speaker && <p className="text-xs text-gray-400 mt-0.5">{s.speaker}</p>}
                              </div>
                              {s.start_time && (
                                <span className="text-xs text-gray-400 tabular-nums flex-shrink-0 ml-3 pt-0.5">
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

        {/* Speakers */}
        {e.speakers && (
          <>
            <div className="h-px bg-gray-100 mx-5" />
            <div className="px-5 py-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Ministers &amp; Speakers</p>
              <p className="text-sm text-gray-700 leading-relaxed">{e.speakers}</p>
            </div>
          </>
        )}

        {/* Ticket info */}
        {!e.is_free && (
          <>
            <div className="h-px bg-gray-100 mx-5" />
            <div className="px-5 py-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Tickets</p>
              <div className="flex items-center gap-3">
                <Ticket className="w-4 h-4 text-gray-400" />
                <div>
                  {e.price != null && <p className="text-sm font-semibold text-gray-900">{e.currency ?? '₦'}{e.price.toLocaleString()}</p>}
                  {e.payment_link && (
                    <a href={e.payment_link} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">Buy tickets →</a>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Capacity */}
        {e.capacity != null && e.capacity > 0 && (
          <>
            <div className="h-px bg-gray-100 mx-5" />
            <div className="px-5 py-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{attendance} of {e.capacity} spots taken</span>
                <span className={capacityPct >= 90 ? 'text-red-500 font-semibold' : ''}>{capacityPct}% full</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div style={{ width: `${capacityPct}%` }}
                  className={`h-full rounded-full transition-all ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              </div>
            </div>
          </>
        )}

        {/* Livestream */}
        {e.livestream_url && (
          <>
            <div className="h-px bg-gray-100 mx-5" />
            <div className="px-5 py-5">
              <a href={e.livestream_url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-2">
                <Globe className="w-4 h-4" /> Watch Livestream
              </a>
            </div>
          </>
        )}

        {/* Amenities + notes */}
        {(e.parking_available || e.child_friendly || e.notes) && (
          <>
            <div className="h-px bg-gray-100 mx-5" />
            <div className="px-5 py-5 space-y-3">
              <div className="flex flex-wrap gap-4">
                {e.parking_available && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Car className="w-4 h-4 text-gray-400" /> Parking available
                  </span>
                )}
                {e.child_friendly && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Baby className="w-4 h-4 text-gray-400" /> Child friendly
                  </span>
                )}
              </div>
              {e.notes && (
                <p className="text-sm text-gray-600 pl-3 border-l-2 border-gray-200">{e.notes}</p>
              )}
            </div>
          </>
        )}

        {/* Tags */}
        {(e.tags?.length ?? 0) > 0 && (
          <>
            <div className="h-px bg-gray-100 mx-5" />
            <div className="px-5 py-4 flex flex-wrap gap-2">
              {e.tags!.map(tag => (
                <span key={tag} className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          </>
        )}

        {/* Calendar + share */}
        <div className="h-px bg-gray-100 mx-5" />
        <div className="px-5 py-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <AddToCalendar title={e.title} startDate={e.start_date} endDate={e.end_date}
              location={shareLocation} description={e.description} />
            {e.timezone && e.timezone !== 'UTC' && <EventTimezone timezone={e.timezone} startDate={e.start_date} />}
          </div>
          <ShareButton eventTitle={e.title} eventUrl={eventUrl} eventDate={shareDate}
            eventLocation={shareLocation} eventDescription={e.description ?? ''} bannerUrl={e.banner_url} />
        </div>

        {/* Organizer */}
        {host && (
          <>
            <div className="h-px bg-gray-100 mx-5" />
            <div className="px-5 py-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Hosted by</p>
              <Link href={host.href} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                  {host.img
                    ? <Image src={host.img} alt="" width={40} height={40} className="object-cover w-full h-full" />
                    : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">{host.name?.[0]}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{host.name}</p>
                  {host.meta && <p className="text-xs text-gray-400">{host.meta}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
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

        {/* Related events */}
        {related.length > 0 && (
          <>
            <div className="h-2 bg-gray-50" />
            <div className="px-5 py-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">More Events</p>
                <Link href="/events" className="text-xs text-indigo-600 font-medium hover:underline">See all</Link>
              </div>
              <div className="space-y-3">
                {related.slice(0, 3).map(ev => (
                  <Link key={ev.id} href={`/events/${ev.slug}`} className="flex gap-3 group">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {(ev as Event & { banner_url?: string | null }).banner_url
                        ? <Image src={(ev as Event & { banner_url?: string | null }).banner_url!} alt={ev.title} width={64} height={64} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200" />
                        : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 font-bold text-sm">{ev.title[0]}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">{ev.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(ev.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="h-2 bg-gray-50" />
        <div className="px-5 py-5">
          <HaveAnEventCTA />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP  (hidden below lg)
      ══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 pt-6 pb-16">

          <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Events
          </Link>

          <div className="flex gap-12">

            {/* ── LEFT: content ─────────────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* Flyer */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100 mb-7" style={{ aspectRatio: '16/9' }}>
                {e.banner_url
                  ? <Image src={e.banner_url} alt={e.title} fill className="object-cover" priority />
                  : <div className="absolute inset-0 flex items-center justify-center text-8xl font-black text-gray-200">{e.title[0]}</div>
                }
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <EventStatusBadge startDate={e.start_date} endDate={e.end_date} />
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  e.is_free ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-700'
                }`}>{displayPrice}</span>
                {almostFull && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">Almost Full</span>}
                {attendance > 0 && (
                  <span className="ml-auto text-sm text-gray-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {attendance.toLocaleString()} going
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-5">{e.title}</h1>

              {/* Date / time / location — the non-negotiables */}
              <div className="space-y-3 mb-7">
                <div className="flex items-start gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{displayDate}</p>
                    <p className="text-gray-500">{displayTime}
                      {e.timezone && e.timezone !== 'UTC' && <> · <EventTimezone timezone={e.timezone} startDate={e.start_date} /></>}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  {e.is_online ? <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" /> : <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className="font-semibold text-gray-900">{displayVenue}</p>
                    {!e.is_online && <p className="text-gray-500">{[e.address, e.city, e.state].filter(Boolean).join(', ')}</p>}
                    {!e.is_online && <a href={`https://maps.google.com/?q=${mapsQ}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">Get directions →</a>}
                    {e.is_online && e.online_link && <a href={e.online_link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">Join link →</a>}
                  </div>
                </div>
                {host && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                      {host.img
                        ? <div className="w-4 h-4 rounded-full overflow-hidden"><Image src={host.img} alt="" width={16} height={16} className="object-cover" /></div>
                        : host.icon ?? <span className="text-gray-400">{host.name?.[0]}</span>
                      }
                    </div>
                    <p className="text-gray-500">
                      Hosted by <Link href={host.href} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">{host.name}</Link>
                    </p>
                  </div>
                )}
              </div>

              <hr className="border-gray-100 mb-7" />

              {/* About */}
              {e.description && (
                <div className="mb-7">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">About this event</p>
                  <ReadMoreText text={e.description} limit={500} />
                </div>
              )}

              {/* Schedule */}
              {hasSchedule && (
                <div className="mb-7">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Schedule · {e.daily_schedule!.length} days</p>
                  <div className="space-y-4">
                    {e.daily_schedule!.map((day: DaySchedule, i: number) => {
                      const sessions = day.sessions?.length ? day.sessions
                        : (day.start_time ? [{ title: null, start_time: day.start_time, end_time: day.end_time ?? null, speaker: null }] : [])
                      return (
                        <div key={day.date}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs text-gray-300 tabular-nums">Day {i + 1}</span>
                            <span className="text-sm font-semibold text-gray-900">{fmtDay(day.date)}</span>
                            {day.label && <span className="text-xs text-indigo-600 font-medium truncate">— {day.label}</span>}
                          </div>
                          {sessions.length > 0 && (
                            <div className="ml-3 border-l-2 border-gray-100 pl-3 space-y-1">
                              {sessions.map((s: { title: string | null; start_time: string | null; end_time: string | null; speaker: string | null }, sIdx: number) => (
                                <div key={sIdx} className="flex items-start justify-between">
                                  {s.title && <span className="text-xs text-gray-700">{s.title}</span>}
                                  {s.start_time && (
                                    <span className="text-xs text-gray-400 tabular-nums ml-2 flex-shrink-0">
                                      {fmt12(s.start_time)}
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
                <div className="mb-7">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Ministers &amp; Speakers</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{e.speakers}</p>
                </div>
              )}

              {/* Tickets (paid) */}
              {!e.is_free && e.price != null && (
                <div className="mb-7">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Tickets</p>
                  <p className="text-sm font-semibold text-gray-900">{e.currency ?? '₦'}{e.price.toLocaleString()}</p>
                  {e.payment_link && <a href={e.payment_link} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">Buy tickets →</a>}
                </div>
              )}

              {/* Livestream */}
              {e.livestream_url && (
                <div className="mb-7">
                  <a href={e.livestream_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline">
                    <Globe className="w-4 h-4" /> Watch Livestream
                  </a>
                </div>
              )}

              {/* Venue map */}
              {!e.is_online && (
                <div className="mb-7">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Venue</p>
                  <p className="text-sm font-medium text-gray-900">{e.location_name}</p>
                  {e.address && <p className="text-sm text-gray-500">{e.address}</p>}
                  <p className="text-sm text-gray-500">{e.city}, {e.state}</p>
                  <a href={`https://maps.google.com/?q=${mapsQ}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline mt-1 inline-block">Open in Google Maps →</a>
                </div>
              )}

              {/* Amenities */}
              {(e.parking_available || e.child_friendly || e.notes) && (
                <div className="mb-7 space-y-3">
                  <div className="flex flex-wrap gap-4">
                    {e.parking_available && <span className="flex items-center gap-1.5 text-sm text-gray-600"><Car className="w-4 h-4 text-gray-400" /> Parking available</span>}
                    {e.child_friendly && <span className="flex items-center gap-1.5 text-sm text-gray-600"><Baby className="w-4 h-4 text-gray-400" /> Child friendly</span>}
                  </div>
                  {e.notes && <p className="text-sm text-gray-600 pl-3 border-l-2 border-gray-200">{e.notes}</p>}
                </div>
              )}

              {/* Tags */}
              {(e.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 mb-7">
                  {e.tags!.map(tag => <span key={tag} className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full">#{tag}</span>)}
                </div>
              )}

              <hr className="border-gray-100 mb-7" />

              {/* Organizer card */}
              {host && (
                <div className="mb-7">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Hosted by</p>
                  <Link href={host.href} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      {host.img
                        ? <Image src={host.img} alt="" width={48} height={48} className="object-cover w-full h-full" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{host.name?.[0]}</div>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{host.name}</p>
                      {host.meta && <p className="text-sm text-gray-400">{host.meta}</p>}
                    </div>
                    <span className="text-sm text-indigo-600 font-medium group-hover:underline">View profile →</span>
                  </Link>
                </div>
              )}

              <hr className="border-gray-100 mb-7" />

              {/* Related */}
              {related.length > 0 && (
                <div className="mb-7">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">More Events</p>
                    <Link href="/events" className="text-sm text-indigo-600 hover:underline">See all</Link>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {related.slice(0, 3).map(ev => (
                      <Link key={ev.id} href={`/events/${ev.slug}`} className="group block">
                        <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-2">
                          {(ev as Event & { banner_url?: string | null }).banner_url
                            ? <Image src={(ev as Event & { banner_url?: string | null }).banner_url!} alt={ev.title} width={240} height={135} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200" />
                            : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 font-bold">{ev.title[0]}</div>
                          }
                        </div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">{ev.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(ev.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <HaveAnEventCTA />
            </div>

            {/* ── RIGHT: sticky sidebar ──────────────────────────── */}
            <div className="w-[280px] flex-shrink-0">
              <div className="sticky top-6">

                {/* CTA card */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="p-5 space-y-3">
                    <CtaBlock />
                  </div>

                  {/* Key info repeated — so users never have to scroll to check */}
                  <div className="border-t border-gray-100 px-5 py-4 space-y-3.5 bg-gray-50/60">
                    <div className="flex items-start gap-2.5 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 leading-snug">{displayDate}</p>
                        <p className="text-gray-500 text-xs">{displayTime}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm">
                      {e.is_online ? <Globe className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" /> : <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className="font-medium text-gray-900 leading-snug">{displayVenue}</p>
                        {!e.is_online && e.city && <p className="text-gray-500 text-xs">{e.city}, {e.state}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <Ticket className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <p className={`font-semibold ${e.is_free ? 'text-emerald-700' : 'text-gray-900'}`}>{displayPrice}</p>
                    </div>
                    {attendance > 0 && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <p className="text-gray-500">{attendance.toLocaleString()} {attendance === 1 ? 'person' : 'people'} going</p>
                      </div>
                    )}
                    {lifecycle === 'upcoming' && (
                      <div className="text-xs text-gray-400">
                        <CountdownTimer startDate={e.start_date} />
                      </div>
                    )}
                    {e.capacity != null && e.capacity > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                          <span>{attendance} / {e.capacity} spots</span>
                          <span>{capacityPct}%</span>
                        </div>
                        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div style={{ width: `${capacityPct}%` }}
                            className={`h-full rounded-full ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Calendar + save flyer */}
                  <div className="border-t border-gray-100 px-5 py-4 space-y-2">
                    <AddToCalendar title={e.title} startDate={e.start_date} endDate={e.end_date}
                      location={shareLocation} description={e.description} />
                    {e.banner_url && <SaveFlyerButton bannerUrl={e.banner_url} eventTitle={e.title} />}
                  </div>
                </div>

                {/* Share — below the card, not inside it */}
                <div className="mt-5">
                  <ShareButton eventTitle={e.title} eventUrl={eventUrl} eventDate={shareDate}
                    eventLocation={shareLocation} eventDescription={e.description ?? ''} bannerUrl={e.banner_url} />
                </div>

                {/* Views */}
                <p className="mt-4 text-xs text-gray-400 flex justify-end">
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
        lifecycle={lifecycle}
        attendanceCount={attendance}
        registrationType={e.registration_type}
        isOrganizer={isOrganizer}
        initialAttended={initialAttended}
      />
    </div>
  )
}
