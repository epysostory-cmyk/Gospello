export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import ClaimActions from './ClaimActions'
import Link from 'next/link'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient.from('admin_users').select('role').eq('id', user.id).single()
  if (!adminUser) redirect('/admin/login')

  const params = await searchParams
  const tab = params.tab === 'history' ? 'history' : 'pending'

  const [pendingRes, historyRes] = await Promise.all([
    adminClient.from('claim_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    adminClient.from('claim_requests').select('*').in('status', ['approved', 'rejected']).order('reviewed_at', { ascending: false }),
  ])

  const pending  = pendingRes.data  ?? []
  const resolved = historyRes.data  ?? []
  const approvedCount = resolved.filter(c => c.status === 'approved').length
  const rejectedCount = resolved.filter(c => c.status === 'rejected').length

  return (
    <div className="space-y-5 max-w-6xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Claims</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and manage profile ownership claims</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{pending.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pending</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{resolved.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Resolved</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4">
          <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Approved</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4">
          <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Rejected</p>
        </div>
      </div>

      {/* Tabbed panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 px-4 gap-1 pt-1">
          <Link
            href="/admin/claims"
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              tab === 'pending'
                ? 'text-gray-900 border-[#7C3AED]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Pending
            {pending.length > 0 && (
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#7C3AED] text-white leading-none">
                {pending.length}
              </span>
            )}
          </Link>
          <Link
            href="/admin/claims?tab=history"
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              tab === 'history'
                ? 'text-gray-900 border-[#7C3AED]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            History
          </Link>
        </div>

        {/* ── Pending tab ── */}
        {tab === 'pending' && (
          pending.length === 0 ? (
            <div className="p-16 text-center">
              <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900">All clear</p>
              <p className="text-xs text-gray-400 mt-1">No pending claim requests</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Profile</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Claimant</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pending.map(claim => (
                      <tr key={claim.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${claim.profile_type === 'church' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                              {claim.profile_type === 'church' ? 'Church' : 'Organizer'}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">{claim.profile_name}</span>
                          </div>
                          {claim.verification_notes && (
                            <p className="text-xs text-gray-400 mt-1 max-w-xs truncate">{claim.verification_notes}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900">{claim.claimant_name}</p>
                          <p className="text-xs text-gray-400">{claim.claimant_email}</p>
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
                        <td className="px-5 py-4 text-right">
                          <ClaimActions claimId={claim.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {pending.map(claim => (
                  <div key={claim.id} className="p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${claim.profile_type === 'church' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                        {claim.profile_type === 'church' ? 'Church' : 'Organizer'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{claim.profile_name}</p>
                    <p className="text-xs text-gray-500">{claim.claimant_name} · {claim.claimant_email}</p>
                    {claim.claimant_phone && <p className="text-xs text-gray-400">{claim.claimant_phone}</p>}
                    <p className="text-xs text-gray-400">{formatDate(claim.created_at)}</p>
                    <ClaimActions claimId={claim.id} />
                  </div>
                ))}
              </div>
            </>
          )
        )}

        {/* ── History tab ── */}
        {tab === 'history' && (
          resolved.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-sm text-gray-400">No resolved claims yet</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
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
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${claim.profile_type === 'church' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                              {claim.profile_type === 'church' ? 'Church' : 'Organizer'}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">{claim.profile_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900">{claim.claimant_name}</p>
                          <p className="text-xs text-gray-400">{claim.claimant_email}</p>
                        </td>
                        <td className="px-5 py-4">
                          {claim.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                              <XCircle className="w-3 h-3" /> Rejected
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
                          <span className="text-xs text-gray-500 max-w-[160px] block truncate">{claim.rejection_reason || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {resolved.map(claim => (
                  <div key={claim.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${claim.profile_type === 'church' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                            {claim.profile_type === 'church' ? 'Church' : 'Organizer'}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{claim.profile_name}</p>
                        <p className="text-xs text-gray-500">{claim.claimant_name} · {claim.claimant_email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(claim.created_at)}</p>
                        {claim.rejection_reason && <p className="text-xs text-gray-400 mt-0.5 truncate">{claim.rejection_reason}</p>}
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {claim.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </div>
    </div>
  )
}
