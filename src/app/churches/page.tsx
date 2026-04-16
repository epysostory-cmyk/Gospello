export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ChurchCard from '@/components/ui/ChurchCard'
import type { Church } from '@/types/database'
import { Search, MapPin, X } from 'lucide-react'
import Link from 'next/link'
import { NIGERIAN_STATES } from '@/lib/utils'

interface SearchParams {
  q?: string
  city?: string
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
    .order('name', { ascending: true })
    .range(from, to)

  if (params.q) query = query.or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  if (params.city) query = query.ilike('city', `%${params.city}%`)

  const { data, count } = await query
  return {
    churches: (data ?? []) as Church[],
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
  const { churches, total, page, pages } = await getChurches(params)
  const hasFilters = !!(params.q || params.city)

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
                {params.city ? ` in ${params.city}` : ''}
                {params.q ? ` matching "${params.q}"` : ''}
              </p>
            )}
          </div>

          {/* Search + city */}
          <form method="GET" action="/churches" className="flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Search churches..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/15 transition-colors"
              />
              {params.city && <input type="hidden" name="city" value={params.city} />}
            </div>
            <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl overflow-hidden sm:w-40">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
              <select
                name="city"
                defaultValue={params.city ?? ''}
                className="w-full pl-9 pr-3 py-3.5 bg-transparent text-sm text-white focus:outline-none appearance-none cursor-pointer"
              >
                <option value="" className="text-gray-900">All Cities</option>
                {NIGERIAN_STATES.map((c) => (
                  <option key={c} value={c} className="text-gray-900">{c}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3.5 rounded-2xl transition-colors text-sm"
            >
              Search
            </button>
            {hasFilters && (
              <Link
                href="/churches"
                className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 text-sm font-medium transition-colors border border-white/10"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </Link>
            )}
          </form>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {churches.map((church) => (
              <ChurchCard key={church.id} church={church} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                ← Previous
              </Link>
            )}
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildUrl({ page: String(p) })}
                className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                  p === page ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {p}
              </Link>
            ))}
            {page < pages && (
              <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
