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
    <div className="min-h-screen bg-gray-50">

      {/* ── DARK HERO ───────────────────────────────────────────── */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-700/15 rounded-full blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-16 sm:pb-14">
          <div className="mb-7 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-xs font-medium px-3 py-1.5 rounded-full mb-4 text-slate-400">
              <span>⛪</span>
              Churches across all 36 Nigerian states
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              <span className="text-white">Discover </span>
              <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">Churches</span>
            </h1>
            {total > 0 && (
              <p className="text-slate-400 mt-1.5 text-sm">
                {total} church{total !== 1 ? 'es' : ''} listed
                {params.state ? ` in ${params.state}` : ''}
                {params.q ? ` matching "${params.q}"` : ''}
              </p>
            )}
          </div>

          {/* Search */}
          <div className="flex flex-col gap-3 max-w-2xl">
            {/* Name search — standalone */}
            <form method="GET" action="/churches" className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="q"
                  defaultValue={params.q}
                  placeholder="Search by church name, city, or description…"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/15 transition-colors"
                />
                {params.state && <input type="hidden" name="state" value={params.state} />}
              </div>
              <button type="submit" className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 rounded-2xl transition-colors text-sm">
                Search
              </button>
            </form>

            {/* State filter + Near Me — row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* State chips — horizontal scroll */}
              <div className="flex gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
                <Link
                  href={buildUrl({ state: undefined, page: undefined })}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={!params.state
                    ? { background: 'white', color: '#111827' }
                    : { background: 'rgba(255,255,255,0.08)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }
                  }
                >
                  All States
                </Link>
                {NIGERIAN_STATES.map((s) => (
                  <Link
                    key={s}
                    href={buildUrl({ state: s, page: undefined })}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
                    style={params.state === s
                      ? { background: 'white', color: '#111827' }
                      : { background: 'rgba(255,255,255,0.08)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }
                    }
                  >
                    {s}
                  </Link>
                ))}
              </div>
              <NearMeButton />
            </div>

            {/* Active filter pills */}
            {hasFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                {params.q && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-white/10 text-slate-300 border border-white/10 px-3 py-1.5 rounded-full">
                    &quot;{params.q}&quot;
                    <Link href={buildUrl({ q: undefined })} className="hover:text-white ml-0.5">×</Link>
                  </span>
                )}
                {params.state && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-white/10 text-slate-300 border border-white/10 px-3 py-1.5 rounded-full">
                    📍 {params.state}
                    <Link href={buildUrl({ state: undefined })} className="hover:text-white ml-0.5">×</Link>
                  </span>
                )}
                <Link href="/churches" className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                  <X className="w-3 h-3" /> Clear all
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

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
                  className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors"
                  style={{ background: '#4F46E5' }}
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
