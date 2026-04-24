export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Plus, Search, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface SearchParams { q?: string; status?: string; page?: string }
const PAGE_SIZE = 24

export default async function AdminOrganizersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const adminClient = createAdminClient()
  const params = await searchParams
  const q      = params.q?.trim() ?? ''
  const status = params.status ?? 'all'
  const page   = Math.max(1, parseInt(params.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const { data, count: total } = await adminClient
    .from('seeded_organizers')
    .select('id, name, slug, city, state, logo_url, is_claimed, verified_badge, claim_requested_at, contact_person, created_at, is_hidden', { count: 'exact' })
    .order('created_at', { ascending: false })

  let rows = data ?? []

  if (q) { const lower = q.toLowerCase(); rows = rows.filter(r => r.name.toLowerCase().includes(lower) || r.city.toLowerCase().includes(lower)) }
  if (status === 'claimed')   rows = rows.filter(r => r.is_claimed)
  if (status === 'pending')   rows = rows.filter(r => !r.is_claimed && r.claim_requested_at)
  if (status === 'unclaimed') rows = rows.filter(r => !r.is_claimed && !r.claim_requested_at)

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows   = rows.slice(offset, offset + PAGE_SIZE)

  function buildUrl(overrides: Partial<SearchParams>) {
    const next: Record<string, string> = {}
    const qVal = overrides.q !== undefined ? overrides.q : q; if (qVal) next.q = qVal
    const s = overrides.status !== undefined ? overrides.status : status; if (s && s !== 'all') next.status = s
    const pg = overrides.page !== undefined ? overrides.page : String(page); if (pg && pg !== '1') next.page = pg
    return `/admin/organizers?${new URLSearchParams(next).toString()}`
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Seeded Organizers</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Admin-created organizer profiles — not tied to any user account</p>
        </div>
        <Link href="/admin/profiles/new"
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
          <Plus className="w-4 h-4" /> New Organizer
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <form method="GET" action="/admin/organizers" className="flex gap-2 flex-1 min-w-[200px]">
          {status !== 'all' && <input type="hidden" name="status" value={status} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="text" name="q" defaultValue={q} placeholder="Search by name or city…"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#7C3AED]" />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9]">Search</button>
        </form>
        {(['all','unclaimed','pending','claimed'] as const).map(s => (
          <Link key={s} href={buildUrl({ status: s, page: '1' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${status === s ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {/* Table */}
      {pageRows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <p className="text-gray-500">No organizers found. <Link href="/admin/profiles/new" className="text-[#7C3AED] underline">Create one</Link></p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  {['Name','Location','Contact','Status','Created','Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageRows.map(row => (
                  <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${row.is_hidden ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm">
                          {row.logo_url
                            ? <img src={row.logo_url} alt={row.name} className="w-8 h-8 rounded-lg object-cover" />
                            : '🎤'}
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{row.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{row.city}, {row.state}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{row.contact_person || '—'}</td>
                    <td className="px-5 py-3.5">
                      {row.verified_badge
                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">✓ Verified</span>
                        : row.is_claimed
                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Claimed</span>
                        : row.claim_requested_at
                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Clock className="w-3 h-3" />Pending</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"><AlertCircle className="w-3 h-3" />Unclaimed</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{formatDate(row.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link href={`/organizers/${row.id}`} target="_blank" className="text-xs text-[#7C3AED] hover:underline">View →</Link>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Admin-seeded</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">{rows.length} total</p>
              <div className="flex gap-2">
                {page > 1 && <Link href={buildUrl({ page: String(page-1) })} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50">Previous</Link>}
                {page < totalPages && <Link href={buildUrl({ page: String(page+1) })} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50">Next</Link>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
