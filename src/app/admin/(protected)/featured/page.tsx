export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Search, Star, StarOff } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import FeatureToggle from './FeatureToggle'

export default async function AdminFeaturedPage({
  searchParams,
}: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const adminClient = createAdminClient()
  const params   = await searchParams
  const search   = ((params.search as string) || '').trim()
  const tab      = (params.tab as string) === 'featured' ? 'featured' : 'all'
  const page     = Math.max(1, parseInt((params.page as string) || '1'))
  const pageSize = 25

  // Count featured events for the tab badge
  const { count: featuredCount } = await adminClient
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('is_featured', true)

  let query = adminClient
    .from('events')
    .select(
      'id, title, is_featured, featured_until, status, start_date, views_count, profiles(display_name), churches(name), seeded_organizers(name)',
      { count: 'exact' }
    )
    .eq('status', 'approved')          // only approved events can be featured
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (tab === 'featured') query = query.eq('is_featured', true)
  if (search)             query = query.ilike('title', `%${search}%`)

  const { data: events, count: total } = await query.range(
    (page - 1) * pageSize,
    page * pageSize - 1
  )
  const totalPages = Math.ceil((total ?? 0) / pageSize)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    p.set('tab', tab)
    if (search) p.set('search', search)
    if (page > 1) p.set('page', String(page))
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === '') p.delete(k)
      else p.set(k, v)
    })
    // clean up default tab=all from URL
    if (p.get('tab') === 'all') p.delete('tab')
    const s = p.toString()
    return `/admin/featured${s ? `?${s}` : ''}`
  }

  return (
    <div className="space-y-5 max-w-6xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Featured Events</h1>
        <p className="text-sm text-gray-500 mt-0.5">Choose which approved events appear in the featured showcase</p>
      </div>

      {/* Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">

        {/* Search bar */}
        <div className="p-4 border-b border-gray-100">
          <form method="GET" action="/admin/featured" className="flex gap-2">
            {/* Always preserve tab in search */}
            <input type="hidden" name="tab" value={tab} />
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="search"
                placeholder="Search approved events…"
                defaultValue={search}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>
            <button type="submit"
              className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors flex-shrink-0">
              Search
            </button>
            {search && (
              <Link href={buildUrl({ search: undefined, page: undefined })}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 flex-shrink-0">
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 gap-1 pt-1">
          <Link
            href={buildUrl({ tab: undefined, page: undefined })}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              tab === 'all'
                ? 'text-gray-900 border-[#7C3AED]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            All Approved
            {total !== null && tab === 'all' && (
              <span className="ml-1.5 text-xs text-gray-400">({total})</span>
            )}
          </Link>
          <Link
            href={buildUrl({ tab: 'featured', page: undefined })}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              tab === 'featured'
                ? 'text-gray-900 border-[#7C3AED]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            Featured
            {(featuredCount ?? 0) > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {featuredCount}
              </span>
            )}
          </Link>
        </div>

        {/* Results count */}
        {total !== null && (
          <p className="text-xs text-gray-400 px-5 pt-3 pb-0">
            {total} event{total !== 1 ? 's' : ''}{search ? ` matching "${search}"` : ''}
          </p>
        )}

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50/60">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Host</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Views</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Expires</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!events || events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <StarOff className="w-7 h-7 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      {tab === 'featured'
                        ? 'No featured events yet — switch to All Approved to add some'
                        : search ? `No approved events match "${search}"` : 'No approved events found'}
                    </p>
                  </td>
                </tr>
              ) : events.map((event) => {
                const profile   = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
                const church    = Array.isArray(event.churches) ? event.churches[0] : event.churches
                const seeded    = Array.isArray(event.seeded_organizers) ? event.seeded_organizers[0] : event.seeded_organizers
                const host      = (profile as {display_name:string}|null)?.display_name
                               || (church  as {name:string}|null)?.name
                               || (seeded  as {name:string}|null)?.name
                               || '—'
                return (
                  <tr key={event.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 max-w-[280px]">
                      <div className="flex items-center gap-2">
                        {event.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
                        <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-500 truncate max-w-[140px]">{host}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm text-gray-500">
                        {event.start_date ? formatDate(event.start_date, { month: 'short', day: 'numeric' }) : '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-500">{(event.views_count || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {event.is_featured ? (
                        event.featured_until ? (
                          <span className={`text-xs font-medium ${new Date(event.featured_until) < new Date() ? 'text-red-500' : 'text-green-600'}`}>
                            {new Date(event.featured_until) < new Date()
                              ? '⚠ Expired'
                              : formatDate(event.featured_until, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        ) : <span className="text-xs text-violet-600 font-medium">Permanent</span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <FeatureToggle eventId={event.id} isFeatured={event.is_featured ?? false} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {!events || events.length === 0 ? (
            <div className="p-12 text-center">
              <StarOff className="w-7 h-7 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {tab === 'featured' ? 'No featured events yet' : 'No approved events found'}
              </p>
            </div>
          ) : events.map((event) => {
            const profile   = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
            const church    = Array.isArray(event.churches) ? event.churches[0] : event.churches
            const seeded    = Array.isArray(event.seeded_organizers) ? event.seeded_organizers[0] : event.seeded_organizers
            const host      = (profile as {display_name:string}|null)?.display_name
                           || (church  as {name:string}|null)?.name
                           || (seeded  as {name:string}|null)?.name
                           || '—'
            return (
              <div key={event.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {event.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2">{event.title}</p>
                    </div>
                    <p className="text-xs text-gray-500">{host}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {event.start_date && <span>{formatDate(event.start_date, { month: 'short', day: 'numeric' })}</span>}
                      <span>{(event.views_count || 0).toLocaleString()} views</span>
                      {event.is_featured && (
                        <span className={event.featured_until
                          ? new Date(event.featured_until) < new Date() ? 'text-red-500 font-medium' : 'text-green-600 font-medium'
                          : 'text-violet-600 font-medium'}>
                          {event.featured_until
                            ? new Date(event.featured_until) < new Date() ? '⚠ Expired' : `Until ${formatDate(event.featured_until, { month: 'short', day: 'numeric' })}`
                            : 'Permanent'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <FeatureToggle eventId={event.id} isFeatured={event.is_featured ?? false} />
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page <span className="font-semibold text-gray-900">{page}</span> of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link href={buildUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
