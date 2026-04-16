export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, Clock, XCircle, Pencil, Users } from 'lucide-react'
import { formatDate, CATEGORY_LABELS } from '@/lib/utils'
import type { Event } from '@/types/database'

export default async function MyEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', user!.id)
    .order('created_at', { ascending: false })

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: 'text-green-700 bg-green-50',
      pending: 'text-amber-700 bg-amber-50',
      rejected: 'text-red-700 bg-red-50',
    }
    return map[status] ?? 'text-gray-700 bg-gray-50'
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        <Link
          href="/dashboard/events/new"
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Post Event
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-6">Create your first event and reach more believers</p>
          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Post First Event
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(events as Event[]).map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 line-clamp-1">{event.title}</p>
                      <p className="text-xs text-gray-500">{event.city}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(event.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 capitalize">{CATEGORY_LABELS[event.category]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusBadge(event.status)}`}>
                        {event.status}
                      </span>
                      {event.rejection_reason && (
                        <p className="text-xs text-red-500 mt-1 max-w-32 truncate" title={event.rejection_reason}>
                          {event.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/events/${event.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-700"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/events/${event.id}/registrations`}
                          className="text-purple-600 hover:text-purple-700"
                          title="Registrations"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        {event.status === 'approved' && (
                          <Link
                            href={`/events/${event.slug}`}
                            className="text-green-600 hover:text-green-700 text-xs font-medium"
                            target="_blank"
                          >
                            View
                          </Link>
                        )}
                      </div>
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
