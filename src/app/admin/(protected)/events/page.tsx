export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Search, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface SearchParams {
  search?: string
  status?: string
  page?: string
}

const STATUS_OPTS = [
  { value: 'pending',  label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'approved', label: 'Approved', cls: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'hidden',   label: 'Hidden',   cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'rejected', label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
]

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const adminClient = createAdminClient()
  const resolved = await searchParams
  const search   = resolved.search || ''
  const status   = resolved.status || ''
  const page     = parseInt(resolved.page || '1')
  const pageSize = 20

  let query = adminClient
    .from('events')
    .select('id, title, status, start_date, views_count, profiles(display_name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('title', `%${search}%`)
  if (status) query = query.eq('status', status as 'pending' | 'approved' | 'rejected')

  const { data: events, count: total } = await query.range((page - 1) * pageSize, page * pageSize - 1)
  const totalPages = Math.ceil((total ?? 0) / pageSize)

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Review and manage all platform events</p>
        </div>
        <Link href="/admin/events/new"
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
          <Plus className="w-4 h-4" /> New Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
        <form method="GET" action="/admin/events" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" name="search" placeholder="Search events..."
              defaultValue={search}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/events"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!status ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All
          </Link>
          {STATUS_OPTS.map(({ value, label }) => (
            <Link key={value}
              href={`/admin/events?status=${value}${search ? `&search=${search}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${status === value ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['Event','Organizer','Date','Views','Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!events || events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">No events found</td>
                </tr>
              ) : events.map((event) => {
                const profile    = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
                const organizer  = (profile as {display_name:string})?.display_name || 'Unknown'
                const statusInfo = STATUS_OPTS.find(s => s.value === event.status)
                return (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{event.title}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-500">{organizer}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-500">{event.start_date ? formatDate(event.start_date, { month: 'short', day: 'numeric' }) : '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-500">{event.views_count || 0}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo?.cls ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {statusInfo?.label || event.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/events?page=${page-1}${status?`&status=${status}`:''}${search?`&search=${search}`:''}`}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Previous</Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/events?page=${page+1}${status?`&status=${status}`:''}${search?`&search=${search}`:''}`}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Next</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
