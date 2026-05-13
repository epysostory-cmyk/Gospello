import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Events · Gospello' }
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import EventCard from '@/components/ui/EventCard'
import { formatDate, formatTime } from '@/lib/utils'
import type { Event } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import { Search, MapPin, X } from 'lucide-react'
import NearMeButton from '@/components/ui/NearMeButton'
import Link from 'next/link'
import Image from 'next/image'
import HaveAnEventCTA from '@/components/ui/HaveAnEventCTA'

export const revalidate = 60

interface SearchParams {
  q?: string
  city?: string
  state?: string
  country?: string
  category?: string
  timeframe?: 'today' | 'week' | 'weekend'
  page?: string
}

const PAGE_SIZE = 12

const FALLBACK_CATEGORIES = [
  { slug: 'worship',    name: 'Worship',    icon: '🙏' },
  { slug: 'prayer',     name: 'Prayer',     icon: '✨' },
  { slug: 'conference', name: 'Conference', icon: '🎤' },
  { slug: 'youth',      name: 'Youth',      icon: '🌟' },
  { slug: 'training',   name: 'Training',   icon: '📖' },
  { slug: 'concert',    name: 'Concert',    icon: '🎵' },
  { slug: 'other',      name: 'Other',      icon: '⭐' },
]

const TIMEFRAME_OPTIONS = [
  { value: 'today',   label: 'Today',        emoji: '📅' },
  { value: 'weekend', label: 'This Weekend',  emoji: '🎉' },
  { value: 'week',    label: 'This Week',     emoji: '🗓️' },
] as const

function scoreEvent(event: Event, now: Date): number {
  let score = 0
  const lifecycle = getEventLifecycle(event.start_date, event.end_date)
  if (lifecycle === 'ongoing') return 200 + (event.is_featured ? 40 : 0)
  if (lifecycle === 'ended') return -100
  const daysUntil = (new Date(event.start_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (daysUntil <= 7)  score += 50
  else if (daysUntil <= 14) score += 30
  else if (daysUntil <= 30) score += 15
  score += Math.min((event.views_count ?? 0) / 10, 20)
  if (event.is_featured) score += 40
  return score
}

async function getEvents(params: SearchParams) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const page = parseInt(params.page ?? '1', 10)
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const now = new Date().toISOString()

  let query = supabase
    .from('events')
    .select('*, churches(*)')
    .eq('status', 'approved')
    .eq('visibility', 'public')
    .or(`end_date.gte.${now},start_date.gte.${now}`)
    .order('start_date', { ascending: true })

  if (params.q)        query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%,location_name.ilike.%${params.q}%`)
  if (params.city)     query = query.ilike('city', `%${params.city}%`)
  if (params.state)    query = query.eq('state', params.state)
  if (params.country)  query = query.eq('country', params.country)
  if (params.category) query = query.eq('category', params.category)

  if (params.timeframe === 'today') {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)
    query = query
      .lte('start_date', todayEnd.toISOString())
      .or(`end_date.gte.${todayStart.toISOString()},and(end_date.is.null,start_date.gte.${todayStart.toISOString()})`)
  }
  if (params.timeframe === 'weekend') {
    const now = new Date()
    const daysUntilFriday = (5 - now.getDay() + 7) % 7
    const friday  = new Date(now); friday.setDate(now.getDate() + daysUntilFriday); friday.setHours(0, 0, 0, 0)
    const sunday  = new Date(friday); sunday.setDate(friday.getDate() + 2); sunday.setHours(23, 59, 59, 999)
    query = query.gte('start_date', friday.toISOString()).lte('start_date', sunday.toISOString())
  }
  if (params.timeframe === 'week') {
    const now      = new Date()
    const sunday   = new Date(now); sunday.setDate(now.getDate() - now.getDay()); sunday.setHours(0, 0, 0, 0)
    const saturday = new Date(sunday); saturday.setDate(sunday.getDate() + 6); saturday.setHours(23, 59, 59, 999)
    query = query.gte('start_date', sunday.toISOString()).lte('start_date', saturday.toISOString())
  }

  const { data } = await query
  const allSorted  = (data ?? []) as Event[]
  const total      = allSorted.length
  const events     = allSorted.slice(from, to + 1)

  let attendanceCountMap: Record<string, number> = {}
  if (events.length > 0) {
    const { data: rows } = await adminClient
      .from('attendances')
      .select('event_id')
      .in('event_id', events.map(e => e.id))
    for (const row of rows ?? []) {
      attendanceCountMap[row.event_id] = (attendanceCountMap[row.event_id] ?? 0) + 1
    }
  }

  return { events, total, page, pages: Math.ceil(total / PAGE_SIZE), attendanceCountMap }
}

async function getLocationOptions() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('country, state')
    .eq('status', 'approved')
    .eq('visibility', 'public')
  const rows      = data ?? []
  const countries = [...new Set(rows.map(r => r.country).filter(Boolean))].sort() as string[]
  const states    = [...new Set(rows.map(r => r.state).filter(Boolean))].sort() as string[]
  return { countries, states }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const adminClient = createAdminClient()

  const [{ events, total, page, pages, attendanceCountMap }, categoriesRes, locationOptions] = await Promise.all([
    getEvents(params),
    adminClient
      .from('categories')
      .select('id, name, slug, icon, color')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true }),
    getLocationOptions(),
  ])

  const { countries: availableCountries, states: availableStates } = locationOptions
  const categoryOptions = categoriesRes.data?.length ? categoriesRes.data : FALLBACK_CATEGORIES
  const catMap = Object.fromEntries(
    (categoriesRes.data ?? []).map(c => [c.slug, { name: c.name, icon: c.icon ?? null, color: c.color ?? '#6B7280' }])
  )

  function buildUrl(overrides: Partial<SearchParams>) {
    const merged = { ...params, ...overrides }
    const qs = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v) qs.set(k, String(v)) })
    const str = qs.toString()
    return `/events${str ? `?${str}` : ''}`
  }

  const hasFilters = !!(params.q || params.city || params.state || params.country || params.category || params.timeframe)
  const activeCategoryLabel = params.category
    ? categoryOptions.find(c => c.slug === params.category)?.name
    : null

  /* Split featured vs regular for the "no filter" browse view */
  const featuredEvents  = !hasFilters ? events.filter(e => e.is_featured && getEventLifecycle(e.start_date, e.end_date) !== 'ended') : []
  const regularEvents   = !hasFilters ? events.filter(e => !e.is_featured || getEventLifecycle(e.start_date, e.end_date) === 'ended') : events

  const now = new Date()
  const thisWeekEvents = !hasFilters
    ? regularEvents.filter(e => {
        const d = (new Date(e.start_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        return d >= 0 && d <= 7 && getEventLifecycle(e.start_date, e.end_date) !== 'ended'
      })
    : []

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-4">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {activeCategoryLabel ? `${activeCategoryLabel} Events` : 'Gospel Events'}
            </h1>
            {total > 0 && (
              <p className="text-sm text-gray-400">
                {total.toLocaleString()} event{total !== 1 ? 's' : ''}
                {params.state ? ` · ${params.state}` : params.city ? ` · ${params.city}` : ''}
              </p>
            )}
          </div>

          {/* Search */}
          <form method="GET" action="/events" className="flex gap-2 max-w-xl mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Search events, churches, cities…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {params.category  && <input type="hidden" name="category"  value={params.category} />}
            {params.state     && <input type="hidden" name="state"     value={params.state} />}
            {params.timeframe && <input type="hidden" name="timeframe" value={params.timeframe} />}
            <button type="submit" className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Search
            </button>
            {params.q && (
              <Link href={buildUrl({ q: undefined, page: undefined })}
                className="flex-shrink-0 flex items-center px-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
                <X className="w-4 h-4" />
              </Link>
            )}
          </form>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href={buildUrl({ category: undefined, page: undefined })}
              className={`flex-shrink-0 text-sm font-semibold px-4 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                !params.category
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              All
            </Link>
            {categoryOptions.map((cat) => (
              <Link
                key={cat.slug}
                href={buildUrl({ category: cat.slug, page: undefined })}
                className={`flex-shrink-0 text-sm font-semibold px-4 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                  params.category === cat.slug
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Timeframe + location filter bar */}
        <div className="border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-2">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <Link
                key={tf.value}
                href={buildUrl({ timeframe: params.timeframe === tf.value ? undefined : tf.value, page: undefined })}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                  params.timeframe === tf.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                {tf.label}
              </Link>
            ))}

            <div className="flex items-center gap-2 ml-auto">
              <NearMeButton basePath="/events" compact />
              {availableStates.length > 0 && (
                <form method="GET" action="/events" className="flex items-center gap-1.5">
                  {params.q         && <input type="hidden" name="q"         value={params.q} />}
                  {params.category  && <input type="hidden" name="category"  value={params.category} />}
                  {params.timeframe && <input type="hidden" name="timeframe" value={params.timeframe} />}
                  <div className="relative flex items-center border border-gray-200 rounded-full overflow-hidden">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
                    <select
                      name="state"
                      defaultValue={params.state ?? ''}
                      className="pl-8 pr-4 py-1.5 text-xs font-semibold text-gray-700 bg-transparent focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">All States</option>
                      {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors">
                    Go
                  </button>
                </form>
              )}
            </div>

            {hasFilters && (
              <Link href="/events" className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── RESULTS ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Active filter chips */}
        {(params.q || params.state || params.city) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {params.q && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full">
                &ldquo;{params.q}&rdquo;
                <Link href={buildUrl({ q: undefined })} className="hover:text-indigo-900 leading-none">×</Link>
              </span>
            )}
            {params.state && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                📍 {params.state}
                <Link href={buildUrl({ state: undefined })} className="hover:text-gray-900 leading-none">×</Link>
              </span>
            )}
            {params.city && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                📍 {params.city}
                <Link href={buildUrl({ city: undefined })} className="hover:text-gray-900 leading-none">×</Link>
              </span>
            )}
          </div>
        )}

        {events.length === 0 ? (
          /* ── EMPTY STATE ── */
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-3xl">
              🔍
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {activeCategoryLabel ? `No ${activeCategoryLabel} events found` : 'No events found'}
            </h3>
            <p className="text-gray-500 mb-6 text-sm max-w-xs mx-auto">
              {hasFilters ? 'Try a different filter or search term' : 'New events are added regularly — check back soon'}
            </p>
            {hasFilters && (
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Browse all events
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* ── FEATURED EVENTS (no filter view only) ── */}
            {featuredEvents.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base font-black text-gray-900">⭐ Featured</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className={`grid gap-4 ${featuredEvents.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {featuredEvents.slice(0, 2).map(event => (
                    <EventCard key={event.id} event={event} variant="featured" categoryInfo={catMap[event.category]} attendanceCount={attendanceCountMap[event.id]} />
                  ))}
                </div>
              </section>
            )}

            {/* ── HAPPENING THIS WEEK (no filter view only) ── */}
            {thisWeekEvents.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base font-black text-gray-900">🔥 This Week</span>
                  <div className="flex-1 h-px bg-gray-200" />
                  <Link href={buildUrl({ timeframe: 'week' })} className="text-xs font-semibold text-indigo-600 hover:underline whitespace-nowrap">
                    See all →
                  </Link>
                </div>

                {/* Mobile: horizontal scroll */}
                <div className="flex gap-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:hidden pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {thisWeekEvents.slice(0, 6).map(event => (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      className="flex-shrink-0 w-52 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-transform"
                    >
                      <div className="relative h-32 bg-gray-100">
                        {event.banner_url
                          ? <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-4xl font-black text-gray-200">{event.title[0]}</div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${event.is_free ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                          {event.is_free ? 'Free' : 'Paid'}
                        </span>
                        <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-bold line-clamp-2 leading-snug">{event.title}</p>
                      </div>
                      <div className="px-3 py-2">
                        <p className="text-[11px] text-gray-500">
                          {formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(event.start_date)}
                        </p>
                        {event.city && <p className="text-[11px] text-gray-400 truncate">📍 {event.city}</p>}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop: grid */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {thisWeekEvents.slice(0, 6).map(event => (
                    <EventCard key={event.id} event={event} categoryInfo={catMap[event.category]} attendanceCount={attendanceCountMap[event.id]} />
                  ))}
                </div>
              </section>
            )}

            {/* ── ALL EVENTS / FILTERED RESULTS ── */}
            {(regularEvents.length > 0 || hasFilters) && (
              <section>
                {!hasFilters && (regularEvents.length > 0) && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-base font-black text-gray-900">All Events</span>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">{regularEvents.length} events</span>
                  </div>
                )}

                {/* Mobile: compact list */}
                <div className="flex flex-col sm:hidden gap-2.5">
                  {(hasFilters ? events : regularEvents).map(event => {
                    const categoryInfo = catMap[event.category]
                    const hasEnded = getEventLifecycle(event.start_date, event.end_date) === 'ended'
                    return (
                      <Link
                        key={event.id}
                        href={`/events/${event.slug}`}
                        className="flex gap-3 p-3 rounded-2xl bg-white border border-gray-100 active:bg-gray-50 transition-colors"
                        style={{ opacity: hasEnded ? 0.55 : 1 }}
                      >
                        <div className="flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden relative bg-gray-100">
                          {event.banner_url ? (
                            <Image
                              src={event.banner_url}
                              alt={event.title}
                              width={72}
                              height={72}
                              className={`object-cover w-full h-full ${hasEnded ? 'grayscale' : ''}`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-2xl">
                              {categoryInfo?.icon ?? '🎵'}
                            </div>
                          )}
                          {hasEnded && (
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                              <span className="text-[9px] font-black text-white bg-black/60 px-1.5 py-0.5 rounded-full">ENDED</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${event.is_free ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                              {event.is_free ? 'FREE' : event.price != null ? `₦${event.price.toLocaleString()}` : 'PAID'}
                            </span>
                            {categoryInfo && (
                              <span className="text-[10px] text-gray-400 font-medium">{categoryInfo.icon} {categoryInfo.name}</span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{event.title}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(event.start_date)}
                          </p>
                          {(event.city || event.is_online) && (
                            <p className="text-xs text-gray-400 truncate">
                              {event.is_online ? '🌐 Online' : `📍 ${[event.location_name, event.city].filter(Boolean).join(' · ')}`}
                            </p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Desktop: card grid */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {(hasFilters ? events : regularEvents).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      categoryInfo={catMap[event.category]}
                      attendanceCount={attendanceCountMap[event.id]}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                ← Prev
              </Link>
            )}
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={buildUrl({ page: String(p) })}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  p === page ? 'bg-indigo-600 text-white' : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                }`}>
                {p}
              </Link>
            ))}
            {page < pages && (
              <Link href={buildUrl({ page: String(page + 1) })}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Next →
              </Link>
            )}
          </div>
        )}

        <HaveAnEventCTA />
      </div>
    </div>
  )
}
