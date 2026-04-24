import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Events' }

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import EventCard from '@/components/ui/EventCard'
import { NIGERIAN_STATES } from '@/lib/utils'
import { getCategoryMap } from '@/lib/categories'
import type { Event } from '@/types/database'
import { Search, MapPin, X, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 60

interface SearchParams {
  q?: string
  city?: string
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
  const daysUntil = (new Date(event.start_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (daysUntil <= 7) score += 50
  else if (daysUntil <= 14) score += 30
  else if (daysUntil <= 30) score += 15
  score += Math.min((event.views_count ?? 0) / 10, 20)
  if (event.is_featured) score += 40
  if (daysUntil < 0) score -= 100
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
    .select('*, churches(*)', { count: 'exact' })
    .eq('status', 'approved')
    .order('start_date', { ascending: false })
    .range(from, to)

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%,location_name.ilike.%${params.q}%`)
  }
  if (params.city) {
    query = query.ilike('city', `%${params.city}%`)
  }
  if (params.category) {
    query = query.eq('category', params.category)
  }
  if (params.timeframe === 'today') {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
    query = query.gte('start_date', todayStart.toISOString()).lte('start_date', todayEnd.toISOString())
  }
  if (params.timeframe === 'weekend') {
    const now = new Date()
    const daysUntilFriday = (5 - now.getDay() + 7) % 7
    const friday = new Date(now); friday.setDate(now.getDate() + daysUntilFriday); friday.setHours(0, 0, 0, 0)
    const sunday = new Date(friday); sunday.setDate(friday.getDate() + 2); sunday.setHours(23, 59, 59, 999)
    query = query.gte('start_date', friday.toISOString()).lte('start_date', sunday.toISOString())
  }
  if (params.timeframe === 'week') {
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    query = query.lte('start_date', weekFromNow.toISOString())
  }

  const { data, count } = await query
  const now = new Date()
  const events = ((data ?? []) as Event[]).sort((a, b) => scoreEvent(b, now) - scoreEvent(a, now))

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
    total: count ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / PAGE_SIZE),
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

  const hasFilters = !!(params.q || params.city || params.category || params.timeframe)
  const activeCategoryLabel = params.category
    ? categoryOptions.find(c => c.slug === params.category)?.name
    : null

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── DARK HERO WITH SEARCH ─────────────────────────────── */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-700/15 rounded-full blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-16 sm:pb-14">
          {/* Heading */}
          <div className="mb-7 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {params.category && activeCategoryLabel ? (
                <>
                  <span className="text-white">{activeCategoryLabel} </span>
                  <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">Events</span>
                </>
              ) : (
                <>
                  <span className="text-white">Explore </span>
                  <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">Gospel Events</span>
                </>
              )}
            </h1>
            {total > 0 && (
              <p className="text-slate-400 mt-1.5 text-sm">
                {total} event{total !== 1 ? 's' : ''} found
                {params.city ? ` in ${params.city}` : ''}
                {params.q ? ` for "${params.q}"` : ''}
              </p>
            )}
          </div>

          {/* Search bar */}
          <form method="GET" action="/events" className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Search events, churches, cities..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/15 transition-colors"
              />
              {params.category && <input type="hidden" name="category" value={params.category} />}
              {params.city && <input type="hidden" name="city" value={params.city} />}
              {params.timeframe && <input type="hidden" name="timeframe" value={params.timeframe} />}
            </div>
            <button
              type="submit"
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3.5 rounded-2xl transition-colors text-sm"
            >
              Search
            </button>
          </form>

          {/* Category pills */}
          <div
            className="flex gap-2 mt-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap"
            style={{ scrollbarWidth: 'none' }}
          >
            <Link
              href={buildUrl({ category: undefined, page: undefined })}
              className={`flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                !params.category
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 border border-white/10'
              }`}
            >
              All
            </Link>
            {categoryOptions.map((cat) => (
              <Link
                key={cat.slug}
                href={buildUrl({ category: cat.slug, page: undefined })}
                className={`flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                  params.category === cat.slug
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15 border border-white/10'
                }`}
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

          {/* City filter */}
          <form method="GET" action="/events" className="flex items-center gap-1">
            {params.q && <input type="hidden" name="q" value={params.q} />}
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.timeframe && <input type="hidden" name="timeframe" value={params.timeframe} />}
            <div className="relative flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden">
              <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
              <select
                name="city"
                defaultValue={params.city ?? ''}
                className="pl-8 pr-3 py-2 text-xs font-semibold text-gray-700 bg-transparent focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">All Cities</option>
                {NIGERIAN_STATES.map((c) => <option key={c} value={c}>{c}</option>)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                categoryInfo={catMap[event.category]}
              />
            ))}
          </div>
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
      </div>
    </div>
  )
}
