export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Search, Star } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import FeatureToggle from './FeatureToggle'

export default async function AdminFeaturedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const adminClient = createAdminClient()
  const params = await searchParams
  const search = (params.search as string) || ''
  const tab = (params.tab as string) || 'featured'
  const page = parseInt((params.page as string) || '1')
  const pageSize = 20

  let query = adminClient
    .from('events')
    .select('id, title, is_featured, start_date, views_count, profiles(display_name)', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (tab === 'featured') {
    query = query.eq('is_featured', true)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data: events, count: total } = await query.range((page - 1) * pageSize, page * pageSize - 1)

  const totalPages = Math.ceil((total ?? 0) / pageSize)

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Featured Events</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage featured events showcase</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Link
          href="/admin/featured"
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'featured' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
        >
          <span className="flex items-center gap-1.5">
            <Star className="w-4 h-4" />
            Featured
          </span>
        </Link>
        <Link
          href="/admin/featured?tab=all"
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'all' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
        >
          All Approved
        </Link>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/featured" className="flex gap-2">
        {tab !== 'featured' && <input type="hidden" name="tab" value={tab} />}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            name="search"
            placeholder="Search events..."
            defaultValue={search}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
          Search
        </button>
      </form>

      {/* Featured Events Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Event</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Organizer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Views</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Featured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!events || events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center">
                    <p className="text-gray-400 text-sm">{tab === 'featured' ? 'No featured events' : 'No approved events'}</p>
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
                  const organizer = (profile as { display_name: string })?.display_name || 'Unknown'

                  return (
                    <tr key={event.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {event.is_featured && <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 fill-yellow-400" />}
                          <p className="text-sm font-medium text-white truncate">{event.title}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-gray-400">{organizer}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-gray-400">
                          {event.start_date ? formatDate(event.start_date, { month: 'short', day: 'numeric' }) : '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-gray-400">{event.views_count || 0}</p>
                      </td>
                      <td className="px-5 py-3">
                        <FeatureToggle eventId={event.id} isFeatured={event.is_featured ?? false} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/featured?tab=${tab}&page=${page - 1}${search ? `&search=${search}` : ''}`} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium text-gray-400 transition-colors">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/featured?tab=${tab}&page=${page + 1}${search ? `&search=${search}` : ''}`} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium text-gray-400 transition-colors">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
