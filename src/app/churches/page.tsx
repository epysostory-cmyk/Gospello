import { createClient } from '@/lib/supabase/server'
import ChurchCard from '@/components/ui/ChurchCard'
import type { Church } from '@/types/database'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { NIGERIAN_STATES } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface SearchParams {
  q?: string
  city?: string
  page?: string
}

const PAGE_SIZE = 12
const CITIES = NIGERIAN_STATES

async function getChurches(params: SearchParams) {
  const supabase = await createClient()
  const page = parseInt(params.page ?? '1', 10)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('churches')
    .select('*', { count: 'exact' })
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true })
    .range(from, to)

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  }
  if (params.city) {
    query = query.ilike('city', `%${params.city}%`)
  }

  const { data, count } = await query
  return { churches: (data ?? []) as Church[], total: count ?? 0, page, pages: Math.ceil((count ?? 0) / PAGE_SIZE) }
}

export default async function ChurchesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { churches, total, page, pages } = await getChurches(params)

  function buildUrl(overrides: Partial<SearchParams>) {
    const merged = { ...params, ...overrides }
    const qs = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v) qs.set(k, String(v)) })
    return `/churches?${qs.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Churches</h1>
        <p className="text-gray-500 mt-1">
          {total > 0 ? `${total} church${total !== 1 ? 'es' : ''} listed` : 'No churches found'}
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-8">
        <form method="GET" action="/churches" className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-52 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={params.q}
              placeholder="Search churches..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            name="city"
            defaultValue={params.city ?? 'Lagos'}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Cities</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            type="submit"
            className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
          {(params.q || params.city) && (
            <Link href="/churches" className="text-sm text-gray-500 hover:text-gray-700 py-2.5 px-2">Clear</Link>
          )}
        </form>
      </div>

      {/* Grid */}
      {churches.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">⛪</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No churches found</h3>
          <p className="text-gray-500 mb-6">Try a different search or city</p>
          <Link href="/churches" className="text-indigo-600 font-medium hover:text-indigo-700">Clear filters</Link>
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
        <div className="flex justify-center gap-2 mt-10">
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              Previous
            </Link>
          )}
          {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={buildUrl({ page: String(p) })}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${p === page ? 'bg-indigo-600 text-white' : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'}`}>
              {p}
            </Link>
          ))}
          {page < pages && (
            <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
