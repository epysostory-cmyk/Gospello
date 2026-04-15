export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface SearchParams {
  search?: string
  status?: string
  page?: string
}

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const adminClient = createAdminClient()
  const resolvedParams = await searchParams
  const search = resolvedParams.search || ''
  const status = resolvedParams.status || ''
  const page = parseInt(resolvedParams.page || '1')
  const pageSize = 20

  let query = adminClient
    .from('events')
    .select('id, title, status, start_date, views_count, profiles(display_name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }
  if (status) {
    query = query.eq('status', status)
  }

  const { data: events, count: total } = await query.range((page - 1) * pageSize, page * pageSize - 1)

  const totalPages = Math.ceil((total ?? 0) / pageSize)

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    { value: 'approved', label: 'Approved', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
    { value: 'hidden', label: 'Hidden', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <p className="text-gray-400 mt-1 text-sm">Review and manage all platform events</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <form method="GET" action="/admin/events" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
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

        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/events" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!status ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
            All
          </Link>
          {statusOptions.map(({ value, label }) => (
            <Link
              key={value}
              href={`/admin/events?status=${value}${search ? `&search=${search}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${status === value ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Event</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Organizer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Views</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!events || events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center">
                    <p className="text-gray-400 text-sm">No events found</p>
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
                  const organizer = (profile as { display_name: string })?.display_name || 'Unknown'
                  const statusInfo = statusOptions.find(s => s.value === event.status)

                  return (
                    <tr key={event.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-white truncate">{event.title}</p>
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
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo?.color}`}>
                          {statusInfo?.label || event.status}
                        </span>
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
                <Link href={`/admin/events?page=${page - 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium text-gray-400 transition-colors">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/events?page=${page + 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium text-gray-400 transition-colors">
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
