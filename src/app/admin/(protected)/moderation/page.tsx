export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function AdminModerationPage() {
  const adminClient = createAdminClient()

  const { data: pendingEvents } = await adminClient
    .from('events')
    .select('id, title, status, created_at, profiles(display_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Moderation Queue</h1>
        <p className="text-gray-400 mt-1 text-sm">Review and moderate user submissions</p>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-white mt-1">{pendingEvents?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-white mt-1">—</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-white mt-1">—</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Items */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Pending Events</h2>
        </div>
        <div className="divide-y divide-white/5">
          {!pendingEvents || pendingEvents.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-gray-400 text-sm">All events are reviewed! 🎉</p>
            </div>
          ) : (
            pendingEvents.map((event: any) => {
              const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
              const organizer = (profile as { display_name: string })?.display_name || 'Unknown'

              return (
                <div key={event.id} className="px-5 py-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-white">{event.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">By {organizer} • {formatDate(event.created_at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium transition-colors">
                      Approve
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium transition-colors">
                      Reject
                    </button>
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
