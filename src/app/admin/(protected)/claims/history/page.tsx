export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function ClaimsHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient.from('admin_users').select('role').eq('id', user.id).single()
  if (!adminUser) redirect('/admin/login')

  const { data: claims } = await adminClient
    .from('claim_requests')
    .select('*')
    .in('status', ['approved', 'rejected'])
    .order('reviewed_at', { ascending: false })

  const resolved = claims ?? []
  const approvedCount = resolved.filter(c => c.status === 'approved').length
  const rejectedCount = resolved.filter(c => c.status === 'rejected').length

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/claims" className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Claims History</h1>
          <p className="text-sm text-gray-500 mt-0.5">All resolved claim requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Resolved</p>
          <p className="text-2xl font-bold text-gray-900">{resolved.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Approved</p>
          <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
        </div>
      </div>

      {resolved.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-12 text-center">
          <p className="text-sm text-gray-500">No resolved claims yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Profile</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Claimant</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Resolved</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {resolved.map(claim => (
                  <tr key={claim.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${claim.profile_type === 'church' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                          {claim.profile_type === 'church' ? 'Church' : 'Organizer'}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{claim.profile_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">{claim.claimant_name}</p>
                      <p className="text-xs text-gray-500">{claim.claimant_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      {claim.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">{formatDate(claim.created_at)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">{claim.reviewed_at ? formatDate(claim.reviewed_at) : '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">{claim.rejection_reason || '—'}</span>
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
