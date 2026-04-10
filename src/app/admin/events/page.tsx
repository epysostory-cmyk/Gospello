export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatDate, CATEGORY_LABELS } from '@/lib/utils'
import type { Event } from '@/types/database'
import Link from 'next/link'
import AdminEventActions from './AdminEventActions'

interface SearchParams {
  status?: 'pending' | 'approved' | 'rejected'
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select('*, profiles(display_name, email)')
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data: events } = await query.limit(50)

  const statusColor = (s: string) =>
    ({ approved: 'text-green-700 bg-green-50', pending: 'text-amber-700 bg-amber-50', rejected: 'text-red-700 bg-red-50' })[s] ?? 'bg-gray-50 text-gray-600'

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Event Review</h1>
        <p className="text-gray-500 mt-1">Approve or reject event submissions</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {[
          { label: 'All', value: '' },
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ].map(({ label, value }) => (
          <Link
            key={value}
            href={value ? `/admin/events?status=${value}` : '/admin/events'}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              (params.status ?? '') === value
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {!events || events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-500">No events found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organizer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(events as (Event & { profiles: { display_name: string; email: string } | null })[]).map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 max-w-48 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500">{event.city}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{event.profiles?.display_name}</p>
                      <p className="text-xs text-gray-400">{event.profiles?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(event.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {CATEGORY_LABELS[event.category]}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AdminEventActions event={event} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
