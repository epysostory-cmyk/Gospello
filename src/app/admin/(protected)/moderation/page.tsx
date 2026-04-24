export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import ModerationBulkList from './ModerationBulkList'

export default async function AdminModerationPage() {
  const adminClient = createAdminClient()

  const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
    adminClient.from('events')
      .select('id, title, slug, status, created_at, start_date, is_free, city, profiles(display_name)')
      .eq('status', 'pending').order('created_at', { ascending: true }).limit(50),
    adminClient.from('events').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    adminClient.from('events').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
  ])

  const pendingEvents  = pendingRes.data
  const approvedCount  = approvedRes.count ?? 0
  const rejectedCount  = rejectedRes.count ?? 0

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Moderation Queue</h1>
        <p className="text-gray-500 mt-0.5 text-sm">Review and approve user event submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: AlertTriangle, count: pendingEvents?.length || 0, label: 'Pending',  color: '#D97706', bg: 'bg-amber-50  border-amber-100' },
          { icon: CheckCircle,   count: approvedCount,              label: 'Approved', color: '#059669', bg: 'bg-green-50  border-green-100' },
          { icon: XCircle,       count: rejectedCount,              label: 'Rejected', color: '#DC2626', bg: 'bg-red-50    border-red-100'   },
        ].map(({ icon: Icon, count, label, color, bg }) => (
          <div key={label} className={`rounded-2xl border ${bg} p-4`}>
            <Icon className="w-5 h-5 mb-2" style={{ color }} />
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <h2 className="font-semibold text-gray-900 text-sm">Pending Events</h2>
          {pendingEvents && pendingEvents.length > 0 && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {pendingEvents.length} awaiting review
            </span>
          )}
        </div>
        <ModerationBulkList events={pendingEvents ?? []} />
      </div>
    </div>
  )
}
