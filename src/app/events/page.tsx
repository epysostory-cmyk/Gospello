import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Events' }

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import EventCard from '@/components/ui/EventCard'
import { formatDate, formatTime } from '@/lib/utils'
import type { Event } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import { Search, MapPin, X, ChevronRight } from 'lucide-react'
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
  { slug: 'other',      name: 'Other',      icon: '⭐' },
]

const TIMEFRAME_OPTIONS = [
  { value: 'today',   label: 'Today' },
  { value: 'week',    label: 'This Week' },
  { value: 'weekend', label: 'This Weekend' },
] as const

function scoreEvent(event: Event, now: Date): number {
  let score = 0
  const lifecycle = getEventLifecycle(event.start_date, event.end_date)
  if (lifecycle === 'ongoing') return 200 + (event.is_featured ? 40 : 0)
  if (lifecycle === 'ended') return -100
  const daysUntil = (new Date(event.start_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (daysUntil <= 7) score += 50
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
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('events')
    .select('*, churches(*)')
    .eq('status', 'approved')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

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
    const friday = new Date(now); friday.setDate(now.getDate() + daysUntilFriday); friday.setHours(0, 0, 0, 0)
    const sunday = new Date(friday); sunday.setDate(friday.getDate() + 2); sunday.setHours(23, 59, 59, 999)
    query = query.gte('start_date', friday.toISOString()).lte('start_date', sunday.toISOString())
  }
  if (params.timeframe === 'week') {
    const now    = new Date()
    const sunday = new Date(now); sunday.setDate(now.getDate() - now.getDay()); sunday.setHours(0, 0, 0, 0)
    const saturday = new Date(sunday); saturday.setDate(sunday.getDate() + 6); saturday.setHours(23, 59, 59, 999)
    query = query.gte('start_date', sunday.toISOString()).lte('start_date', saturday.toISOString())
  }

  const { data } = await query
  const now = new Date()
  const allSorted = ((data ?? []) as Event[]).sort((a, b) => scoreEvent(b, now) - scoreEvent(a, now))
  const total  = allSorted.length
  const events = allSorted.slice(from, to + 1)

  let attendanceCountMap: Record<string, number> = {}
  if (events.length > 0) {
    const { data: attendanceRows } = await adminClient
      .from('attendances')
      .select('event_id')
      .in('event_id', events.map(e => e.id))
    for (const row of attendanceRows ?? []) {
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
  const rows = data ?? []
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
    return `/events?${qs.toString()}`
  }

  const hasFilters = !!(params.q || params.city || params.state || params.country || params.category || params.timeframe)
  const activeCategoryLabel = params.category
    ? categoryOptions.find(c => c.slug === params.category)?.name
    : null

  return (
    <div className="min-h-screen bg-white">

      {/* ── HEADER ───────────────────────────────────────────────────
          Same pattern as churches/organizers directory pages.
          White, clean, search front and centre.
      ──────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">

          {/* Title row */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-1.5">
              {activeCategoryLabel ? activeCategoryLabel : 'Gospel Events · Nigeria'}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {activeCategoryLabel ? `${activeCategoryLabel} events` : 'Gospel events'}
              </h1>
              {total > 0 && (
                <p className="text-sm text-gray-400 sm:pb-0.5">
                  {total.toLocaleString()} event{total !== 1 ? 's' : ''}
                  {params.city ? ` in ${params.city}` : params.state ? ` in ${params.state}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          <form method="GET" action="/events" className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Search events, churches, cities…"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.state    && <input type="hidden" name="state"    value={params.state} />}
            {params.timeframe && <input type="hidden" name="timeframe" value={params.timeframe} />}
            <button
              type="submit"
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Search
            </button>
            {params.q && (
              <Link
                href={buildUrl({ q: undefined, page: undefined })}
                className="flex-shrink-0 flex items-center px-3 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Clear
              </Link>
            )}
          </form>

          {/* Category chips */}
          <div className="flex gap-2.5 overflow-x-auto sm:overflow-visible flex-nowrap sm:flex-wrap pt-5 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href={buildUrl({ category: undefined, page: undefined })}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 w-16 transition-all duration-150 ${
                !params.category ? 'opacity-100' : 'opacity-60 hover:opacity-90'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-all duration-150 ${
                !params.category
                  ? 'bg-indigo-600 shadow-[0_4px_12px_rgba(99,102,241,0.4)] scale-105'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}>
                ✨
              </div>
              <span className={`text-[11px] font-semibold whitespace-nowrap ${!params.category ? 'text-indigo-600' : 'text-gray-500'}`}>
                All
              </span>
            </Link>

            {categoryOptions.map((cat) => {
              const active = params.category === cat.slug
              return (
                <Link
                  key={cat.slug}
                  href={buildUrl({ category: cat.slug, page: undefined })}
                  className={`flex-shrink-0 flex flex-col items-center gap-1.5 w-16 transition-all duration-150 ${
                    active ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-all duration-150 ${
                    active
                      ? 'bg-indigo-600 shadow-[0_4px_12px_rgba(99,102,241,0.4)] scale-105'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}>
                    {cat.icon}
                  </div>
                  <span className={`text-[11px] font-semibold whitespace-nowrap ${active ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {cat.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FILTERS & RESULTS ──────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">

          {/* Timeframe pills */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Link
              href={buildUrl({ timeframe: undefined, page: undefined })}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                !params.timeframe ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Any time
            </Link>
            {TIMEFRAME_OPTIONS.map((tf) => (
              <Link
                key={tf.value}
                href={buildUrl({ timeframe: tf.value, page: undefined })}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  params.timeframe === tf.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tf.label}
              </Link>
            ))}
          </div>

          {/* Location filter */}
          <form method="GET" action="/events" className="flex items-center gap-1.5">
            {params.q        && <input type="hidden" name="q"        value={params.q} />}
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.timeframe && <input type="hidden" name="timeframe" value={params.timeframe} />}
            {availableStates.length > 0 && (
              <div className="relative flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden">
                <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                <select
                  name="state"
                  defaultValue={params.state ?? ''}
                  className="pl-8 pr-3 py-2 text-xs font-medium text-gray-700 bg-transparent focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">All States</option>
                  {availableStates.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {availableCountries.length > 1 && (
              <div className="relative flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden">
                <select
                  name="country"
                  defaultValue={params.country ?? ''}
                  className="px-3 py-2 text-xs font-medium text-gray-700 bg-transparent focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">All Countries</option>
                  {availableCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <button
              type="submit"
              className="px-3 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go
            </button>
          </form>

          {/* Clear all */}
          {hasFilters && (
            <Link
              href="/events"
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-500 bg-white rounded-lg border border-gray-200 px-3 py-2 transition-colors"
            >
              <X className="w-3 h-3" /> Clear all
            </Link>
          )}

          {/* Active filter chips */}
          {params.q && (
            <span className="flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full">
              &quot;{params.q}&quot;
              <Link href={buildUrl({ q: undefined })} className="hover:text-indigo-900 ml-0.5 leading-none">×</Link>
            </span>
          )}
          {params.state && (
            <span className="flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
              📍 {params.state}
              <Link href={buildUrl({ state: undefined })} className="hover:text-gray-900 ml-0.5 leading-none">×</Link>
            </span>
          )}
          {params.city && (
            <span className="flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
              📍 {params.city}
              <Link href={buildUrl({ city: undefined })} className="hover:text-gray-900 ml-0.5 leading-none">×</Link>
            </span>
          )}
          {params.country && (
            <span className="flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
              🌍 {params.country}
              <Link href={buildUrl({ country: undefined })} className="hover:text-gray-900 ml-0.5 leading-none">×</Link>
            </span>
          )}
        </div>

        {/* Results */}
        {events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {activeCategoryLabel ? `No ${activeCategoryLabel} events found` : 'No events found'}
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              {hasFilters ? 'Try adjusting your filters or search terms' : 'Check back soon — new events are added regularly'}
            </p>
            {hasFilters && (
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Browse all events <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: compact list */}
            <div className="flex flex-col md:hidden gap-2.5">
              {events.map(event => {
                const categoryInfo = catMap[event.category]
                const hasEnded = getEventLifecycle(event.start_date, event.end_date) === 'ended'
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="flex gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-gray-300 active:bg-gray-50 transition-colors"
                    style={{ opacity: hasEnded ? 0.6 : 1 }}
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden relative bg-gray-100">
                      {event.banner_url ? (
                        <Image
                          src={event.banner_url}
                          alt={event.title}
                          width={80}
                          height={80}
                          className={`object-cover w-full h-full${hasEnded ? ' grayscale' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-indigo-100">
                          <span className="text-xl leading-none">{categoryInfo?.icon ?? '🎵'}</span>
                        </div>
                      )}
                      {hasEnded && (
                        <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white bg-gray-800/80 px-1.5 py-0.5 rounded-full">Ended</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {!hasEnded && (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full text-white ${event.is_free ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                            {event.is_free ? 'Free' : event.price != null ? `₦${event.price.toLocaleString()}` : 'Paid'}
                          </span>
                        )}
                        {categoryInfo && (
                          <span className="text-[11px] text-gray-400">{categoryInfo.icon} {categoryInfo.name}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{event.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(event.start_date)}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {event.is_online
                          ? 'Online'
                          : [event.location_name, event.city].filter(Boolean).join(' · ') || event.state || ''}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Desktop: card grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  categoryInfo={catMap[event.category]}
                  attendanceCount={attendanceCountMap[event.id]}
                />
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Previous
              </Link>
            )}
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildUrl({ page: String(p) })}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  p === page
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {p}
              </Link>
            ))}
            {page < pages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
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
