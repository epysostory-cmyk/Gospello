export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { TrendingUp, Users, Calendar, Eye, Tag, Star } from 'lucide-react'

export default async function AdminAnalyticsPage() {
  const adminClient = createAdminClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

  const [
    eventsThisMonth,
    eventsLastMonth,
    usersThisMonth,
    usersLastMonth,
    viewsThisMonth,
    attendanceThisMonth,
    topEventsRes,
    categoriesRes,
    eventsByCategoryRes,
  ] = await Promise.all([
    adminClient.from('events').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    adminClient.from('events').select('id', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo.toISOString()).lt('created_at', thirtyDaysAgo.toISOString()),
    adminClient.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    adminClient.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo.toISOString()).lt('created_at', thirtyDaysAgo.toISOString()),
    adminClient.from('events').select('views_count').gte('created_at', thirtyDaysAgo.toISOString()),
    adminClient.from('attendances').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    adminClient.from('events').select('id, title, views_count').eq('status', 'approved').order('views_count', { ascending: false }).limit(5),
    adminClient.from('categories').select('id, name, slug'),
    adminClient.from('events').select('category_id').eq('status', 'approved'),
  ])

  const totalViewsThisMonth = (viewsThisMonth.data ?? []).reduce((sum, e) => sum + (e.views_count ?? 0), 0)

  const eventsNow = eventsThisMonth.count ?? 0
  const eventsPrev = eventsLastMonth.count ?? 0
  const usersNow = usersThisMonth.count ?? 0
  const usersPrev = usersLastMonth.count ?? 0

  function pctChange(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? '+100%' : '—'
    const pct = Math.round(((current - previous) / previous) * 100)
    return pct >= 0 ? `+${pct}%` : `${pct}%`
  }

  const stats = [
    {
      label: 'New Events (30d)',
      value: eventsNow,
      trend: pctChange(eventsNow, eventsPrev),
      icon: Calendar,
      color: '#6366f1',
    },
    {
      label: 'New Users (30d)',
      value: usersNow,
      trend: pctChange(usersNow, usersPrev),
      icon: Users,
      color: '#3b82f6',
    },
    {
      label: 'Total Views (30d)',
      value: totalViewsThisMonth.toLocaleString(),
      trend: null,
      icon: Eye,
      color: '#06b6d4',
    },
    {
      label: 'Attendances (30d)',
      value: attendanceThisMonth.count ?? 0,
      trend: null,
      icon: TrendingUp,
      color: '#22c55e',
    },
  ]

  // Build category event counts
  const eventCountByCategory = new Map<string, number>()
  for (const row of eventsByCategoryRes.data ?? []) {
    if (row.category_id) {
      eventCountByCategory.set(row.category_id, (eventCountByCategory.get(row.category_id) ?? 0) + 1)
    }
  }

  const categoriesWithCount = (categoriesRes.data ?? [])
    .map((c) => ({ ...c, count: eventCountByCategory.get(c.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1 text-sm">Platform performance and metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          const isPositive = stat.trend?.startsWith('+')
          return (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  {stat.trend && (
                    <p className={`text-xs mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.trend} vs prior 30d
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: stat.color + '20' }}>
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Events by Views */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h2 className="font-semibold text-white text-sm">Top Events by Views</h2>
          </div>
          <div className="divide-y divide-white/5">
            {!topEventsRes.data || topEventsRes.data.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-gray-500 text-sm">No data</p>
              </div>
            ) : (
              topEventsRes.data.map((event, idx) => (
                <div key={event.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-gray-600 w-4 flex-shrink-0">{idx + 1}</span>
                    <p className="text-sm text-white truncate">{event.title}</p>
                  </div>
                  <span className="text-sm font-semibold text-cyan-400 flex-shrink-0">{(event.views_count ?? 0).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Categories by Event Count */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <Tag className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-white text-sm">Categories by Event Count</h2>
          </div>
          <div className="divide-y divide-white/5">
            {categoriesWithCount.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-gray-500 text-sm">No data</p>
              </div>
            ) : (
              categoriesWithCount.map((cat, idx) => (
                <div key={cat.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-gray-600 w-4 flex-shrink-0">{idx + 1}</span>
                    <p className="text-sm text-white truncate">{cat.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-400 flex-shrink-0">{cat.count} events</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Growth summary */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <h2 className="font-semibold text-white text-sm">Month-over-Month Growth</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-gray-500 mb-1">Events: this month vs last</p>
            <p className="text-xl font-bold text-white">{eventsNow} <span className="text-sm font-normal text-gray-500">vs {eventsPrev}</span></p>
            <p className={`text-xs mt-1 ${(eventsNow - eventsPrev) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pctChange(eventsNow, eventsPrev)}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-gray-500 mb-1">Users: this month vs last</p>
            <p className="text-xl font-bold text-white">{usersNow} <span className="text-sm font-normal text-gray-500">vs {usersPrev}</span></p>
            <p className={`text-xs mt-1 ${(usersNow - usersPrev) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pctChange(usersNow, usersPrev)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
