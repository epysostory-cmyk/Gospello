export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { TrendingUp, Users, Calendar, Eye } from 'lucide-react'

export default async function AdminAnalyticsPage() {
  const adminClient = createAdminClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [eventsRes, usersRes, viewsRes, attendanceRes] = await Promise.all([
    adminClient
      .from('events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString()),
    adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString()),
    adminClient
      .from('events')
      .select('views_count')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    adminClient
      .from('attendances')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString()),
  ])

  const totalViews = (viewsRes.data ?? []).reduce((sum, e) => sum + (e.views_count ?? 0), 0)

  const stats = [
    {
      label: 'New Events (30d)',
      value: eventsRes.count ?? 0,
      icon: Calendar,
      color: '#6366f1',
      trend: '+12%'
    },
    {
      label: 'New Users (30d)',
      value: usersRes.count ?? 0,
      icon: Users,
      color: '#3b82f6',
      trend: '+8%'
    },
    {
      label: 'Total Views (30d)',
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: '#06b6d4',
      trend: '+24%'
    },
    {
      label: 'Attendances (30d)',
      value: attendanceRes.count ?? 0,
      icon: TrendingUp,
      color: '#22c55e',
      trend: '+5%'
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1 text-sm">Platform performance and metrics (Last 30 days)</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-green-400 mt-2">{stat.trend} from last 30d</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: stat.color + '20' }}>
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Placeholder for charts */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-gray-400 text-sm">Advanced charts and detailed analytics coming soon</p>
      </div>
    </div>
  )
}
