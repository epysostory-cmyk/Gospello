import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Find a Church Near You — Gospello' }

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ChurchCard from '@/components/ui/ChurchCard'
import type { Church } from '@/types/database'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { NIGERIAN_STATES } from '@/lib/utils'
import ListYourChurchCTA from '@/components/ui/ListYourChurchCTA'
import NearMeButton from '@/components/ui/NearMeButton'

interface SearchParams {
  q?: string
  state?: string
  denomination?: string
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
  if (params.denomination) query = query.ilike('denomination', `%${params.denomination}%`)

  const [{ data, count }, denomRes] = await Promise.all([
    query,
    supabase
      .from('churches')
      .select('denomination')
      .eq('is_hidden', false)
      .not('denomination', 'is', null),
  ])

  const churches = (data ?? []) as Church[]

  // Build denomination list ordered by frequency
  const denomCounts: Record<string, number> = {}
  for (const row of (denomRes.data ?? [])) {
    if (row.denomination) denomCounts[row.denomination] = (denomCounts[row.denomination] ?? 0) + 1
  }
  const denominations = Object.entries(denomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([d]) => d)

  // Event counts for cards
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
    denominations,
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
  const { churches, eventCountMap, denominations, total, page, pages } = await getChurches(params)

  const hasFilters = !!(params.q || params.state || params.denomination)

  function buildUrl(overrides: Partial<SearchParams>) {
    const merged = { ...params, ...overrides }
    const qs = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v) qs.set(k, String(v)) })
    const str = qs.toString()
    return `/churches${str ? `?${str}` : ''}`
  }

  // Human-readable result context
  const resultContext = (() => {
    const parts: string[] = []
    if (params.denomination) parts.push(params.denomination)
    parts.push('church' + (total !== 1 ? 'es' : ''))
    if (params.state) parts.push(`in ${params.state}`)
    if (params.q) parts.push(`matching "${params.q}"`)
    return `${total.toLocaleString()} ${parts.join(' ')}`
  })()

  const showingFrom = (page - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="min-h-screen bg-white">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">

          {/* Page identity */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-indigo-600 mb-1.5">
              Nigeria · Gospel Directory
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-none mb-2">
              Find a church near you
            </h1>
            <p className="text-sm text-gray-500">
              {total > 0
                ? `${total.toLocaleString()}+ churches listed across all 36 states — filter by location or denomination`
                : 'Churches across all 36 Nigerian states'}
            </p>
          </div>

          {/* Search + filters form */}
          <form method="GET" action="/churches" className="space-y-3">

            {/* Pass denomination through form submits */}
            {params.denomination && (
              <input type="hidden" name="denomination" value={params.denomination} />
            )}

            {/* Row 1: search + state + buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="q"
                  defaultValue={params.q}
                  placeholder="Search by name, city, or area..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="relative sm:w-48">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <select
                  name="state"
                  defaultValue={params.state ?? ''}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="">All states</option>
                  {NIGERIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 sm:flex-shrink-0">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  Search
                </button>
                <NearMeButton />
              </div>
            </div>
          </form>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex items-center gap-2 flex-wrap mt-3">
              {params.state && (
                <Link
                  href={buildUrl({ state: undefined, page: undefined })}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                >
                  📍 {params.state} <X className="w-3 h-3" />
                </Link>
              )}
              {params.denomination && (
                <Link
                  href={buildUrl({ denomination: undefined, page: undefined })}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1.5 rounded-full hover:bg-violet-100 transition-colors"
                >
                  {params.denomination} <X className="w-3 h-3" />
                </Link>
              )}
              {params.q && (
                <Link
                  href={buildUrl({ q: undefined, page: undefined })}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  &ldquo;{params.q}&rdquo; <X className="w-3 h-3" />
                </Link>
              )}
              <Link
                href="/churches"
                className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1"
              >
                Clear all
              </Link>
            </div>
          )}

          {/* Denomination pills — quick browse by tradition */}
          {denominations.length > 0 && (
            <div
              className="flex gap-2 overflow-x-auto mt-4 -mx-4 sm:mx-0 px-4 sm:px-0 pb-1"
              style={{ scrollbarWidth: 'none' } as React.CSSProperties}
            >
              {denominations.map((d) => {
                const active = params.denomination === d
                return (
                  <Link
                    key={d}
                    href={buildUrl({ denomination: active ? undefined : d, page: undefined })}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors border ${
                      active
                        ? 'bg-violet-700 text-white border-violet-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {d}
                  </Link>
                )
              })}
            </div>
          )}

        </div>
      </section>

      {/* ── RESULTS ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-7">

        {/* Result count — only when we have results */}
        {total > 0 && (
          <p className="text-sm text-gray-500 mb-5">
            <span className="font-semibold text-gray-800">{resultContext}</span>
            {pages > 1 && (
              <span className="text-gray-400 ml-1.5">· showing {showingFrom}–{showingTo}</span>
            )}
          </p>
        )}

        {churches.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">⛪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No churches found</h3>
            <p className="text-gray-500 mb-6 text-sm">
              {hasFilters
                ? 'Try a different state, denomination, or search term'
                : 'Check back soon — we\'re adding more churches every week'}
            </p>
            {hasFilters && (
              <Link
                href="/churches"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                See all churches
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {churches.map((church) => (
              <ChurchCard
                key={church.id}
                church={church}
                eventCount={eventCountMap[church.id]}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              Page {page} of {pages}
            </p>
            <div className="flex gap-3">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ← Previous
                </Link>
              )}
              {page < pages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                >
                  Next →
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
