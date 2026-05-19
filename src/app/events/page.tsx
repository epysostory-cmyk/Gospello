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
import { SUPPORTED_COUNTRIES } from '@/lib/countries'
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

const PAGE_SIZE = 18

const FALLBACK_CATEGORIES = [
  { slug: 'worship',    name: 'Worship',    icon: '🙏', color: null },
  { slug: 'prayer',     name: 'Prayer',     icon: '✨', color: null },
  { slug: 'conference', name: 'Conference', icon: '🎤', color: null },
  { slug: 'youth',      name: 'Youth',      icon: '🌟', color: null },
  { slug: 'training',   name: 'Training',   icon: '📖', color: null },
  { slug: 'concert',    name: 'Concert',    icon: '🎵', color: null },
  { slug: 'other',      name: 'Other',      icon: '⭐', color: null },
]

const TIMEFRAME_OPTIONS = [
  { value: 'today',   label: 'Today' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'week',    label: 'This week' },
] as const

function scoreEvent(event: Event, now: Date): number {
  let score = 0
  const lifecycle = getEventLifecycle(event.start_date, event.end_date, event.daily_schedule ?? undefined)
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
    query = query.gte('start_date', now.toISOString()).lte('start_date', saturday.toISOString())
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
      .select('id, name, slug, icon, color, description')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true }),
    getLocationOptions(),
  ])

  const { states: availableStates } = locationOptions
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
  const activeCat = params.category
    ? categoryOptions.find(c => c.slug === params.category)
    : null

  const featuredEvents = !hasFilters
    ? events.filter(e => e.is_featured && getEventLifecycle(e.start_date, e.end_date, e.daily_schedule ?? undefined) !== 'ended').slice(0, 2)
    : []

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── STICKY SEARCH HEADER ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <form method="GET" action="/events" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Search events, cities, churches…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-100 border-0 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
              />
              {params.category && <input type="hidden" name="category" value={params.category} />}
              {params.state    && <input type="hidden" name="state"    value={params.state} />}
              {params.timeframe && <input type="hidden" name="timeframe" value={params.timeframe} />}
            </div>
            {params.q
              ? <Link href={buildUrl({ q: undefined, page: undefined })}
                  className="flex-shrink-0 flex items-center justify-center w-10 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4" />
                </Link>
              : <button type="submit"
                  className="flex-shrink-0 flex items-center justify-center w-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                  <Search className="w-4 h-4" />
                </button>
            }
          </form>
        </div>

        {/* Category pills */}
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2 px-4 pb-3 min-w-max">
            <Link
              href={buildUrl({ category: undefined, page: undefined })}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                !params.category
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </Link>
            {categoryOptions.map(cat => {
              const active = params.category === cat.slug
              return (
                <Link
                  key={cat.slug}
                  href={buildUrl({ category: cat.slug, page: undefined })}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon && <span className="text-base leading-none">{cat.icon}</span>}
                  {cat.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── COUNTRY STRIP ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SUPPORTED_COUNTRIES.map(c => {
              const active = params.country === c.name
              const isNigeria = c.name === 'Nigeria'
              // For Nigeria: clicking clears country filter (it's the default/home)
              // For others: clicking sets country filter and clears state (not relevant abroad)
              const href = isNigeria
                ? buildUrl({ country: undefined, state: undefined, page: undefined })
                : buildUrl({ country: active ? undefined : c.name, state: undefined, page: undefined })
              const isActiveNigeria = isNigeria && !params.country
              return (
                <Link
                  key={c.name}
                  href={href}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    active || isActiveNigeria
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base">{c.flag}</span>
                  {c.name === 'United Kingdom' ? 'UK' : c.name === 'United States' ? 'USA' : c.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">

        {/* ── CATEGORY CONTEXT ── */}
        {activeCat && (
          <div className="pt-5 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeCat.icon && (
                  <span className="text-3xl leading-none">{activeCat.icon}</span>
                )}
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900">{activeCat.name}</h1>
                  {total > 0 && (
                    <p className="text-sm text-gray-400 mt-0.5">{total} event{total !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
              <Link
                href="/events"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </Link>
            </div>
          </div>
        )}

        {/* ── TIME + LOCATION FILTERS ── */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TIMEFRAME_OPTIONS.map(tf => (
            <Link
              key={tf.value}
              href={buildUrl({ timeframe: params.timeframe === tf.value ? undefined : tf.value, page: undefined })}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                params.timeframe === tf.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {tf.label}
            </Link>
          ))}

          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <NearMeButton basePath="/events" compact />
            {availableStates.length > 0 && !params.country && (
              <form method="GET" action="/events">
                {params.q         && <input type="hidden" name="q"         value={params.q} />}
                {params.category  && <input type="hidden" name="category"  value={params.category} />}
                {params.timeframe && <input type="hidden" name="timeframe" value={params.timeframe} />}
                <div className="relative flex items-center bg-white border border-gray-200 rounded-full overflow-hidden">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
                  <select
                    name="state"
                    defaultValue={params.state ?? ''}
                    className="pl-8 pr-4 py-1.5 text-sm font-medium text-gray-700 bg-transparent focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">All States</option>
                    {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── ACTIVE FILTER CHIPS ── */}
        {(params.q || params.state || params.city) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {params.q && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full">
                &ldquo;{params.q}&rdquo;
                <Link href={buildUrl({ q: undefined })} className="hover:text-indigo-900">×</Link>
              </span>
            )}
            {params.state && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                📍 {params.state}
                <Link href={buildUrl({ state: undefined })} className="hover:text-gray-900">×</Link>
              </span>
            )}
            {params.city && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                📍 {params.city}
                <Link href={buildUrl({ city: undefined })} className="hover:text-gray-900">×</Link>
              </span>
            )}
          </div>
        )}

        {/* ── RESULTS ── */}
        {events.length === 0 ? (
          <div className="py-24 text-center">
            <div className="text-5xl mb-4">{activeCat?.icon ?? '🔍'}</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {activeCat ? `No ${activeCat.name} events right now` : 'No events found'}
            </h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
              {hasFilters
                ? 'Try removing a filter — there might be events nearby or in a different time window.'
                : 'New events are added regularly. Check back soon.'}
            </p>
            {hasFilters && (
              <Link href="/events"
                className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors">
                Browse all events
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* No-filter view: featured strip */}
            {featuredEvents.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Featured</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featuredEvents.map(event => (
                      <EventCard key={event.id} event={event} variant="featured" categoryInfo={catMap[event.category]} attendanceCount={attendanceCountMap[event.id]} />
                    ))}
                  </div>
                </div>
            )}

            {/* Main list */}
            {!hasFilters && (
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                All Events
              </p>
            )}

            {/* Mobile: tall cards (not tiny thumbnails) */}
            <div className="sm:hidden space-y-3 pb-6">
              {events.map(event => {
                const cat = catMap[event.category]
                const hasEnded = getEventLifecycle(event.start_date, event.end_date, event.daily_schedule ?? undefined) === 'ended'
                const isOngoing = getEventLifecycle(event.start_date, event.end_date, event.daily_schedule ?? undefined) === 'ongoing'
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="flex gap-0 rounded-2xl bg-white border border-gray-100 overflow-hidden active:scale-[0.99] transition-transform"
                    style={{ opacity: hasEnded ? 0.6 : 1 }}
                  >
                    {/* Square image */}
                    <div className="flex-shrink-0 w-[110px] relative bg-gray-100">
                      {event.banner_url
                        ? <Image src={event.banner_url} alt={event.title} fill className={`object-cover ${hasEnded ? 'grayscale' : ''}`} />
                        : <div className="absolute inset-0 flex items-center justify-center text-3xl bg-indigo-50">
                            {cat?.icon ?? '🎵'}
                          </div>
                      }
                      {isOngoing && (
                        <div className="absolute top-2 left-2">
                          <span className="flex items-center gap-1 text-[9px] font-black bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />LIVE
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 p-3.5 flex flex-col justify-between gap-1.5">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${event.is_free ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {event.is_free ? 'Free' : event.price != null ? `₦${event.price.toLocaleString()}` : 'Paid'}
                          </span>
                          {cat && !params.category && (
                            <span className="text-[10px] text-gray-400 font-medium truncate">{cat.icon} {cat.name}</span>
                          )}
                        </div>
                        <p className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-2">{event.title}</p>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-500 font-medium">
                          {formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' · '}{formatTime(event.start_date)}
                        </p>
                        {(event.city || event.is_online) && (
                          <p className="text-xs text-gray-400 truncate">
                            {event.is_online ? '🌐 Online' : `📍 ${[event.location_name, event.city].filter(Boolean).join(', ')}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Desktop: card grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-8">
              {events.map(event => (
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
          <div className="flex justify-center items-center gap-2 py-8">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                ← Prev
              </Link>
            )}
            <span className="text-sm text-gray-400 font-medium px-2">
              Page {page} of {pages}
            </span>
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
