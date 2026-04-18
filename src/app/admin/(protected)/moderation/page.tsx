export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import ModerationBulkList from './ModerationBulkList'

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

        <ModerationBulkList events={pendingEvents ?? []} />
      </div>
    </div>
  )
}
