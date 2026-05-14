export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import { Building2, Users, Search, Globe, EyeOff, ShieldOff, ChevronLeft, ChevronRight } from 'lucide-react'
import OrgActions from './OrgActions'
import Image from 'next/image'

interface SearchParams { q?: string; type?: string; status?: string; city?: string; page?: string }
const PAGE_SIZE = 25

type OrgRow = {
  id: string; email: string; account_type: 'church' | 'organizer'
  display_name: string | null; avatar_url: string | null; created_at: string
  status: string; is_hidden: boolean; church_id: string | null
  church_name: string | null; church_city: string | null
  church_slug: string | null; church_is_hidden: boolean; event_count: number
}

export default async function AdminOrganizationsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = (await searchParams) as SearchParams
  const supabase = createAdminClient()

  const q            = params.q?.trim() ?? ''
  const typeFilter   = params.type   ?? 'all'
  const statusFilter = params.status ?? 'all'
  const cityFilter   = params.city?.trim() ?? ''
  const page         = Math.max(1, parseInt(params.page ?? '1', 10))
  const offset       = (page - 1) * PAGE_SIZE

  let profileQuery = supabase
    .from('profiles')
    .select('id, email, account_type, display_name, avatar_url, created_at, status, is_hidden')
    .in('account_type', ['church', 'organizer'])
    .order('created_at', { ascending: false })

  if (typeFilter === 'churches')   profileQuery = profileQuery.eq('account_type', 'church')
  if (typeFilter === 'organisers') profileQuery = profileQuery.eq('account_type', 'organizer')

  const { data: profiles } = await profileQuery
  const { data: churches } = await supabase.from('churches').select('id, profile_id, name, city, slug, is_hidden')
  const { data: eventRows } = await supabase.from('events').select('organizer_id').is('church_id', null).is('seeded_organizer_id', null)

  const churchByProfile = new Map((churches ?? []).map(c => [c.profile_id, c]))
  const eventCountMap = new Map<string, number>()
  for (const row of eventRows ?? []) {
    if (row.organizer_id) eventCountMap.set(row.organizer_id, (eventCountMap.get(row.organizer_id) ?? 0) + 1)
  }

  const d = profiles as Array<Record<string, unknown>> | null
  let rows: OrgRow[] = (d ?? []).map(p => {
    const church = churchByProfile.get(p.id as string)
    return {
      id: p.id as string, email: p.email as string, account_type: p.account_type as 'church' | 'organizer',
      display_name: p.display_name as string | null, avatar_url: p.avatar_url as string | null,
      created_at: p.created_at as string, status: (p.status as string) ?? 'active',
      is_hidden: (p.is_hidden as boolean) ?? false, church_id: church?.id ?? null,
      church_name: church?.name ?? null, church_city: church?.city ?? null,
      church_slug: church?.slug ?? null, church_is_hidden: (church?.is_hidden as boolean) ?? false,
      event_count: eventCountMap.get(p.id as string) ?? 0,
    }
  })

  if (q)                    { const lower = q.toLowerCase(); rows = rows.filter(r => (r.display_name ?? '').toLowerCase().includes(lower) || (r.church_name ?? '').toLowerCase().includes(lower) || (r.church_city ?? '').toLowerCase().includes(lower) || r.email.toLowerCase().includes(lower)) }
  if (cityFilter)           rows = rows.filter(r => (r.church_city ?? '').toLowerCase().includes(cityFilter.toLowerCase()))
  if (statusFilter === 'active')    rows = rows.filter(r => r.status !== 'suspended')
  if (statusFilter === 'suspended') rows = rows.filter(r => r.status === 'suspended')
  if (statusFilter === 'hidden')    rows = rows.filter(r => r.is_hidden || r.church_is_hidden)

  const total      = rows.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageRows   = rows.slice(offset, offset + PAGE_SIZE)

  const allProfiles    = d ?? []
  const totalChurches  = allProfiles.filter(p => p.account_type === 'church').length
  const totalOrgs      = allProfiles.filter(p => p.account_type === 'organizer').length
  const totalSuspended = rows.filter(r => r.status === 'suspended').length
  const totalHidden    = rows.filter(r => r.is_hidden || r.church_is_hidden).length

  function buildUrl(overrides: Partial<SearchParams>) {
    const next: Record<string, string> = {}
    const qVal = overrides.q !== undefined ? overrides.q : q; if (qVal) next.q = qVal
    const t = overrides.type !== undefined ? overrides.type : typeFilter; if (t && t !== 'all') next.type = t
    const s = overrides.status !== undefined ? overrides.status : statusFilter; if (s && s !== 'all') next.status = s
    const c = overrides.city !== undefined ? overrides.city : cityFilter; if (c) next.city = c
    const pg = overrides.page !== undefined ? overrides.page : String(page); if (pg && pg !== '1') next.page = pg
    const qs = new URLSearchParams(next).toString()
    return `/admin/organizations${qs ? '?' + qs : ''}`
  }

  const displayName = (row: OrgRow) => row.church_name ?? row.display_name ?? row.email

  const STATUS_TABS = [
    { value: 'all',       label: 'All' },
    { value: 'active',    label: 'Active' },
    { value: 'suspended', label: `Suspended${totalSuspended > 0 ? ` (${totalSuspended})` : ''}` },
    { value: 'hidden',    label: `Hidden${totalHidden > 0 ? ` (${totalHidden})` : ''}` },
  ]

  const TYPE_TABS = [
    { value: 'all',        label: 'All Types' },
    { value: 'churches',   label: 'Churches' },
    { value: 'organisers', label: 'Organisers' },
  ]

  return (
    <div className="space-y-5 max-w-7xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">User Profiles</h1>
        <p className="text-sm text-gray-500 mt-0.5">User-owned church and organizer accounts registered through the platform</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Churches',   value: totalChurches,  icon: Building2, bg: 'bg-violet-50', color: 'text-violet-600', href: buildUrl({ type: 'churches', status: 'all', page: '1' }) },
          { label: 'Organisers', value: totalOrgs,       icon: Users,     bg: 'bg-blue-50',   color: 'text-blue-600',   href: buildUrl({ type: 'organisers', status: 'all', page: '1' }) },
          { label: 'Suspended',  value: totalSuspended,  icon: ShieldOff, bg: 'bg-amber-50',  color: 'text-amber-600',  href: buildUrl({ status: 'suspended', page: '1' }) },
          { label: 'Hidden',     value: totalHidden,     icon: EyeOff,    bg: 'bg-red-50',    color: 'text-red-500',    href: buildUrl({ status: 'hidden', page: '1' }) },
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
          <form method="GET" action="/admin/organizations" className="flex gap-2">
            {typeFilter !== 'all'   && <input type="hidden" name="type"   value={typeFilter} />}
            {statusFilter !== 'all' && <input type="hidden" name="status" value={statusFilter} />}
            {cityFilter             && <input type="hidden" name="city"   value={cityFilter} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="text" name="q" defaultValue={q} placeholder="Search by name, email or city…"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
            </div>
            <button type="submit" className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors flex-shrink-0">
              Search
            </button>
            {(q || typeFilter !== 'all' || statusFilter !== 'all' || cityFilter) && (
              <Link href="/admin/organizations" className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 flex-shrink-0">
                Clear
              </Link>
            )}
          </form>
        </div>
        <div className="px-4 py-2 flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {TYPE_TABS.map(({ value, label }) => (
            <Link key={value} href={buildUrl({ type: value, page: '1' })}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === value ? 'bg-[#7C3AED] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {label}
            </Link>
          ))}
          <div className="w-px bg-gray-100 mx-1 self-stretch" />
          {STATUS_TABS.map(({ value, label }) => (
            <Link key={value} href={buildUrl({ status: value, page: '1' })}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 px-1">
        {total} profile{total !== 1 ? 's' : ''}{q && ` matching "${q}"`}
      </p>

      {/* Empty state */}
      {pageRows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">No profiles found</p>
          {(q || typeFilter !== 'all' || statusFilter !== 'all' || cityFilter) && (
            <Link href="/admin/organizations" className="mt-2 inline-block text-sm text-[#7C3AED] hover:underline">Clear filters</Link>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Profile</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">City</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Events</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageRows.map((row) => {
                  const name = displayName(row)
                  const initials = name.slice(0, 2).toUpperCase()
                  const publicHref = row.account_type === 'church' && row.church_slug ? `/churches/${row.church_slug}` : `/organizers/${row.id}`
                  return (
                    <tr key={row.id} className={`hover:bg-gray-50/70 transition-colors ${row.is_hidden || row.church_is_hidden ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {row.avatar_url ? (
                            <Image src={row.avatar_url} alt={name} width={36} height={36} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-violet-600">{initials}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{name}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[160px]">{row.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          row.account_type === 'church' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {row.account_type === 'church' ? <Building2 className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {row.account_type === 'church' ? 'Church' : 'Organiser'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">{row.church_city ?? '—'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm font-semibold text-gray-900">{row.event_count}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                          row.status === 'suspended' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {row.status === 'suspended' ? 'Suspended' : 'Active'}
                        </span>
                        {(row.is_hidden || row.church_is_hidden) && (
                          <span className="ml-1 inline-flex items-center gap-1 text-xs text-gray-400">
                            <EyeOff className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(row.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={publicHref} target="_blank"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors">
                            <Globe className="w-3.5 h-3.5" />
                          </Link>
                          <OrgActions profileId={row.id} status={row.status} isHidden={row.is_hidden}
                            accountType={row.account_type} churchId={row.church_id}
                            churchIsHidden={row.church_is_hidden} displayName={name} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-500">
                {total === 0 ? 'No results' : `Showing ${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}`}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link href={buildUrl({ page: String(page - 1) })} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="p-1.5 rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></span>
                )}
                <span className="text-xs text-gray-500 px-1">{page} / {totalPages}</span>
                {page < totalPages ? (
                  <Link href={buildUrl({ page: String(page + 1) })} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="p-1.5 rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed"><ChevronRight className="w-4 h-4" /></span>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-2">
            {pageRows.map((row) => {
              const name = displayName(row)
              const initials = name.slice(0, 2).toUpperCase()
              const publicHref = row.account_type === 'church' && row.church_slug ? `/churches/${row.church_slug}` : `/organizers/${row.id}`
              return (
                <div key={row.id} className={`bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 ${row.is_hidden || row.church_is_hidden ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3 mb-3">
                    {row.avatar_url ? (
                      <Image src={row.avatar_url} alt={name} width={40} height={40} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-violet-600">{initials}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                      <p className="text-xs text-gray-400 truncate">{row.email}</p>
                      {row.church_city && <p className="text-xs text-gray-400 mt-0.5">📍 {row.church_city}</p>}
                    </div>
                    <OrgActions profileId={row.id} status={row.status} isHidden={row.is_hidden}
                      accountType={row.account_type} churchId={row.church_id}
                      churchIsHidden={row.church_is_hidden} displayName={name} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      row.account_type === 'church' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {row.account_type === 'church' ? 'Church' : 'Organiser'}
                    </span>
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                      row.status === 'suspended' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {row.status === 'suspended' ? 'Suspended' : 'Active'}
                    </span>
                    <span className="text-xs text-gray-400">{row.event_count} events</span>
                    <Link href={publicHref} target="_blank"
                      className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors">
                      <Globe className="w-3 h-3" /> View
                    </Link>
                  </div>
                </div>
              )
            })}
            {/* Mobile pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  {page > 1 && <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">← Prev</Link>}
                  {page < totalPages && <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Next →</Link>}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
