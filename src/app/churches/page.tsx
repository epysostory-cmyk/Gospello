import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Churches' }

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ChurchCard from '@/components/ui/ChurchCard'
import type { Church } from '@/types/database'
import { Search, X } from 'lucide-react'

import Link from 'next/link'
import { NIGERIAN_STATES } from '@/lib/utils'
import ListYourChurchCTA from '@/components/ui/ListYourChurchCTA'
import NearMeButton from '@/components/ui/NearMeButton'
import StateFilterDropdown from '@/components/ui/StateFilterDropdown'

interface SearchParams {
  q?: string
  state?: string
  page?: string
}

const PAGE_SIZE = 18

async function getChurches(params: SearchParams) {
  const supabase = await createClient()
  const page = parseInt(params.page ?? '1', 10)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('churches')
    .select('*', { count: 'exact' })
    .eq('is_hidden', false)
    .order('is_featured', { ascending: false })
    .order('verified_badge', { ascending: false })
    .order('is_claimed', { ascending: false })
    .order('name', { ascending: true })
    .range(from, to)

  if (params.q) query = query.or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%,city.ilike.%${params.q}%,state.ilike.%${params.q}%`)
  if (params.state) query = query.ilike('state', `%${params.state}%`)

  const { data, count } = await query
  const churches = (data ?? []) as Church[]

  // Fetch event counts for all churches on this page
  let eventCountMap: Record<string, number> = {}
  if (churches.length > 0) {
    const { data: eventRows } = await supabase
      .from('events')
      .select('church_id')
      .eq('status', 'approved')
      .in('church_id', churches.map(c => c.id))
    for (const row of eventRows ?? []) {
      if (row.church_id) eventCountMap[row.church_id] = (eventCountMap[row.church_id] ?? 0) + 1
    }
  }

  return {
    churches,
    eventCountMap,
    total: count ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / PAGE_SIZE),
  }
}

export default async function ChurchesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { churches, eventCountMap, total, page, pages } = await getChurches(params)
  const hasFilters = !!(params.q || params.state)

  function buildUrl(overrides: Partial<SearchParams>) {
    const merged = { ...params, ...overrides }
    const qs = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v) qs.set(k, String(v)) })
    return `/churches?${qs.toString()}`
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-0">

          {/* Top row: title + count */}
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-1">Nigeria</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                Churches
              </h1>
            </div>
            {total > 0 && (
              <p className="text-sm text-gray-400 pb-1 shrink-0">
                {total.toLocaleString()} listed
                {params.state ? ` · ${params.state}` : ''}
                {params.q ? ` · "${params.q}"` : ''}
              </p>
            )}
          </div>

          {/* Search bar */}
          <form method="GET" action="/churches" className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Search by church name, city or description…"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
              {params.state && <input type="hidden" name="state" value={params.state} />}
            </div>
            <button
              type="submit"
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Search
            </button>
            <NearMeButton />
          </form>

          {/* Active filter chips — only shown when filters are on */}
          {hasFilters && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {params.q && (
                <span className="flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full">
                  &quot;{params.q}&quot;
                  <Link href={buildUrl({ q: undefined })} className="hover:text-indigo-900 ml-0.5">×</Link>
                </span>
              )}
              {params.state && (
                <span className="flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full">
                  📍 {params.state}
                  <Link href={buildUrl({ state: undefined })} className="hover:text-indigo-900 ml-0.5">×</Link>
                </span>
              )}
              <Link href="/churches" className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-3 h-3" /> Clear
              </Link>
            </div>
          )}

          {/* State tabs — mobile/tablet: horizontal scroll */}
          <div
            className="lg:hidden flex gap-1 overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-0"
            style={{ scrollbarWidth: 'none' } as React.CSSProperties}
          >
            <Link
              href={buildUrl({ state: undefined, page: undefined })}
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                !params.state
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              All States
            </Link>
            {NIGERIAN_STATES.map((s) => (
              <Link
                key={s}
                href={buildUrl({ state: s, page: undefined })}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  params.state === s
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATE DROPDOWN — desktop only ───────────────────────── */}
      <div className="hidden lg:block max-w-5xl mx-auto">
        <StateFilterDropdown
          states={NIGERIAN_STATES}
          currentState={params.state}
          currentQ={params.q}
        />
      </div>

      {/* ── CHURCH GRID ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {churches.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-5">⛪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No churches found</h3>
            <p className="text-gray-500 mb-6 text-sm">
              {hasFilters ? 'Try adjusting your search or city filter' : 'Check back soon'}
            </p>
            {hasFilters && (
              <Link href="/churches" className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {churches.map((church) => (
              <ChurchCard key={church.id} church={church} eventCount={eventCountMap[church.id]} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex flex-col items-center gap-3 mt-12">
            <p className="text-sm text-gray-400">
              Page {page} of {pages} · {total} church{total !== 1 ? 'es' : ''}
            </p>
            <div className="flex gap-3">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ← Previous
                </Link>
              )}
              {page < pages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Next {page * PAGE_SIZE < total ? `(${Math.min(PAGE_SIZE, total - page * PAGE_SIZE)} more)` : ''} →
                </Link>
              )}
            </div>
          </div>
        )}
        <ListYourChurchCTA />
      </div>
    </div>
  )
}
