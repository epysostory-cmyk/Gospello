export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Search, Plus, Calendar, Eye, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import AdminEventActionsMenu from './AdminEventActionsMenu'
import AdminEventMobileActions from './AdminEventMobileActions'

interface SearchParams {
  search?: string
  status?: string
  page?: string
}

const STATUS_TABS = [
  { value: '',         label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'hidden',   label: 'Hidden' },
  { value: 'rejected', label: 'Rejected' },
]

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  hidden:   'bg-gray-100 text-gray-500 border border-gray-200',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
}

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const admin = createAdminClient()
  const resolved = await searchParams
  const search   = resolved.search || ''
  const status   = resolved.status || ''
  const page     = parseInt(resolved.page || '1')
  const pageSize = 25

  // Stats
  const [pendingRes, approvedRes, rejectedRes, hiddenRes] = await Promise.all([
    admin.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('status', 'hidden'),
  ])
  const pendingCount  = pendingRes.count  ?? 0
  const approvedCount = approvedRes.count ?? 0
  const rejectedCount = rejectedRes.count ?? 0
  const hiddenCount   = hiddenRes.count   ?? 0
  const totalCount    = pendingCount + approvedCount + rejectedCount + hiddenCount

  // Events list
  let query = admin
    .from('events')
    .select('id, title, status, start_date, views_count, is_free, city, state, profiles(display_name), churches(name), seeded_organizers(name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('title', `%${search}%`)
  if (status) query = query.eq('status', status as 'pending' | 'approved' | 'rejected' | 'hidden')

  const { data: events, count: total } = await query.range((page - 1) * pageSize, page * pageSize - 1)
  const totalPages = Math.ceil((total ?? 0) / pageSize)

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    if (search)  p.set('search', search)
    if (status)  p.set('status', status)
    if (page > 1) p.set('page', String(page))
    Object.entries(overrides).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k) })
    const s = p.toString()
    return `/admin/events${s ? `?${s}` : ''}`
  }

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalCount.toLocaleString()} total events on platform</p>
        </div>
        <Link href="/admin/events/new"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
          <Plus className="w-4 h-4" /> New Event
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending',  count: pendingCount,  icon: Clock,        color: 'text-amber-600', bg: 'bg-amber-50',  href: buildUrl({ status: 'pending', page: undefined }) },
          { label: 'Approved', count: approvedCount, icon: CheckCircle,  color: 'text-green-600', bg: 'bg-green-50',  href: buildUrl({ status: 'approved', page: undefined }) },
          { label: 'Hidden',   count: hiddenCount,   icon: Eye,          color: 'text-gray-500',  bg: 'bg-gray-100',  href: buildUrl({ status: 'hidden', page: undefined }) },
          { label: 'Rejected', count: rejectedCount, icon: XCircle,      color: 'text-red-500',   bg: 'bg-red-50',    href: buildUrl({ status: 'rejected', page: undefined }) },
        ].map(({ label, count, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4 flex items-center gap-3 hover:border-gray-200 transition-colors group">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-none">{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
            {label === 'Pending' && count > 0 && (
              <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            )}
          </Link>
        ))}
      </div>

      {/* ── Search + Status tabs ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100">
          <form method="GET" action="/admin/events" className="flex gap-2">
            {status && <input type="hidden" name="status" value={status} />}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text" name="search" placeholder="Search by event title..."
                defaultValue={search}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>
            <button type="submit"
              className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors flex-shrink-0">
              Search
            </button>
            {search && (
              <Link href={buildUrl({ search: undefined, page: undefined })}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 flex-shrink-0">
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Status tabs */}
        <div className="px-4 py-2 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATUS_TABS.map(({ value, label }) => {
            const active = status === value
            return (
              <Link key={value}
                href={buildUrl({ status: value || undefined, page: undefined })}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#7C3AED] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {label}
                {value === 'pending' && pendingCount > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
                    {pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Results count ── */}
      {total !== null && (
        <p className="text-xs text-gray-400 px-1">
          {total.toLocaleString()} event{total !== 1 ? 's' : ''} {search && `matching "${search}"`}
        </p>
      )}

      {/* ── DESKTOP TABLE (md+) ── */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Organizer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Views</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {!events || events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No events found</p>
                </td>
              </tr>
            ) : events.map((event) => {
              const church    = Array.isArray(event.churches) ? event.churches[0] : event.churches
              const seeded    = Array.isArray(event.seeded_organizers) ? event.seeded_organizers[0] : event.seeded_organizers
              const profile   = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
              const organizer = (church as {name:string}|null)?.name || (seeded as {name:string}|null)?.name || (profile as {display_name:string}|null)?.display_name || '—'
              return (
                <tr key={event.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-3.5 max-w-[280px]">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    {(event.city || event.state) && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{[event.city, event.state].filter(Boolean).join(', ')}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-gray-600 truncate max-w-[140px]">{organizer}</p>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <p className="text-sm text-gray-500">
                      {event.start_date ? formatDate(event.start_date, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-gray-500">{(event.views_count || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[event.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end">
                      <AdminEventActionsMenu event={event as any} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARDS (below md) ── */}
      <div className="md:hidden space-y-2">
        {!events || events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No events found</p>
          </div>
        ) : events.map((event) => {
          const church    = Array.isArray(event.churches) ? event.churches[0] : event.churches
          const seeded    = Array.isArray(event.seeded_organizers) ? event.seeded_organizers[0] : event.seeded_organizers
          const profile   = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
          const organizer = (church as {name:string}|null)?.name || (seeded as {name:string}|null)?.name || (profile as {display_name:string}|null)?.display_name || '—'
          return (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{event.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{organizer}</p>
                </div>
                <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[event.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {event.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                {event.start_date && (
                  <span>{formatDate(event.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                )}
                {event.city && <span>📍 {event.city}</span>}
                <span>{(event.views_count || 0).toLocaleString()} views</span>
              </div>
              <AdminEventMobileActions event={event as any} />
            </div>
          )
        })}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Page <span className="font-semibold text-gray-900">{page}</span> of {totalPages}
          </p>
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
