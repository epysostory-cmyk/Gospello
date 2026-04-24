export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Plus, Search, Building2, Mic2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface SearchParams { q?: string; type?: string; status?: string; page?: string }
const PAGE_SIZE = 24

export default async function AdminProfilesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const adminClient = createAdminClient()
  const params  = await searchParams
  const q       = params.q?.trim() ?? ''
  const type    = params.type   ?? 'all'
  const status  = params.status ?? 'all'
  const page    = Math.max(1, parseInt(params.page ?? '1', 10))
  const offset  = (page - 1) * PAGE_SIZE

  // Fetch both admin-seeded churches and admin-seeded organizers
  const [churchRes, orgRes] = await Promise.all([
    adminClient.from('churches')
      .select('id, name, slug, city, state, logo_url, is_claimed, verified_badge, claim_requested_at, created_by_admin, created_at, is_hidden, pastor_name')
      .eq('created_by_admin', true)
      .order('created_at', { ascending: false }),
    adminClient.from('seeded_organizers')
      .select('id, name, slug, city, state, logo_url, is_claimed, verified_badge, claim_requested_at, created_by_admin, created_at, is_hidden, contact_person')
      .order('created_at', { ascending: false }),
  ])

  type Row = { id:string; name:string; slug:string|null; city:string; state:string; logo_url:string|null; is_claimed:boolean; verified_badge:boolean; claim_requested_at:string|null; created_at:string; is_hidden:boolean; contact:string|null; type:'church'|'organizer' }

  const churches: Row[] = (churchRes.data ?? []).map(c => ({
    id: c.id, name: c.name, slug: c.slug, city: c.city, state: c.state, logo_url: c.logo_url,
    is_claimed: c.is_claimed, verified_badge: c.verified_badge, claim_requested_at: c.claim_requested_at,
    created_at: c.created_at, is_hidden: c.is_hidden, contact: c.pastor_name, type: 'church' as const,
  }))

  const organizers: Row[] = (orgRes.data ?? []).map(o => ({
    id: o.id, name: o.name, slug: o.slug, city: o.city, state: o.state, logo_url: o.logo_url,
    is_claimed: o.is_claimed, verified_badge: o.verified_badge, claim_requested_at: o.claim_requested_at,
    created_at: o.created_at, is_hidden: o.is_hidden, contact: o.contact_person, type: 'organizer' as const,
  }))

  let all: Row[] = [...churches, ...organizers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (q)               { const lower = q.toLowerCase(); all = all.filter(r => r.name.toLowerCase().includes(lower) || r.city.toLowerCase().includes(lower)) }
  if (type !== 'all')  all = all.filter(r => r.type === type)
  if (status === 'claimed')   all = all.filter(r => r.is_claimed)
  if (status === 'pending')   all = all.filter(r => !r.is_claimed && r.claim_requested_at)
  if (status === 'unclaimed') all = all.filter(r => !r.is_claimed && !r.claim_requested_at)

  const total      = all.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageRows   = all.slice(offset, offset + PAGE_SIZE)

  function buildUrl(overrides: Partial<SearchParams>) {
    const next: Record<string, string> = {}
    const qVal = overrides.q !== undefined ? overrides.q : q; if (qVal) next.q = qVal
    const t = overrides.type !== undefined ? overrides.type : type; if (t && t !== 'all') next.type = t
    const s = overrides.status !== undefined ? overrides.status : status; if (s && s !== 'all') next.status = s
    const pg = overrides.page !== undefined ? overrides.page : String(page); if (pg && pg !== '1') next.page = pg
    return `/admin/profiles?${new URLSearchParams(next).toString()}`
  }

  function ClaimBadge({ row }: { row: Row }) {
    if (row.verified_badge) return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">✓ Gospello Verified</span>
    if (row.is_claimed)     return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Claimed</span>
    if (row.claim_requested_at) return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Clock className="w-3 h-3" />Pending</span>
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"><AlertCircle className="w-3 h-3" />Unclaimed</span>
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Seeded Profiles</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Admin-created churches and organizer profiles (not tied to user accounts)</p>
        </div>
        <Link href="/admin/profiles/new"
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
          <Plus className="w-4 h-4" /> New Profile
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Churches',   value: churches.length,                          icon: Building2, color: '#7C3AED' },
          { label: 'Organizers', value: organizers.length,                         icon: Mic2,      color: '#2563EB' },
          { label: 'Claimed',    value: all.filter(r => r.is_claimed).length,      icon: CheckCircle, color: '#059669' },
          { label: 'Unclaimed',  value: all.filter(r => !r.is_claimed).length,     icon: AlertCircle, color: '#D97706' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color + '15' }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <form method="GET" action="/admin/profiles" className="flex gap-2 flex-1 min-w-[200px]">
          {type   !== 'all' && <input type="hidden" name="type"   value={type}   />}
          {status !== 'all' && <input type="hidden" name="status" value={status} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="text" name="q" defaultValue={q} placeholder="Search by name or city…"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#7C3AED]" />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9]">Search</button>
        </form>
        {/* Type filter */}
        {(['all','church','organizer'] as const).map(t => (
          <Link key={t} href={buildUrl({ type: t, page: '1' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${type === t ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t === 'all' ? 'All Types' : t === 'church' ? 'Churches' : 'Organizers'}
          </Link>
        ))}
        {/* Status filter */}
        {(['all','unclaimed','pending','claimed'] as const).map(s => (
          <Link key={s} href={buildUrl({ status: s, page: '1' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${status === s ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {pageRows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <p className="text-gray-500">No profiles found. <Link href="/admin/profiles/new" className="text-[#7C3AED] underline">Create one</Link></p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageRows.map((row) => (
            <div key={row.id} className={`bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 ${row.is_hidden ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: row.type === 'church' ? '#7C3AED15' : '#2563EB15' }}>
                  {row.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.logo_url} alt={row.name} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (row.type === 'church' ? '⛪' : '🎤')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate text-sm">{row.name}</p>
                  <p className="text-xs text-gray-500">{row.city}, {row.state}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <ClaimBadge row={row} />
                <span className="text-[10px] text-gray-400">{formatDate(row.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              {row.contact && <p className="text-xs text-gray-400 mt-2 truncate">{row.type === 'church' ? 'Pastor: ' : 'Contact: '}{row.contact}</p>}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                <Link href={row.type === 'church' ? `/churches/${row.slug}` : `/organizers/${row.id}`}
                  target="_blank" className="text-xs text-[#7C3AED] hover:underline flex-1">View public page →</Link>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${row.type === 'church' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                  {row.type === 'church' ? 'Church' : 'Organizer'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Admin-seeded
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <Link href={buildUrl({ page: String(page-1) })} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50">← Previous</Link>}
          <span className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold">{page}</span>
          {page < totalPages && <Link href={buildUrl({ page: String(page+1) })} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50">Next →</Link>}
        </div>
      )}
    </div>
  )
}
