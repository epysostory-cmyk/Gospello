export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Plus, Search, Building2, Mic2, CheckCircle, Clock, AlertCircle, Pencil, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'

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

  const [churchRes, orgRes] = await Promise.all([
    adminClient.from('churches')
      .select('id, name, slug, city, state, logo_url, is_claimed, verified_badge, claim_requested_at, created_at, is_hidden, pastor_name')
      .eq('created_by_admin', true)
      .order('created_at', { ascending: false }),
    adminClient.from('seeded_organizers')
      .select('id, name, slug, city, state, logo_url, is_claimed, verified_badge, claim_requested_at, created_at, is_hidden, contact_person')
      .order('created_at', { ascending: false }),
  ])

  type Row = {
    id: string; name: string; slug: string | null; city: string; state: string
    logo_url: string | null; is_claimed: boolean; verified_badge: boolean
    claim_requested_at: string | null; created_at: string; is_hidden: boolean
    contact: string | null; type: 'church' | 'organizer'
  }

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

  if (q)               { const lower = q.toLowerCase(); all = all.filter(r => r.name.toLowerCase().includes(lower) || r.city?.toLowerCase().includes(lower)) }
  if (type !== 'all')  all = all.filter(r => r.type === type)
  if (status === 'claimed')   all = all.filter(r => r.is_claimed)
  if (status === 'pending')   all = all.filter(r => !r.is_claimed && r.claim_requested_at)
  if (status === 'unclaimed') all = all.filter(r => !r.is_claimed && !r.claim_requested_at)

  const total      = all.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageRows   = all.slice(offset, offset + PAGE_SIZE)

  const claimedCount   = all.filter(r => r.is_claimed).length
  const pendingCount   = all.filter(r => !r.is_claimed && r.claim_requested_at).length
  const unclaimedCount = all.filter(r => !r.is_claimed && !r.claim_requested_at).length

  function buildUrl(overrides: Partial<SearchParams>) {
    const next: Record<string, string> = {}
    const qVal = overrides.q !== undefined ? overrides.q : q; if (qVal) next.q = qVal
    const t = overrides.type !== undefined ? overrides.type : type; if (t && t !== 'all') next.type = t
    const s = overrides.status !== undefined ? overrides.status : status; if (s && s !== 'all') next.status = s
    const pg = overrides.page !== undefined ? overrides.page : String(page); if (pg && pg !== '1') next.page = pg
    const qs = new URLSearchParams(next).toString()
    return `/admin/profiles${qs ? '?' + qs : ''}`
  }

  function ClaimBadge({ row }: { row: Row }) {
    if (row.verified_badge)      return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">✓ Verified</span>
    if (row.is_claimed)          return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200"><CheckCircle className="w-3 h-3" />Claimed</span>
    if (row.claim_requested_at)  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" />Pending</span>
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200"><AlertCircle className="w-3 h-3" />Unclaimed</span>
  }

  const TYPE_TABS = [
    { value: 'all',       label: 'All Types' },
    { value: 'church',    label: 'Churches' },
    { value: 'organizer', label: 'Organizers' },
  ]

  const STATUS_TABS = [
    { value: 'all',       label: 'All' },
    { value: 'unclaimed', label: `Unclaimed${unclaimedCount > 0 ? ` (${unclaimedCount})` : ''}` },
    { value: 'pending',   label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { value: 'claimed',   label: `Claimed${claimedCount > 0 ? ` (${claimedCount})` : ''}` },
  ]

  return (
    <div className="space-y-5 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Seeded Profiles</h1>
          <p className="text-sm text-gray-500 mt-0.5">Admin-created churches and organizers not tied to user accounts</p>
        </div>
        <Link href="/admin/profiles/new"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
          <Plus className="w-4 h-4" /> New Profile
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Churches',   value: churches.length,  icon: Building2,   bg: 'bg-violet-50', color: 'text-violet-600', href: buildUrl({ type: 'church', status: 'all', page: '1' }) },
          { label: 'Organizers', value: organizers.length, icon: Mic2,        bg: 'bg-blue-50',   color: 'text-blue-600',   href: buildUrl({ type: 'organizer', status: 'all', page: '1' }) },
          { label: 'Claimed',    value: claimedCount,      icon: CheckCircle, bg: 'bg-green-50',  color: 'text-green-600',  href: buildUrl({ status: 'claimed', page: '1' }) },
          { label: 'Unclaimed',  value: unclaimedCount,    icon: AlertCircle, bg: 'bg-amber-50',  color: 'text-amber-600',  href: buildUrl({ status: 'unclaimed', page: '1' }) },
        ].map(({ label, value, icon: Icon, bg, color, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4 flex items-center gap-3 hover:border-gray-200 transition-colors">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Filters panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="p-4 border-b border-gray-100">
          <form method="GET" action="/admin/profiles" className="flex gap-2">
            {type   !== 'all' && <input type="hidden" name="type"   value={type} />}
            {status !== 'all' && <input type="hidden" name="status" value={status} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="text" name="q" defaultValue={q} placeholder="Search by name or city…"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
            </div>
            <button type="submit" className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors flex-shrink-0">
              Search
            </button>
            {q && (
              <Link href={buildUrl({ q: '', page: '1' })}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 flex-shrink-0">
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Type tabs */}
        <div className="px-4 py-2 flex gap-1 border-b border-gray-50 overflow-x-auto [scrollbar-width:none]">
          {TYPE_TABS.map(({ value, label }) => (
            <Link key={value} href={buildUrl({ type: value, page: '1' })}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                type === value ? 'bg-[#7C3AED] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              {label}
            </Link>
          ))}
          <div className="w-px bg-gray-100 mx-1 self-stretch" />
          {STATUS_TABS.map(({ value, label }) => (
            <Link key={value} href={buildUrl({ status: value, page: '1' })}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                status === value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 px-1">
        {total} profile{total !== 1 ? 's' : ''}{q && ` matching "${q}"`}
      </p>

      {/* Grid */}
      {pageRows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No profiles found.</p>
          <Link href="/admin/profiles/new" className="mt-2 inline-block text-sm text-[#7C3AED] hover:underline">Create one →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pageRows.map((row) => (
            <div key={row.id} className={`bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 ${row.is_hidden ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center text-xl">
                  {row.logo_url
                    ? <Image src={row.logo_url} alt={row.name} width={44} height={44} className="object-cover w-full h-full" />
                    : row.type === 'church' ? '⛪' : '🎤'
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm truncate">{row.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{[row.city, row.state].filter(Boolean).join(', ')}</p>
                  {row.contact && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {row.type === 'church' ? 'Pastor: ' : 'Contact: '}{row.contact}
                    </p>
                  )}
                </div>
                <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  row.type === 'church' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {row.type === 'church' ? 'Church' : 'Organizer'}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <ClaimBadge row={row} />
                <span className="text-[10px] text-gray-400">{formatDate(row.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                <Link
                  href={row.type === 'church' ? `/churches/${row.slug}` : `/organizers/${row.id}`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> View
                </Link>
                <Link
                  href={`/admin/profiles/${row.type}/${row.id}/edit`}
                  className="ml-auto flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">Page <span className="font-semibold text-gray-900">{page}</span> of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
