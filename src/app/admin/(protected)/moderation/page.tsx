export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ModerationActions from './ModerationActions'

export default async function AdminModerationPage() {
  const adminClient = createAdminClient()

  const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
    adminClient
      .from('events')
      .select('id, title, slug, status, created_at, start_date, is_free, city, profiles(display_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50),
    adminClient
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),
    adminClient
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected'),
  ])

  const pendingEvents = pendingRes.data
  const approvedCount = approvedRes.count ?? 0
  const rejectedCount = rejectedRes.count ?? 0

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Moderation Queue</h1>
        <p className="text-gray-400 mt-1 text-sm">Review and moderate user submissions</p>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-1">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <p className="text-2xl font-bold text-white">{pendingEvents?.length || 0}</p>
            <p className="text-xs text-gray-400">Pending</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-1">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-2xl font-bold text-white">{approvedCount}</p>
            <p className="text-xs text-gray-400">Approved</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-1">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-2xl font-bold text-white">{rejectedCount}</p>
            <p className="text-xs text-gray-400">Rejected</p>
          </div>
        </div>
      </div>

      {/* Pending Items */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">
            Pending Events
            {pendingEvents && pendingEvents.length > 0 && (
              <span className="ml-2 text-xs font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {pendingEvents.length} awaiting review
              </span>
            )}
          </h2>
        </div>

        <div className="divide-y divide-white/5">
          {!pendingEvents || pendingEvents.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CheckCircle className="w-8 h-8 text-green-500/40 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">All caught up! No events pending review.</p>
            </div>
          ) : (
            pendingEvents.map((event: any) => {
              const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
              const organizer = (profile as { display_name: string })?.display_name || 'Unknown'

              return (
                <div key={event.id} className="px-4 py-4 sm:px-5 hover:bg-white/5 transition-colors">
                  {/* Stack on mobile, row on desktop */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white leading-snug">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        <span className="text-xs text-gray-500">By {organizer}</span>
                        {event.city && (
                          <span className="text-xs text-gray-600">📍 {event.city}</span>
                        )}
                        {event.start_date && (
                          <span className="text-xs text-gray-600">
                            📅 {formatDate(event.start_date, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          event.is_free
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {event.is_free ? 'Free' : 'Paid'}
                        </span>
                        <span className="text-xs text-gray-600">
                          Submitted {formatDate(event.created_at, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Actions — full width on mobile, auto on desktop */}
                    <div className="sm:flex-shrink-0 flex items-center gap-2">
                      {event.slug && (
                        <a
                          href={`/events/${event.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Preview
                        </a>
                      )}
                      <ModerationActions eventId={event.id} />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
