export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EventCard from '@/components/ui/EventCard'
import { CATEGORY_LABELS, NIGERIAN_STATES } from '@/lib/utils'
import type { Event, EventCategory } from '@/types/database'
import { Search, SlidersHorizontal, LayoutGrid, List } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 60

interface SearchParams {
  q?: string
  city?: string
  category?: EventCategory
  timeframe?: 'week' | 'weekend'
  featured?: string
  view?: 'grid' | 'list'
  page?: string
}

const PAGE_SIZE = 12

async function getEvents(params: SearchParams) {
  const supabase = await createClient()
  const page = parseInt(params.page ?? '1', 10)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('events')
    .select('*, churches(*)', { count: 'exact' })
    .eq('status', 'approved')
    .gte('start_date', new Date().toISOString())
    .lte('start_date', new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString())
    .order('start_date', { ascending: true })
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
  if (params.featured === 'true') {
    query = query.eq('is_featured', true)
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
  return { events: (data ?? []) as Event[], total: count ?? 0, page, pages: Math.ceil((count ?? 0) / PAGE_SIZE) }
}

const CATEGORIES = ['worship', 'prayer', 'conference', 'youth', 'training', 'other'] as const
const CITIES = NIGERIAN_STATES

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { events, total, page, pages } = await getEvents(params)
  const view = params.view ?? 'grid'

  function buildUrl(overrides: Partial<SearchParams>) {
    const merged = { ...params, ...overrides }
    const qs = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v) qs.set(k, String(v)) })
    return `/events?${qs.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Explore Events</h1>
        <p className="text-gray-500 mt-1">
          {total > 0 ? `${total} event${total !== 1 ? 's' : ''} found` : 'No events found'}
          {params.city ? ` in ${params.city}` : ''}
        </p>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <form method="GET" action="/events" className="flex flex-wrap gap-3">
          {/* Search input */}
          <div className="flex-1 min-w-52 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={params.q}
              placeholder="Search events..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* City */}
          <select
            name="city"
            defaultValue={params.city ?? 'Lagos'}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Cities</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Category */}
          <select
            name="category"
            defaultValue={params.category ?? ''}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>

          {/* Timeframe */}
          <select
            name="timeframe"
            defaultValue={params.timeframe ?? ''}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Any time</option>
            <option value="week">This week</option>
            <option value="weekend">This weekend</option>
          </select>

          <button
            type="submit"
            className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Filter
          </button>

          {/* Clear */}
          {(params.q || params.city || params.category || params.timeframe) && (
            <Link
              href="/events"
              className="text-sm text-gray-500 hover:text-gray-700 py-2.5 px-2"
            >
              Clear
            </Link>
          )}
        </form>

        {/* Active filters */}
        {(params.category || params.featured) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {params.category && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full">
                {CATEGORY_LABELS[params.category]}
                <Link href={buildUrl({ category: undefined })} className="ml-1 hover:text-indigo-900">×</Link>
              </span>
            )}
            {params.featured === 'true' && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">
                Featured
                <Link href={buildUrl({ featured: undefined })} className="ml-1 hover:text-amber-900">×</Link>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
        <Link
          href={buildUrl({ category: undefined, page: undefined })}
          className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-full transition-colors ${!params.category ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={buildUrl({ category: cat, page: undefined })}
            className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-full transition-colors ${params.category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {CATEGORY_LABELS[cat]}
          </Link>
        ))}
      </div>

      {/* View toggle + count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{total} result{total !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Link
            href={buildUrl({ view: 'grid' })}
            className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </Link>
          <Link
            href={buildUrl({ view: 'list' })}
            className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Events grid/list */}
      {events.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
          <Link href="/events" className="text-indigo-600 font-medium hover:text-indigo-700">
            Clear all filters
          </Link>
        </div>
      ) : view === 'list' ? (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} variant="compact" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {page > 1 && (
            <Link
              href={buildUrl({ page: String(page - 1) })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildUrl({ page: String(p) })}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${p === page ? 'bg-indigo-600 text-white' : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'}`}
            >
              {p}
            </Link>
          ))}
          {page < pages && (
            <Link
              href={buildUrl({ page: String(page + 1) })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
