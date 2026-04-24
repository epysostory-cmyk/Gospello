export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Calendar, Users, Bell, UserCheck, TrendingUp, Layers, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function AdminOverviewPage() {
  const adminClient = createAdminClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    totalEventsRes,
    totalProfilesRes,
    pendingClaimsRes,
    totalUsersRes,
    eventsThisMonthRes,
    attendancesRes,
    pendingModerationRes,
    recentEventsRes,
    recentUsersRes,
    recentClaimsRes,
  ] = await Promise.all([
    adminClient.from('events').select('id', { count: 'exact', head: true }),
    adminClient.from('churches').select('id', { count: 'exact', head: true }),
    adminClient.from('claim_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    adminClient.from('profiles').select('id', { count: 'exact', head: true }),
    adminClient.from('events').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    adminClient.from('attendances').select('id', { count: 'exact', head: true }),
    adminClient.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    adminClient.from('events').select('id, title, status, created_at, profiles(display_name)').order('created_at', { ascending: false }).limit(5),
    adminClient.from('profiles').select('id, display_name, account_type, created_at').order('created_at', { ascending: false }).limit(5),
    adminClient.from('claim_requests').select('id, profile_name, profile_type, claimant_name, created_at, status').eq('status', 'pending').order('created_at', { ascending: true }).limit(3),
  ])

  const stats = [
    { label: 'Total Events',         value: totalEventsRes.count ?? 0,      icon: Calendar,   color: '#7C3AED', href: '/admin/events' },
    { label: 'Total Profiles',        value: totalProfilesRes.count ?? 0,    icon: Layers,     color: '#2563EB', href: '/admin/profiles' },
    { label: 'Pending Claims',        value: pendingClaimsRes.count ?? 0,    icon: Bell,       color: pendingClaimsRes.count ? '#DC2626' : '#6B7280', href: '/admin/claims' },
    { label: 'Total Users',           value: totalUsersRes.count ?? 0,       icon: Users,      color: '#059669', href: '/admin/users' },
    { label: 'Events This Month',     value: eventsThisMonthRes.count ?? 0,  icon: TrendingUp, color: '#D97706', href: '/admin/events' },
    { label: 'Total Registrations',   value: attendancesRes.count ?? 0,      icon: UserCheck,  color: '#0891B2', href: null },
  ]

  // Build activity feed
  type ActivityItem = { icon: string; text: string; time: string; href: string }
  const activity: ActivityItem[] = []

  for (const e of recentEventsRes.data ?? []) {
    const profile = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles
    activity.push({
      icon: '📅',
      text: `New event — "${e.title}" by ${(profile as {display_name:string})?.display_name ?? 'Unknown'}`,
      time: e.created_at,
      href: '/admin/events',
    })
  }
  for (const u of recentUsersRes.data ?? []) {
    activity.push({
      icon: u.account_type === 'church' ? '⛪' : '🎤',
      text: `New ${u.account_type} registered — ${u.display_name}`,
      time: u.created_at,
      href: '/admin/users',
    })
  }
  activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  const pendingClaims = recentClaimsRes.data ?? []

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Platform overview and quick actions</p>
        </div>
        {/* Quick actions */}
        <div className="hidden sm:flex items-center gap-2">
          <Link href="/admin/profiles/new"
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
            <Plus className="w-4 h-4" /> New Profile
          </Link>
          <Link href="/admin/events/new"
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
            <Plus className="w-4 h-4" /> New Event
          </Link>
        </div>
      </div>

      {/* 6 stat cards — 3×2 grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, href }) => {
          const card = (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: color + '15' }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p className="text-3xl font-bold text-gray-900 leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              <p className="text-sm text-gray-500 mt-1.5">{label}</p>
            </div>
          )
          return href
            ? <Link key={label} href={href}>{card}</Link>
            : <div key={label}>{card}</div>
        })}
      </div>

      {/* Pending moderation alert */}
      {(pendingModerationRes.count ?? 0) > 0 && (
        <Link href="/admin/moderation"
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 hover:bg-amber-100 transition-colors group">
          <Bell className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 flex-1">
            {pendingModerationRes.count} event{(pendingModerationRes.count ?? 0) > 1 ? 's' : ''} awaiting moderation
          </p>
          <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Activity</h2>
          </div>
          {activity.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-gray-400 text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activity.map((item, i) => (
                <Link key={i} href={item.href}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <span className="text-base mt-0.5 flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-1">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(item.time, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column: pending claims + quick actions */}
        <div className="lg:col-span-2 space-y-4">

          {/* Pending Claims preview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Pending Claims</h2>
              <Link href="/admin/claims" className="text-xs font-medium text-[#7C3AED] hover:underline">View all</Link>
            </div>
            {pendingClaims.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-gray-400 text-sm">No pending claims</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingClaims.map((claim: {id:string;profile_name:string;profile_type:string;claimant_name:string;created_at:string;status:string}) => (
                  <Link key={claim.id} href="/admin/claims"
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <span className="text-base mt-0.5">{claim.profile_type === 'church' ? '⛪' : '🎤'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{claim.profile_name}</p>
                      <p className="text-xs text-gray-500">by {claim.claimant_name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '+ New Profile', href: '/admin/profiles/new', primary: true },
                { label: '+ New Event',   href: '/admin/events/new',   primary: false },
                { label: 'View Claims',   href: '/admin/claims',       primary: false },
                { label: 'Manage Users',  href: '/admin/users',        primary: false },
              ].map(({ label, href, primary }) => (
                <Link key={href} href={href}
                  className={`flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-semibold text-center transition-colors ${
                    primary
                      ? 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
