export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Clock, History } from 'lucide-react'
import ClaimActions from './ClaimActions'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminClaimsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient.from('admin_users').select('role').eq('id', user.id).single()
  if (!adminUser) redirect('/admin/login')

  const { data: claims } = await adminClient
    .from('claim_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const pendingClaims = claims ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Claim Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and action pending profile claims</p>
        </div>
        <Link
          href="/admin/claims/history"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <History className="w-4 h-4" />
          View History
        </Link>
      </div>

      {/* Stat */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-700">{pendingClaims.length} pending</span>
          {pendingClaims.length > 0 && <span className="text-sm text-amber-600">— action required</span>}
        </div>
      </div>

      {pendingClaims.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900">All clear</p>
          <p className="text-sm text-gray-500 mt-1">No pending claim requests</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Profile</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Claimant</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingClaims.map(claim => (
                  <tr key={claim.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${claim.profile_type === 'church' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                          {claim.profile_type === 'church' ? 'Church' : 'Organizer'}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{claim.profile_name}</span>
                      </div>
                      {claim.verification_notes && (
                        <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">{claim.verification_notes}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">{claim.claimant_name}</p>
                      <p className="text-xs text-gray-500">{claim.claimant_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-600">{claim.claimant_role || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-600">{claim.claimant_phone || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">{formatDate(claim.created_at)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <ClaimActions claimId={claim.id} />
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
