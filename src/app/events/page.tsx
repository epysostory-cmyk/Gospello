import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Events' }

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import EventCard from '@/components/ui/EventCard'
import { NIGERIAN_STATES, COUNTRY_LIST, formatDate, formatTime } from '@/lib/utils'
import type { Event } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import { Search, MapPin, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import HaveAnEventCTA from '@/components/ui/HaveAnEventCTA'

export const revalidate = 60

interface SearchParams {
  q?: string
  city?: string
  country?: string
  category?: string
  timeframe?: 'today' | 'week' | 'weekend'
  page?: string
}

const PAGE_SIZE = 12

// Hardcoded fallback — overridden by DB fetch below
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

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%,location_name.ilike.%${params.q}%`)
  }
  if (params.city) {
    query = query.ilike('city', `%${params.city}%`)
  }
  if (params.country) {
    query = query.eq('country', params.country)
  }
  if (params.category) {
    query = query.eq('category', params.category)
  }
  if (params.timeframe === 'today') {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
    // Include events that start today OR started before today but end today or later (multi-day)
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
    // Sunday–Saturday of the current week
    const now = new Date()
    const sunday = new Date(now)
    sunday.setDate(now.getDate() - now.getDay())
    sunday.setHours(0, 0, 0, 0)
    const saturday = new Date(sunday)
    saturday.setDate(sunday.getDate() + 6)
    saturday.setHours(23, 59, 59, 999)
    query = query.gte('start_date', sunday.toISOString()).lte('start_date', saturday.toISOString())
  }

  const { data } = await query
  const now = new Date()
  const allSorted = ((data ?? []) as Event[]).sort((a, b) => scoreEvent(b, now) - scoreEvent(a, now))
  const total = allSorted.length
  const events = allSorted.slice(from, to + 1)

  // Batch fetch attendance counts
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

  return {
    events,
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
    attendanceCountMap,
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const adminClient = createAdminClient()
  const [{ events, total, page, pages, attendanceCountMap }, categoriesRes] = await Promise.all([
    getEvents(params),
    adminClient
      .from('categories')
      .select('id, name, slug, icon, color')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true }),
  ])
  const categoryOptions = categoriesRes.data?.length ? categoriesRes.data : FALLBACK_CATEGORIES

  // Build catMap for EventCard badges
  const catMap = Object.fromEntries(
    (categoriesRes.data ?? []).map(c => [c.slug, { name: c.name, icon: c.icon ?? null, color: c.color ?? '#6B7280' }])
  )

  function buildUrl(overrides: Partial<SearchParams>) {
    const merged = { ...params, ...overrides }
    const qs = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v) qs.set(k, String(v)) })
    return `/events?${qs.toString()}`
  }

  const hasFilters = !!(params.q || params.city || params.country || params.category || params.timeframe)
  const activeCategoryLabel = params.category
    ? categoryOptions.find(c => c.slug === params.category)?.name
    : null

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ background: '#0C0A1A' }} className="relative text-white overflow-hidden">
        {/* Single centered glow — one light source, intentional */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: 700, height: 260, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,82,220,0.28) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-20 sm:pb-14">

          {/* Eyebrow */}
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-indigo-400 mb-5 text-center sm:text-left">
            {params.category && activeCategoryLabel ? activeCategoryLabel : 'Gospel Events · Nigeria'}
          </p>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.08] mb-4 text-center sm:text-left">
            {params.category && activeCategoryLabel ? (
              <>{activeCategoryLabel} Events</>
            ) : (
              <>
                Find Events That<br />
                <span style={{ color: '#A78BFA' }}>Feed Your Faith</span>
              </>
            )}
          </h1>

          <p className="text-slate-400 text-[15px] sm:text-base mb-8 text-center sm:text-left leading-relaxed">
            {total > 0
              ? <>{total.toLocaleString()} event{total !== 1 ? 's' : ''} — worship nights, conferences, seminars and more{params.city ? ` in ${params.city}` : ' across Nigeria'}.</>
              : <>Worship nights, conferences, youth programs and seminars — across every state.</>
            }
          </p>

          {/* Search bar — white bg, prominent */}
          <form method="GET" action="/events">
            <div
              className="flex items-center gap-0 rounded-2xl overflow-hidden"
              style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.35)' }}
            >
              <Search className="flex-shrink-0 ml-4 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Search events, churches, cities…"
                className="flex-1 pl-3 pr-2 py-4 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
              />
              {params.category && <input type="hidden" name="category" value={params.category} />}
              {params.city && <input type="hidden" name="city" value={params.city} />}
              {params.timeframe && <input type="hidden" name="timeframe" value={params.timeframe} />}
              <button
                type="submit"
                className="flex-shrink-0 m-1.5 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
                style={{ background: '#4F46E5' }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Category chips */}
          <div
            className="flex gap-2 mt-5 overflow-x-auto pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none' }}
          >
            <Link
              href={buildUrl({ category: undefined, page: undefined })}
              className="flex-shrink-0 flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-1.5 rounded-full transition-all"
              style={!params.category
                ? { background: 'white', color: '#111827' }
                : { background: 'rgba(255,255,255,0.08)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              All
            </Link>
            {categoryOptions.map((cat) => (
              <Link
                key={cat.slug}
                href={buildUrl({ category: cat.slug, page: undefined })}
                className="flex-shrink-0 flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-1.5 rounded-full transition-all"
                style={params.category === cat.slug
                  ? { background: 'white', color: '#111827' }
                  : { background: 'rgba(255,255,255,0.08)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                <span>{cat.icon}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILTERS & RESULTS ────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Secondary filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Timeframe pills */}
          <div className="flex items-center gap-1.5 bg-white rounded-xl border border-gray-200 p-1">
            <Link
              href={buildUrl({ timeframe: undefined, page: undefined })}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                !params.timeframe ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Any time
            </Link>
            {TIMEFRAME_OPTIONS.map((tf) => (
              <Link
                key={tf.value}
                href={buildUrl({ timeframe: tf.value, page: undefined })}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  params.timeframe === tf.value ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tf.label}
              </Link>
            ))}
          </div>

          {/* Country filter */}
          <form method="GET" action="/events" className="flex items-center gap-1">
            {params.q && <input type="hidden" name="q" value={params.q} />}
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.timeframe && <input type="hidden" name="timeframe" value={params.timeframe} />}
            <div className="relative flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden">
              <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
              <select
                name="country"
                defaultValue={params.country ?? ''}
                className="pl-8 pr-3 py-2 text-xs font-semibold text-gray-700 bg-transparent focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">All Countries</option>
                {COUNTRY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" className="px-3 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">Go</button>
          </form>

          {/* Clear all filters */}
          {hasFilters && (
            <Link
              href="/events"
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-500 bg-white rounded-xl border border-gray-200 px-3 py-2 transition-colors"
            >
              <X className="w-3 h-3" /> Clear filters
            </Link>
          )}

          {/* Active filter chips */}
          {params.q && (
            <span className="flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full">
              &quot;{params.q}&quot;
              <Link href={buildUrl({ q: undefined })} className="hover:text-indigo-900 ml-0.5">×</Link>
            </span>
          )}
          {params.country && (
            <span className="flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1.5 rounded-full">
              🌍 {params.country}
              <Link href={buildUrl({ country: undefined })} className="hover:text-rose-900 ml-0.5">×</Link>
            </span>
          )}
          {params.city && (
            <span className="flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1.5 rounded-full">
              📍 {params.city}
              <Link href={buildUrl({ city: undefined })} className="hover:text-rose-900 ml-0.5">×</Link>
            </span>
          )}
        </div>

        {/* Events grid */}
        {events.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-5">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {params.category ? `No ${activeCategoryLabel} events found` : 'No events found'}
            </h3>
            <p className="text-gray-500 mb-6 text-sm max-w-xs mx-auto">
              {hasFilters
                ? 'Try adjusting your filters or search terms'
                : 'Check back soon — new events are added regularly'}
            </p>
            {hasFilters && (
              <Link
                href="/events"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Browse all events
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: compact list */}
            <div className="flex flex-col md:hidden" style={{ gap: 10 }}>
              {events.map(event => {
                const categoryInfo = catMap[event.category]
                const hasEnded = getEventLifecycle(event.start_date, event.end_date) === 'ended'
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="flex gap-3 p-3 rounded-2xl bg-white active:bg-[#F9FAFB] active:scale-[0.99] transition-all duration-100"
                    style={{ border: '0.5px solid #E5E7EB', opacity: hasEnded ? 0.6 : 1 }}
                  >
                    <div className="flex-shrink-0 rounded-xl overflow-hidden relative" style={{ width: 90, height: 90 }}>
                      {event.banner_url ? (
                        <Image
                          src={event.banner_url}
                          alt={event.title}
                          width={90}
                          height={90}
                          className={`object-cover object-center w-full h-full${hasEnded ? ' grayscale' : ''}`}
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex flex-col items-center justify-center gap-1${hasEnded ? ' grayscale' : ''}`}
                          style={{ background: 'linear-gradient(135deg, #4F1787, #7C3AED)' }}
                        >
                          <span className="text-2xl leading-none">{categoryInfo?.icon ?? '🎵'}</span>
                          <span className="text-white font-bold text-center leading-tight px-1" style={{ fontSize: 8, letterSpacing: '1px' }}>
                            {categoryInfo?.name ?? event.category}
                          </span>
                        </div>
                      )}
                      {hasEnded && (
                        <div className="absolute inset-0 bg-gray-900/30 rounded-xl flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white bg-gray-800/80 px-2 py-0.5 rounded-full">Ended</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {hasEnded ? (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap bg-gray-200 text-gray-500">
                            Ended
                          </span>
                        ) : (
                          <span
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                            style={{ background: event.is_free ? '#059669' : '#2563EB', color: 'white' }}
                          >
                            {event.is_free ? 'Free' : event.price != null ? `₦${event.price.toLocaleString()}` : 'Paid'}
                          </span>
                        )}
                        {categoryInfo && (
                          <span className="text-[11px] text-[#6B7280] truncate">
                            {categoryInfo.icon} {categoryInfo.name}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-medium text-[#111827] leading-snug line-clamp-2" style={{ fontSize: 14 }}>
                        {event.title}
                      </p>
                      <p className="mt-1.5 text-[12px] text-[#6B7280]">
                        {formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(event.start_date)}
                      </p>
                      <p className="mt-1 text-[12px] text-[#6B7280] truncate">
                        {event.is_online
                          ? 'Online'
                          : [event.location_name, event.city].filter(Boolean).join(' · ') || event.state || ''
                        }
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
          <div className="flex justify-center gap-2 mt-12">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                ← Previous
              </Link>
            )}
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildUrl({ page: String(p) })}
                className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                  p === page
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {p}
              </Link>
            ))}
            {page < pages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
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
