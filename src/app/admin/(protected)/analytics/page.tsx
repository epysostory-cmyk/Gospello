export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  TrendingUp, Users, Calendar, Eye, UserCheck,
  Building2, Mic2, MapPin, Tag, ArrowUp, ArrowDown, Minus,
} from 'lucide-react'
import Link from 'next/link'

export default async function AdminAnalyticsPage() {
  const admin = createAdminClient()

  const now = new Date()
  const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const d60 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const d180 = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()

  const [
    // platform totals
    totalEventsRes,
    totalUsersRes,
    totalChurchesRes,
    totalOrgsRes,
    totalAttendancesRes,
    totalViewsRes,
    // 30d window
    events30Res,
    users30Res,
    attendances30Res,
    // prev 30d window
    eventsPrev30Res,
    usersPrev30Res,
    attendancesPrev30Res,
    // event status breakdown
    approvedRes,
    pendingRes,
    hiddenRes,
    rejectedRes,
    // top events by views
    topEventsRes,
    // last 6 months raw rows for trend tables
    events180Res,
    users180Res,
    attendances180Res,
    // geographic
    eventsStateRes,
    // categories
    categoriesRes,
    eventsByCatRes,
    // churches claimed
    churchClaimedRes,
    churchUnclaimedRes,
    // account types
    churchUsersRes,
    orgUsersRes,
    // free vs paid
    freeEventsRes,
    paidEventsRes,
  ] = await Promise.all([
    admin.from('events').select('id', { count: 'exact', head: true }),
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('churches').select('id', { count: 'exact', head: true }),
    admin.from('seeded_organizers').select('id', { count: 'exact', head: true }),
    admin.from('attendances').select('id', { count: 'exact', head: true }),
    admin.from('events').select('views_count').eq('status', 'approved'),

    admin.from('events').select('id', { count: 'exact', head: true }).gte('created_at', d30),
    admin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', d30),
    admin.from('attendances').select('id', { count: 'exact', head: true }).gte('created_at', d30),

    admin.from('events').select('id', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
    admin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
    admin.from('attendances').select('id', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),

    admin.from('events').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('status', 'hidden'),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),

    admin.from('events').select('id, title, views_count, city, state, start_date').eq('status', 'approved').order('views_count', { ascending: false }).limit(10),

    admin.from('events').select('created_at').gte('created_at', d180).order('created_at', { ascending: true }),
    admin.from('profiles').select('created_at').gte('created_at', d180).order('created_at', { ascending: true }),
    admin.from('attendances').select('created_at').gte('created_at', d180).order('created_at', { ascending: true }),

    admin.from('events').select('state').eq('status', 'approved').not('state', 'is', null),

    admin.from('categories').select('id, name'),
    admin.from('events').select('category_id').eq('status', 'approved').not('category_id', 'is', null),

    admin.from('churches').select('id', { count: 'exact', head: true }).eq('is_claimed', true),
    admin.from('churches').select('id', { count: 'exact', head: true }).eq('is_claimed', false),

    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('account_type', 'church'),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('account_type', 'organizer'),

    admin.from('events').select('id', { count: 'exact', head: true }).eq('is_free', true).eq('status', 'approved'),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('is_free', false).eq('status', 'approved'),
  ])

  // ── Derived numbers ──────────────────────────────────────────────────────
  const totalViews    = (totalViewsRes.data ?? []).reduce((s, e) => s + (e.views_count ?? 0), 0)
  const events30      = events30Res.count ?? 0
  const eventsPrev30  = eventsPrev30Res.count ?? 0
  const users30       = users30Res.count ?? 0
  const usersPrev30   = usersPrev30Res.count ?? 0
  const att30         = attendances30Res.count ?? 0
  const attPrev30     = attendancesPrev30Res.count ?? 0

  function delta(cur: number, prev: number) {
    if (prev === 0) return cur > 0 ? 100 : 0
    return Math.round(((cur - prev) / prev) * 100)
  }

  // ── Monthly buckets (last 6 months) ──────────────────────────────────────
  const months: { key: string; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
    })
  }

  function bucketByMonth(rows: { created_at: string }[]) {
    const m: Record<string, number> = {}
    for (const r of rows) {
      const k = r.created_at.slice(0, 7)
      m[k] = (m[k] ?? 0) + 1
    }
    return m
  }

  const eventsByMonth      = bucketByMonth(events180Res.data ?? [])
  const usersByMonth       = bucketByMonth(users180Res.data ?? [])
  const attendancesByMonth = bucketByMonth(attendances180Res.data ?? [])

  const maxEvents      = Math.max(...months.map(m => eventsByMonth[m.key] ?? 0), 1)
  const maxUsers       = Math.max(...months.map(m => usersByMonth[m.key] ?? 0), 1)
  const maxAttendances = Math.max(...months.map(m => attendancesByMonth[m.key] ?? 0), 1)

  // ── Geographic ───────────────────────────────────────────────────────────
  const stateMap: Record<string, number> = {}
  for (const e of eventsStateRes.data ?? []) {
    if (e.state) stateMap[e.state] = (stateMap[e.state] ?? 0) + 1
  }
  const topStates = Object.entries(stateMap).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxStateCount = topStates[0]?.[1] ?? 1

  // ── Categories ───────────────────────────────────────────────────────────
  const catMap: Record<string, number> = {}
  for (const e of eventsByCatRes.data ?? []) {
    if (e.category_id) catMap[e.category_id] = (catMap[e.category_id] ?? 0) + 1
  }
  const topCats = (categoriesRes.data ?? [])
    .map(c => ({ name: c.name, count: catMap[c.id] ?? 0 }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
  const maxCatCount = topCats[0]?.count ?? 1

  // ── Event status ─────────────────────────────────────────────────────────
  const approved = approvedRes.count ?? 0
  const pending  = pendingRes.count  ?? 0
  const hidden   = hiddenRes.count   ?? 0
  const rejected = rejectedRes.count ?? 0
  const totalForStatus = approved + pending + hidden + rejected || 1

  // ── Church claim rate ────────────────────────────────────────────────────
  const claimed   = churchClaimedRes.count   ?? 0
  const unclaimed = churchUnclaimedRes.count ?? 0
  const totalChurches = (totalChurchesRes.count ?? 0) || 1

  return (
    <div className="space-y-6 max-w-6xl pb-10">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Full platform snapshot — updated on every page load</p>
      </div>

      {/* ── Platform totals ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Events',   value: totalEventsRes.count ?? 0, icon: Calendar,  color: '#7C3AED', bg: '#EDE9FE', href: '/admin/events' },
          { label: 'Total Views',    value: totalViews,                 icon: Eye,       color: '#0891B2', bg: '#CFFAFE', href: null },
          { label: 'Total Users',    value: totalUsersRes.count ?? 0,   icon: Users,     color: '#059669', bg: '#D1FAE5', href: '/admin/users' },
          { label: 'Registrations',  value: totalAttendancesRes.count ?? 0, icon: UserCheck, color: '#D97706', bg: '#FEF3C7', href: null },
          { label: 'Churches',       value: totalChurchesRes.count ?? 0, icon: Building2, color: '#7C3AED', bg: '#EDE9FE', href: '/admin/seededchurches' },
          { label: 'Organizers',     value: totalOrgsRes.count ?? 0,    icon: Mic2,      color: '#2563EB', bg: '#DBEAFE', href: '/admin/organizers' },
        ].map(({ label, value, icon: Icon, color, bg, href }) => {
          const card = (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4 hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-none">{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
            </div>
          )
          return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>
        })}
      </div>

      {/* ── 30-day KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'New Events', cur: events30,  prev: eventsPrev30,  icon: Calendar,  color: '#7C3AED', bg: '#EDE9FE' },
          { label: 'New Users',  cur: users30,   prev: usersPrev30,   icon: Users,     color: '#059669', bg: '#D1FAE5' },
          { label: 'New Registrations', cur: att30, prev: attPrev30,  icon: UserCheck, color: '#D97706', bg: '#FEF3C7' },
        ].map(({ label, cur, prev, icon: Icon, color, bg }) => {
          const pct = delta(cur, prev)
          const up  = pct > 0
          const eq  = pct === 0
          return (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  eq ? 'bg-gray-100 text-gray-500' : up ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                }`}>
                  {eq ? <Minus className="w-3 h-3" /> : up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {eq ? '—' : `${Math.abs(pct)}%`}
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 leading-none">{cur.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">{label} <span className="text-gray-400 font-normal">last 30 days</span></p>
              <p className="text-xs text-gray-400 mt-1">{prev} in prior 30 days</p>
            </div>
          )
        })}
      </div>

      {/* ── Monthly trend tables ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { title: 'Events per Month', color: '#7C3AED', bg: '#EDE9FE', map: eventsByMonth, max: maxEvents },
          { title: 'New Users per Month', color: '#059669', bg: '#D1FAE5', map: usersByMonth, max: maxUsers },
          { title: 'Registrations per Month', color: '#D97706', bg: '#FEF3C7', map: attendancesByMonth, max: maxAttendances },
        ].map(({ title, color, bg, map, max }) => (
          <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
            </div>
            <div className="p-4 space-y-2.5">
              {months.map(({ key, label }) => {
                const val = map[key] ?? 0
                const pct = Math.round((val / max) * 100)
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 font-medium">{label}</span>
                      <span className="text-xs font-bold text-gray-900">{val}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Top events + geographic ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top 10 events by views */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Top Events by Views</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {!topEventsRes.data || topEventsRes.data.length === 0 ? (
              <div className="px-5 py-8 text-center"><p className="text-gray-400 text-sm">No data yet</p></div>
            ) : topEventsRes.data.map((e, i) => {
              const maxV = topEventsRes.data![0].views_count ?? 1
              const pct  = Math.round(((e.views_count ?? 0) / maxV) * 100)
              return (
                <div key={e.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
                      {(e.city || e.state) && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{[e.city, e.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <div className="h-1 rounded-full bg-gray-100 mt-1.5 overflow-hidden">
                        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-cyan-600 flex-shrink-0">{(e.views_count ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Events by state */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Events by State</h2>
          </div>
          <div className="p-4 space-y-2.5">
            {topStates.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
            ) : topStates.map(([state, count]) => {
              const pct = Math.round((count / maxStateCount) * 100)
              return (
                <div key={state}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{state}</span>
                    <span className="text-xs font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Categories + Event status + Church claims + Account split ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Top categories */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Top Categories</h2>
          </div>
          <div className="p-4 space-y-2.5">
            {topCats.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
            ) : topCats.map(({ name, count }) => {
              const pct = Math.round((count / maxCatCount) * 100)
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate pr-2">{name}</span>
                    <span className="text-xs font-bold text-gray-900 flex-shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Event status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Event Status</h2>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Approved', count: approved, color: '#10B981', bg: '#D1FAE5' },
              { label: 'Pending',  count: pending,  color: '#F59E0B', bg: '#FEF3C7' },
              { label: 'Hidden',   count: hidden,   color: '#9CA3AF', bg: '#F3F4F6' },
              { label: 'Rejected', count: rejected, color: '#EF4444', bg: '#FEE2E2' },
            ].map(({ label, count, color, bg }) => {
              const pct = Math.round((count / totalForStatus) * 100)
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">{label}</span>
                      <span className="text-xs font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Church claim rate */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-violet-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Church Claims</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="text-center py-2">
              <p className="text-4xl font-bold text-gray-900">{Math.round((claimed / totalChurches) * 100)}%</p>
              <p className="text-xs text-gray-500 mt-1">claim rate</p>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.round((claimed / totalChurches) * 100)}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-violet-50 rounded-xl p-2.5">
                <p className="text-lg font-bold text-violet-700">{claimed}</p>
                <p className="text-[10px] text-violet-500 font-medium">Claimed</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5">
                <p className="text-lg font-bold text-gray-600">{unclaimed}</p>
                <p className="text-[10px] text-gray-400 font-medium">Unclaimed</p>
              </div>
            </div>
          </div>
        </div>

        {/* User account types + free/paid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Platform Split</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">User Type</p>
              <div className="space-y-2">
                {[
                  { label: 'Church accounts',    count: churchUsersRes.count ?? 0,  color: '#7C3AED' },
                  { label: 'Organizer accounts', count: orgUsersRes.count ?? 0,     color: '#2563EB' },
                ].map(({ label, count, color }) => {
                  const total = (churchUsersRes.count ?? 0) + (orgUsersRes.count ?? 0) || 1
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-xs text-gray-600 flex-1 truncate">{label}</span>
                      <span className="text-xs font-bold text-gray-900">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Events</p>
              <div className="space-y-2">
                {[
                  { label: 'Free events',  count: freeEventsRes.count ?? 0,  color: '#10B981' },
                  { label: 'Paid events',  count: paidEventsRes.count ?? 0,  color: '#F59E0B' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs text-gray-600 flex-1">{label}</span>
                    <span className="text-xs font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
