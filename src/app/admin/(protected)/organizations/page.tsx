export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import {
  Building2, Users, Search, Globe,
  ChevronLeft, ChevronRight, EyeOff, ShieldOff,
} from 'lucide-react'
import OrgActions from './OrgActions'

interface SearchParams {
  q?: string
  type?: string
  status?: string
  city?: string
  page?: string
}

const PAGE_SIZE = 25

type OrgRow = {
  id: string
  email: string
  account_type: 'church' | 'organizer'
  display_name: string | null
  avatar_url: string | null
  created_at: string
  status: string
  is_hidden: boolean
  church_id: string | null
  church_name: string | null
  church_city: string | null
  church_slug: string | null
  church_is_hidden: boolean
  event_count: number
}

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = (await searchParams) as SearchParams
  const supabase = createAdminClient()

  const q            = params.q?.trim() ?? ''
  const typeFilter   = params.type   ?? 'all'
  const statusFilter = params.status ?? 'all'
  const cityFilter   = params.city?.trim() ?? ''
  const page         = Math.max(1, parseInt(params.page ?? '1', 10))
  const offset       = (page - 1) * PAGE_SIZE

  // ── 1. Fetch profiles ────────────────────────────────────────────────────
  let profileQuery = supabase
    .from('profiles')
    .select('id, email, account_type, display_name, avatar_url, created_at, status, is_hidden')
    .in('account_type', ['church', 'organizer'])
    .order('created_at', { ascending: false })

  if (typeFilter === 'churches')   profileQuery = profileQuery.eq('account_type', 'church')
  if (typeFilter === 'organisers') profileQuery = profileQuery.eq('account_type', 'organizer')

  const { data: profiles } = await profileQuery

  // ── 2. Fetch churches ────────────────────────────────────────────────────
  const { data: churches } = await supabase
    .from('churches')
    .select('id, profile_id, name, city, slug, is_hidden')

  const churchByProfile = new Map(
    (churches ?? []).map((c) => [c.profile_id, c]),
  )

  // ── 3. Event counts ──────────────────────────────────────────────────────
  const { data: eventRows } = await supabase.from('events').select('organizer_id')
  const eventCountMap = new Map<string, number>()
  for (const row of eventRows ?? []) {
    if (row.organizer_id)
      eventCountMap.set(row.organizer_id, (eventCountMap.get(row.organizer_id) ?? 0) + 1)
  }

  // ── 4. Merge ─────────────────────────────────────────────────────────────
  const d = profiles as Array<Record<string, unknown>> | null
  let rows: OrgRow[] = (d ?? []).map((p) => {
    const church = churchByProfile.get(p.id as string)
    return {
      id:             p.id             as string,
      email:          p.email          as string,
      account_type:   p.account_type   as 'church' | 'organizer',
      display_name:   p.display_name   as string | null,
      avatar_url:     p.avatar_url     as string | null,
      created_at:     p.created_at     as string,
      status:         (p.status        as string) ?? 'active',
      is_hidden:      (p.is_hidden     as boolean) ?? false,
      church_id:      church?.id        ?? null,
      church_name:    church?.name      ?? null,
      church_city:    church?.city      ?? null,
      church_slug:    church?.slug      ?? null,
      church_is_hidden: (church?.is_hidden as boolean) ?? false,
      event_count:    eventCountMap.get(p.id as string) ?? 0,
    }
  })

  // ── 5. Client-side filters ───────────────────────────────────────────────
  if (q) {
    const lower = q.toLowerCase()
    rows = rows.filter(
      (r) =>
        (r.display_name ?? '').toLowerCase().includes(lower) ||
        (r.church_name  ?? '').toLowerCase().includes(lower) ||
        (r.church_city  ?? '').toLowerCase().includes(lower) ||
        r.email.toLowerCase().includes(lower),
    )
  }
  if (cityFilter) {
    const lower = cityFilter.toLowerCase()
    rows = rows.filter((r) => (r.church_city ?? '').toLowerCase().includes(lower))
  }
  if (statusFilter === 'active')    rows = rows.filter((r) => r.status !== 'suspended')
  if (statusFilter === 'suspended') rows = rows.filter((r) => r.status === 'suspended')
  if (statusFilter === 'hidden')    rows = rows.filter((r) => r.is_hidden || r.church_is_hidden)

  // ── 6. Pagination ────────────────────────────────────────────────────────
  const total      = rows.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageRows   = rows.slice(offset, offset + PAGE_SIZE)

  // ── 7. Stats ─────────────────────────────────────────────────────────────
  const allProfiles    = (d ?? [])
  const totalChurches  = allProfiles.filter((p) => p.account_type === 'church').length
  const totalOrgs      = allProfiles.filter((p) => p.account_type === 'organizer').length
  const totalSuspended = rows.filter((r) => r.status === 'suspended').length
  const totalHidden    = rows.filter((r) => r.is_hidden || r.church_is_hidden).length

  // ── Helpers ───────────────────────────────────────────────────────────────
  function buildUrl(overrides: Partial<SearchParams>) {
    const next: Record<string, string> = {}
    const qVal = overrides.q !== undefined ? overrides.q : q
    if (qVal) next.q = qVal
    const t = overrides.type !== undefined ? overrides.type : typeFilter
    if (t && t !== 'all') next.type = t
    const s = overrides.status !== undefined ? overrides.status : statusFilter
    if (s && s !== 'all') next.status = s
    const c = overrides.city !== undefined ? overrides.city : cityFilter
    if (c) next.city = c
    const pg = overrides.page !== undefined ? overrides.page : String(page)
    if (pg && pg !== '1') next.page = pg
    const qs = new URLSearchParams(next).toString()
    return `/admin/organizations${qs ? '?' + qs : ''}`
  }

  const displayName = (row: OrgRow) => row.church_name ?? row.display_name ?? row.email

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Organisations</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage all churches and event organisers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Churches',   value: totalChurches,  color: '#a855f7', icon: Building2 },
          { label: 'Organisers', value: totalOrgs,       color: '#3b82f6', icon: Users },
          { label: 'Suspended',  value: totalSuspended,  color: totalSuspended  > 0 ? '#f59e0b' : '#6b7280', icon: ShieldOff },
          { label: 'Hidden',     value: totalHidden,     color: totalHidden     > 0 ? '#6366f1' : '#6b7280', icon: EyeOff },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color + '20' }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" action="/admin/organizations" className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text" name="q" defaultValue={q}
            placeholder="Search name, email or city…"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>
        <select name="type" defaultValue={typeFilter}
          className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer">
          <option value="all"        className="bg-[#0D0D14]">All Types</option>
          <option value="churches"   className="bg-[#0D0D14]">Churches</option>
          <option value="organisers" className="bg-[#0D0D14]">Organisers</option>
        </select>
        <select name="status" defaultValue={statusFilter}
          className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer">
          <option value="all"       className="bg-[#0D0D14]">All Statuses</option>
          <option value="active"    className="bg-[#0D0D14]">Active</option>
          <option value="suspended" className="bg-[#0D0D14]">Suspended</option>
          <option value="hidden"    className="bg-[#0D0D14]">Hidden</option>
        </select>
        <input type="text" name="city" defaultValue={cityFilter} placeholder="Filter by city…"
          className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm w-36 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30" />
        <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
          Filter
        </button>
        {(q || typeFilter !== 'all' || statusFilter !== 'all' || cityFilter) && (
          <Link href="/admin/organizations" className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-sm transition-colors">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      {pageRows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-16 text-center">
          <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No organisations found</p>
          {(q || typeFilter !== 'all' || statusFilter !== 'all' || cityFilter) && (
            <Link href="/admin/organizations" className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300">Clear filters</Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisation</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Events</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pageRows.map((row) => {
                  const name     = displayName(row)
                  const initials = name.slice(0, 2).toUpperCase()
                  const publicHref =
                    row.account_type === 'church' && row.church_slug
                      ? `/churches/${row.church_slug}`
                      : `/organizers/${row.id}`

                  return (
                    <tr key={row.id} className={`hover:bg-white/[0.03] transition-colors ${row.is_hidden || row.church_is_hidden ? 'opacity-60' : ''}`}>

                      {/* Profile */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.avatar_url} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-white/10" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-indigo-300">{initials}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-white truncate max-w-[160px]">{name}</p>
                              {(row.is_hidden || row.church_is_hidden) && (
                                <EyeOff className="w-3 h-3 text-gray-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate max-w-[160px]">{row.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                          row.account_type === 'church'
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                            : 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                        }`}>
                          {row.account_type === 'church' ? <Building2 className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {row.account_type === 'church' ? 'Church' : 'Organiser'}
                        </span>
                      </td>

                      {/* City */}
                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{row.church_city ?? '—'}</td>

                      {/* Events */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-white">{row.event_count}</span>
                      </td>

                      {/* Status badges */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                            row.status === 'suspended'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              : 'bg-green-500/15 text-green-400 border border-green-500/20'
                          }`}>
                            {row.status === 'suspended' ? '⏸ Suspended' : '● Active'}
                          </span>
                          {(row.is_hidden || row.church_is_hidden) && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit bg-gray-500/15 text-gray-400 border border-gray-500/20">
                              <EyeOff className="w-2.5 h-2.5" /> Hidden
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {formatDate(row.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={publicHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View public page"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </Link>

                          <OrgActions
                            profileId={row.id}
                            status={row.status}
                            isHidden={row.is_hidden}
                            accountType={row.account_type}
                            churchId={row.church_id}
                            churchIsHidden={row.church_is_hidden}
                            displayName={name}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              {total === 0 ? 'No results' : `Showing ${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}`}
            </p>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link href={buildUrl({ page: String(page - 1) })} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              ) : (
                <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></span>
              )}
              <span className="text-xs text-gray-400 px-1">{page} / {totalPages}</span>
              {page < totalPages ? (
                <Link href={buildUrl({ page: String(page + 1) })} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"><ChevronRight className="w-4 h-4" /></span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
