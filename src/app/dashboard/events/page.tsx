import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'My Events' }

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, Clock, XCircle, Pencil, Users, Eye, BookmarkCheck, BarChart2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getCategoryMap } from '@/lib/categories'
import type { Event } from '@/types/database'

export default async function MyEventsPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: events }, catMap] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, slug, category, status, city, start_date, rejection_reason, views_count')
      .eq('organizer_id', user!.id)
      .order('created_at', { ascending: false }),
    getCategoryMap(),
  ])

  const eventIds = (events ?? []).map(e => e.id)

  // Batch fetch registration counts and saved counts per event
  const [registrationsRes, savesRes, pageViewsRes] = await Promise.all([
    eventIds.length > 0
      ? adminClient.from('attendances').select('event_id').in('event_id', eventIds)
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? adminClient.from('saved_events').select('event_id').in('event_id', eventIds)
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? adminClient.from('event_page_views').select('event_id').in('event_id', eventIds)
      : Promise.resolve({ data: [] }),
  ])

  const registrationCountMap: Record<string, number> = {}
  for (const row of registrationsRes.data ?? []) {
    registrationCountMap[row.event_id] = (registrationCountMap[row.event_id] ?? 0) + 1
  }

  const savesCountMap: Record<string, number> = {}
  for (const row of savesRes.data ?? []) {
    savesCountMap[row.event_id] = (savesCountMap[row.event_id] ?? 0) + 1
  }

  const uniqueViewsCountMap: Record<string, number> = {}
  for (const row of pageViewsRes.data ?? []) {
    uniqueViewsCountMap[row.event_id] = (uniqueViewsCountMap[row.event_id] ?? 0) + 1
  }

  const totalViews = (events ?? []).reduce((sum, e) => sum + (e.views_count ?? 0), 0)
  const totalRegistrations = Object.values(registrationCountMap).reduce((a, b) => a + b, 0)
  const totalSaves = Object.values(savesCountMap).reduce((a, b) => a + b, 0)
  const totalUniqueViews = Object.values(uniqueViewsCountMap).reduce((a, b) => a + b, 0)

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: 'text-green-700 bg-green-50',
      pending: 'text-amber-700 bg-amber-50',
      rejected: 'text-red-700 bg-red-50',
    }
    return map[status] ?? 'text-gray-700 bg-gray-50'
  }

  const hasEvents = events && events.length > 0

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

      {/* Analytics summary */}
      {hasEvents && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Total Views</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{totalViews.toLocaleString()}</p>
            {totalUniqueViews > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{totalUniqueViews.toLocaleString()} unique</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Registrations</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{totalRegistrations.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <BookmarkCheck className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Saves</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{totalSaves.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <BarChart2 className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Events</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{events.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {events.filter(e => e.status === 'approved').length} approved
            </p>
          </div>
        </div>
      )}

      {!hasEvents ? (
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
        <div className="space-y-3">

          {/* ── Mobile cards ── */}
          <div className="sm:hidden space-y-3">
            {(events as (Event & { views_count: number })[]).map((event) => (
              <div key={event.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                {/* Title + status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 leading-snug">{event.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(event.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {event.city ? ` · ${event.city}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${statusBadge(event.status)}`}>
                    {event.status}
                  </span>
                </div>

                {/* Rejection reason */}
                {event.rejection_reason && (
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-red-600 leading-relaxed">{event.rejection_reason}</p>
                  </div>
                )}

                {/* Reach row */}
                <div className="flex items-center gap-4 mb-3">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-700">{(event.views_count ?? 0).toLocaleString()}</span> views
                  </span>
                  {registrationCountMap[event.id] > 0 && (
                    <span className="flex items-center gap-1 text-xs text-indigo-600">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-semibold">{registrationCountMap[event.id]}</span> going
                    </span>
                  )}
                  {savesCountMap[event.id] > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span className="font-semibold">{savesCountMap[event.id]}</span> saved
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                  <Link
                    href={`/dashboard/events/${event.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <Link
                    href={`/dashboard/events/${event.id}/registrations`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" /> Attendees
                  </Link>
                  {event.status === 'approved' && (
                    <Link
                      href={`/events/${event.slug}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reach</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(events as (Event & { views_count: number })[]).map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.city}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(event.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 capitalize">
                          {catMap[event.category]?.icon && <span className="mr-1">{catMap[event.category].icon}</span>}
                          {catMap[event.category]?.name ?? event.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Eye className="w-3 h-3 text-gray-400" />
                            {(event.views_count ?? 0).toLocaleString()} views
                          </span>
                          {registrationCountMap[event.id] > 0 && (
                            <span className="flex items-center gap-1 text-xs text-indigo-600">
                              <Users className="w-3 h-3" />
                              {registrationCountMap[event.id]} going
                            </span>
                          )}
                          {savesCountMap[event.id] > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <BookmarkCheck className="w-3 h-3" />
                              {savesCountMap[event.id]} saved
                            </span>
                          )}
                        </div>
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
                          <Link href={`/dashboard/events/${event.id}/edit`} className="text-indigo-600 hover:text-indigo-700" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <Link href={`/dashboard/events/${event.id}/registrations`} className="text-purple-600 hover:text-purple-700" title="Attendees">
                            <Users className="w-4 h-4" />
                          </Link>
                          {event.status === 'approved' && (
                            <Link href={`/events/${event.slug}`} className="text-green-600 hover:text-green-700 text-xs font-medium" target="_blank">
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

        </div>
      )}
    </div>
  )
}
