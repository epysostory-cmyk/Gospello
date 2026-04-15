export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import {
  Building2,
  Users,
  Search,
  Globe,
  ShieldOff,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
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
  status: string | null
  // resolved from churches join
  church_name: string | null
  church_city: string | null
  church_slug: string | null
  // resolved from events aggregate
  event_count: number
}

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = (await searchParams) as SearchParams
  const supabase = createAdminClient()

  const q = params.q?.trim() ?? ''
  const typeFilter = params.type ?? 'all'
  const statusFilter = params.status ?? 'all'
  const cityFilter = params.city?.trim() ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  // ── 1. Fetch all profiles that are orgs/churches ───────────────────────────
  let profileQuery = supabase
    .from('profiles')
    .select('id, email, account_type, display_name, avatar_url, created_at, status')
    .in('account_type', ['church', 'organizer'])
    .order('created_at', { ascending: false })

  if (typeFilter === 'churches') profileQuery = profileQuery.eq('account_type', 'church')
  if (typeFilter === 'organisers') profileQuery = profileQuery.eq('account_type', 'organizer')

  const { data: profiles } = await profileQuery

  // ── 2. Fetch churches for name/city resolution ─────────────────────────────
  const { data: churches } = await supabase
    .from('churches')
    .select('id, profile_id, name, city, slug')

  const churchByProfile = new Map(
    (churches ?? []).map((c) => [c.profile_id, c]),
  )

  // ── 3. Fetch event counts per organizer_id ────────────────────────────────
  const { data: eventRows } = await supabase
    .from('events')
    .select('organizer_id')

  const eventCountMap = new Map<string, number>()
  for (const row of eventRows ?? []) {
    if (row.organizer_id) {
      eventCountMap.set(row.organizer_id, (eventCountMap.get(row.organizer_id) ?? 0) + 1)
    }
  }

  // ── 4. Merge into OrgRow array ────────────────────────────────────────────
  let rows: OrgRow[] = (profiles ?? []).map((p) => {
    const church = churchByProfile.get(p.id)
    return {
      id: p.id,
      email: p.email,
      account_type: p.account_type as 'church' | 'organizer',
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      status: (p as Record<string, unknown>).status as string | null ?? null,
      church_name: church?.name ?? null,
      church_city: church?.city ?? null,
      church_slug: church?.slug ?? null,
      event_count: eventCountMap.get(p.id) ?? 0, // p.id === organizer_id
    }
  })

  // ── 5. Client-side filters (search + city + status) ───────────────────────
  if (q) {
    const lower = q.toLowerCase()
    rows = rows.filter(
      (r) =>
        (r.display_name ?? '').toLowerCase().includes(lower) ||
        (r.church_name ?? '').toLowerCase().includes(lower) ||
        (r.church_city ?? '').toLowerCase().includes(lower) ||
        r.email.toLowerCase().includes(lower),
    )
  }

  if (cityFilter) {
    const lower = cityFilter.toLowerCase()
    rows = rows.filter((r) => (r.church_city ?? '').toLowerCase().includes(lower))
  }

  if (statusFilter === 'active') {
    rows = rows.filter((r) => !r.status || r.status === 'active')
  } else if (statusFilter === 'suspended') {
    rows = rows.filter((r) => r.status === 'suspended')
  }

  // ── 6. Pagination ─────────────────────────────────────────────────────────
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageRows = rows.slice(offset, offset + PAGE_SIZE)

  // ── 7. Stats ──────────────────────────────────────────────────────────────
  const totalChurches = (profiles ?? []).filter((p) => p.account_type === 'church').length
  const totalOrganizers = (profiles ?? []).filter((p) => p.account_type === 'organizer').length
  const totalSuspended = rows.filter((r) => r.status === 'suspended').length

  // ── Helpers ───────────────────────────────────────────────────────────────
  function buildUrl(overrides: Partial<SearchParams>) {
    const next: Record<string, string> = {}
    if (overrides.q !== undefined ? overrides.q : q) next.q = overrides.q !== undefined ? overrides.q : q
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

  function displayName(row: OrgRow): string {
    return row.church_name ?? row.display_name ?? row.email
  }

  function cityOf(row: OrgRow): string {
    return row.church_city ?? '—'
  }

  function isSuspended(row: OrgRow): boolean {
    return row.status === 'suspended'
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Organisations</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage churches and event organisers on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orgs', value: (profiles ?? []).length, icon: Users, color: '#6366f1' },
          { label: 'Churches', value: totalChurches, icon: Building2, color: '#a855f7' },
          { label: 'Organisers', value: totalOrganizers, icon: Users, color: '#3b82f6' },
          { label: 'Suspended', value: totalSuspended, icon: ShieldOff, color: totalSuspended > 0 ? '#ef4444' : '#6b7280' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: color + '20' }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <form method="GET" action="/admin/organizations" className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search name or city…"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>

        {/* Type */}
        <select
          name="type"
          defaultValue={typeFilter}
          className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 appearance-none cursor-pointer"
        >
          <option value="all" className="bg-[#0D0D14]">All Types</option>
          <option value="churches" className="bg-[#0D0D14]">Churches</option>
          <option value="organisers" className="bg-[#0D0D14]">Organisers</option>
        </select>

        {/* Status */}
        <select
          name="status"
          defaultValue={statusFilter}
          className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 appearance-none cursor-pointer"
        >
          <option value="all" className="bg-[#0D0D14]">All Statuses</option>
          <option value="active" className="bg-[#0D0D14]">Active</option>
          <option value="suspended" className="bg-[#0D0D14]">Suspended</option>
        </select>

        {/* City */}
        <input
          type="text"
          name="city"
          defaultValue={cityFilter}
          placeholder="Filter by city…"
          className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm w-40 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
        />

        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          Filter
        </button>

        {(q || typeFilter !== 'all' || statusFilter !== 'all' || cityFilter) && (
          <Link
            href="/admin/organizations"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-sm transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      {pageRows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-16 text-center">
          <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No organisations found</p>
          {(q || typeFilter !== 'all' || statusFilter !== 'all' || cityFilter) && (
            <Link
              href="/admin/organizations"
              className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300"
            >
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Organisation
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Events
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pageRows.map((row) => {
                  const suspended = isSuspended(row)
                  const name = displayName(row)
                  const initials = name.slice(0, 2).toUpperCase()
                  const publicHref =
                    row.account_type === 'church' && row.church_slug
                      ? `/churches/${row.church_slug}`
                      : null

                  return (
                    <tr key={row.id} className="hover:bg-white/[0.03] transition-colors">
                      {/* Profile */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.avatar_url}
                              alt={name}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-white/10"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-indigo-300">{initials}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate max-w-[180px]">{name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[180px]">{row.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                            row.account_type === 'church'
                              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                          }`}
                        >
                          {row.account_type === 'church' ? (
                            <Building2 className="w-3 h-3" />
                          ) : (
                            <Users className="w-3 h-3" />
                          )}
                          {row.account_type === 'church' ? 'Church' : 'Organiser'}
                        </span>
                      </td>

                      {/* City */}
                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {cityOf(row)}
                      </td>

                      {/* Event count */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-white">{row.event_count}</span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {formatDate(row.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                            suspended
                              ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                              : 'bg-green-500/15 text-green-400 border border-green-500/20'
                          }`}
                        >
                          {suspended ? (
                            <ShieldOff className="w-3 h-3" />
                          ) : (
                            <ShieldCheck className="w-3 h-3" />
                          )}
                          {suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {publicHref && (
                            <Link
                              href={publicHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View public page"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          <OrgActions profileId={row.id} suspended={isSuspended(row)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              {total === 0
                ? 'No results'
                : `Showing ${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}`}
            </p>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              ) : (
                <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </span>
              )}

              <span className="text-xs text-gray-400 px-1">
                {page} / {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
