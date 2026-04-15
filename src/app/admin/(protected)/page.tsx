export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Calendar, Users, Building2, Clock, Eye, UserCheck, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const now = new Date()
  const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

  const [
    totalEventsRes, activeEventsRes, allUsersRes, orgsRes,
    attendanceRes, viewsRes, pendingRes,
    recentEventsRes, recentUsersRes, recentChurchesRes,
  ] = await Promise.all([
    adminClient.from('events').select('id', { count: 'exact', head: true }),
    adminClient.from('events').select('id', { count: 'exact', head: true }).eq('status', 'approved').gte('start_date', now.toISOString()).lte('start_date', in60Days),
    adminClient.from('profiles').select('id', { count: 'exact', head: true }),
    adminClient.from('churches').select('id', { count: 'exact', head: true }),
    adminClient.from('attendances').select('id', { count: 'exact', head: true }),
    adminClient.from('events').select('views_count').eq('status', 'approved'),
    adminClient.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    adminClient.from('events').select('id, title, status, created_at, profiles(display_name)').order('created_at', { ascending: false }).limit(6),
    adminClient.from('profiles').select('id, display_name, account_type, created_at').order('created_at', { ascending: false }).limit(5),
    adminClient.from('churches').select('id, name, city, created_at').order('created_at', { ascending: false }).limit(4),
  ])

  const totalViews = (viewsRes.data ?? []).reduce((sum, e) => sum + (e.views_count ?? 0), 0)
  const pendingCount = pendingRes.count ?? 0

  const statRows = [
    [
      { label: 'Total Events', value: totalEventsRes.count ?? 0, icon: Calendar, color: '#6366f1', href: '/admin/events', alert: false },
      { label: 'Active Events', value: activeEventsRes.count ?? 0, icon: Calendar, color: '#22c55e', href: '/admin/events?status=approved', alert: false },
      { label: 'Total Users', value: allUsersRes.count ?? 0, icon: Users, color: '#3b82f6', href: '/admin/users', alert: false },
      { label: 'Orgs & Churches', value: orgsRes.count ?? 0, icon: Building2, color: '#a855f7', href: '/admin/organizations', alert: false },
    ],
    [
      { label: 'Total Attendance', value: attendanceRes.count ?? 0, icon: UserCheck, color: '#f59e0b', href: null, alert: false },
      { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: '#06b6d4', href: null, alert: false },
      { label: 'Pending Moderation', value: pendingCount, icon: AlertTriangle, color: pendingCount > 0 ? '#ef4444' : '#6b7280', href: '/admin/events?status=pending', alert: pendingCount > 0 },
    ],
  ]

  // Build activity feed — merge and sort by date
  const activity: { icon: string; text: string; time: string; href: string }[] = []

  for (const e of (recentEventsRes.data ?? [])) {
    const profile = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles
    activity.push({
      icon: '🟢',
      text: `New event submitted — "${e.title}" by ${(profile as { display_name: string })?.display_name ?? 'Unknown'}`,
      time: e.created_at,
      href: '/admin/events',
    })
  }
  for (const u of (recentUsersRes.data ?? [])) {
    activity.push({
      icon: u.account_type === 'church' ? '⛪' : '🎙️',
      text: `New ${u.account_type} registered — ${u.display_name}`,
      time: u.created_at,
      href: '/admin/organizations',
    })
  }
  for (const c of (recentChurchesRes.data ?? [])) {
    activity.push({
      icon: '⛪',
      text: `New church registered — ${c.name}, ${c.city}`,
      time: c.created_at,
      href: '/admin/organizations',
    })
  }

  activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const recentActivity = activity.slice(0, 20)

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm">Platform health at a glance</p>
      </div>

      {/* Stat rows */}
      {statRows.map((row, ri) => (
        <div key={ri} className={`grid gap-4 ${ri === 0 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {row.map(({ label, value, icon: Icon, color, href, alert }) => {
            const card = (
              <div
                className={`rounded-2xl border p-4 transition-all ${
                  alert
                    ? 'bg-red-950/50 border-red-800/50 hover:bg-red-950'
                    : 'bg-white/5 border-white/10 hover:bg-white/8'
                } ${href ? 'cursor-pointer' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color + '20' }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <p className={`text-2xl font-bold ${alert ? 'text-red-400' : 'text-white'}`}>{value}</p>
                <p className="text-sm text-gray-400 mt-0.5">{label}</p>
              </div>
            )
            return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>
          })}
        </div>
      ))}

      {/* Activity feed */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Recent Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">Last 20 platform events</p>
        </div>
        {recentActivity.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400 text-sm">No activity yet — the platform is ready for its first event.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentActivity.map((item, i) => (
              <Link key={i} href={item.href} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors">
                <span className="text-base mt-0.5 flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{item.text}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(item.time, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
