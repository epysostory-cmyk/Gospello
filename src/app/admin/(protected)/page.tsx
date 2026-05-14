export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  Calendar, Users, Bell, UserCheck, TrendingUp, Layers,
  Plus, ArrowRight, Clock, CheckCircle, Building2, Mic2,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function AdminOverviewPage() {
  const admin = createAdminClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    totalEventsRes,
    pendingEventsRes,
    approvedEventsRes,
    eventsThisMonthRes,
    totalChurchesRes,
    totalOrganizersRes,
    pendingClaimsRes,
    totalUsersRes,
    attendancesRes,
    recentEventsRes,
    recentUsersRes,
    pendingClaimsListRes,
  ] = await Promise.all([
    admin.from('events').select('id', { count: 'exact', head: true }),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('events').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    admin.from('churches').select('id', { count: 'exact', head: true }),
    admin.from('seeded_organizers').select('id', { count: 'exact', head: true }),
    admin.from('claim_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('attendances').select('id', { count: 'exact', head: true }),
    admin.from('events').select('id, title, status, created_at, profiles(display_name), churches(name), seeded_organizers(name)').order('created_at', { ascending: false }).limit(6),
    admin.from('profiles').select('id, display_name, account_type, created_at').order('created_at', { ascending: false }).limit(5),
    admin.from('claim_requests').select('id, profile_name, profile_type, claimant_name, created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(4),
  ])

  const totalEvents   = totalEventsRes.count   ?? 0
  const pendingEvents = pendingEventsRes.count  ?? 0
  const approvedEvents= approvedEventsRes.count ?? 0
  const eventsMonth   = eventsThisMonthRes.count?? 0
  const totalChurches = totalChurchesRes.count  ?? 0
  const totalOrgs     = totalOrganizersRes.count?? 0
  const pendingClaims = pendingClaimsRes.count  ?? 0
  const totalUsers    = totalUsersRes.count     ?? 0
  const registrations = attendancesRes.count    ?? 0

  const pendingClaimsList = pendingClaimsListRes.data ?? []

  type ActivityItem = { type: 'event' | 'user'; title: string; sub: string; time: string; status?: string; href: string }
  const activity: ActivityItem[] = []

  for (const e of recentEventsRes.data ?? []) {
    const church  = Array.isArray(e.churches) ? e.churches[0] : e.churches
    const seeded  = Array.isArray(e.seeded_organizers) ? e.seeded_organizers[0] : e.seeded_organizers
    const profile = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles
    const host    = (church as {name:string}|null)?.name
                 || (seeded as {name:string}|null)?.name
                 || (profile as {display_name:string}|null)?.display_name
                 || 'Unknown'
    activity.push({ type: 'event', title: e.title, sub: host, time: e.created_at, status: e.status, href: '/admin/events' })
  }
  for (const u of recentUsersRes.data ?? []) {
    activity.push({ type: 'user', title: u.display_name, sub: u.account_type, time: u.created_at, href: '/admin/users' })
  }
  activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  const STATUS_DOT: Record<string, string> = {
    pending:  'bg-amber-400',
    approved: 'bg-green-400',
    hidden:   'bg-gray-400',
    rejected: 'bg-red-400',
  }

  const monthName = now.toLocaleString('default', { month: 'long' })

  return (
    <div className="space-y-6 max-w-6xl pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back — here's what's happening on Gospello</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/profiles/new"
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Church
          </Link>
          <Link href="/admin/events/new"
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Event
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {(pendingEvents > 0 || pendingClaims > 0) && (
        <div className="flex flex-col sm:flex-row gap-2">
          {pendingEvents > 0 && (
            <Link href="/admin/moderation"
              className="flex items-center gap-3 flex-1 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 hover:bg-amber-100 transition-colors group">
              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 flex-1">
                <span className="font-bold">{pendingEvents}</span> event{pendingEvents > 1 ? 's' : ''} awaiting review
              </p>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          {pendingClaims > 0 && (
            <Link href="/admin/claims"
              className="flex items-center gap-3 flex-1 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 hover:bg-blue-100 transition-colors group">
              <Bell className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-sm font-medium text-blue-800 flex-1">
                <span className="font-bold">{pendingClaims}</span> profile claim{pendingClaims > 1 ? 's' : ''} need attention
              </p>
              <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {/* Primary stats — 2×2 on mobile, 4 on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Events',    value: totalEvents,   icon: Calendar,   color: '#7C3AED', bg: '#7C3AED14', href: '/admin/events' },
          { label: 'Total Users',     value: totalUsers,    icon: Users,      color: '#059669', bg: '#05966914', href: '/admin/users' },
          { label: 'Registrations',   value: registrations, icon: UserCheck,  color: '#0891B2', bg: '#0891B214', href: null },
          { label: 'Events This Month', value: eventsMonth, icon: TrendingUp, color: '#D97706', bg: '#D9770614', href: '/admin/events' },
        ].map(({ label, value, icon: Icon, color, bg, href }) => {
          const card = (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-none">{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">{label}</p>
            </div>
          )
          return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>
        })}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review',     value: pendingEvents,  icon: Clock,         color: '#D97706', bg: '#FEF3C7', href: '/admin/moderation' },
          { label: 'Approved Events',    value: approvedEvents, icon: CheckCircle,   color: '#059669', bg: '#D1FAE5', href: '/admin/events?status=approved' },
          { label: 'Seeded Churches',    value: totalChurches,  icon: Building2,     color: '#7C3AED', bg: '#EDE9FE', href: '/admin/profiles' },
          { label: 'Seeded Organizers',  value: totalOrgs,      icon: Mic2,          color: '#2563EB', bg: '#DBEAFE', href: '/admin/organizers' },
        ].map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4 flex items-center gap-3 hover:border-gray-200 hover:shadow-md transition-all">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-none">{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Activity</h2>
            <Link href="/admin/events" className="text-xs font-medium text-[#7C3AED] hover:underline">View all →</Link>
          </div>
          {activity.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-gray-400 text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activity.slice(0, 8).map((item, i) => (
                <Link key={i} href={item.href}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm">
                    {item.type === 'event' ? '📅' : item.sub === 'church' ? '⛪' : '🎤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate capitalize">{item.sub}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status && (
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[item.status] ?? 'bg-gray-400'}`} />
                    )}
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {formatDate(item.time, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Pending Claims */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900 text-sm">Pending Claims</h2>
                {pendingClaims > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#7C3AED] text-white min-w-[18px] text-center">{pendingClaims}</span>
                )}
              </div>
              <Link href="/admin/claims" className="text-xs font-medium text-[#7C3AED] hover:underline">View all →</Link>
            </div>
            {pendingClaimsList.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="w-7 h-7 text-green-300 mx-auto mb-1.5" />
                <p className="text-gray-400 text-sm">All caught up</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingClaimsList.map((claim: {id:string;profile_name:string;profile_type:string;claimant_name:string;created_at:string}) => (
                  <Link key={claim.id} href="/admin/claims"
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0 text-sm">
                      {claim.profile_type === 'church' ? '⛪' : '🎤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{claim.profile_name}</p>
                      <p className="text-xs text-gray-400 truncate">by {claim.claimant_name}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'New Church',    href: '/admin/profiles/new',    primary: true },
                { label: 'New Event',     href: '/admin/events/new',       primary: true },
                { label: 'View Claims',   href: '/admin/claims',           primary: false },
                { label: 'Manage Users',  href: '/admin/users',            primary: false },
                { label: 'Moderation',    href: '/admin/moderation',       primary: false },
                { label: 'Featured',      href: '/admin/featured',         primary: false },
              ].map(({ label, href, primary }) => (
                <Link key={href} href={href}
                  className={`flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-semibold text-center transition-colors ${
                    primary
                      ? 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
                      : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* This month summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{monthName} Summary</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Events published</span>
                <span className="font-semibold text-gray-900">{eventsMonth}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pending review</span>
                <span className={`font-semibold ${pendingEvents > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{pendingEvents}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Claim requests</span>
                <span className={`font-semibold ${pendingClaims > 0 ? 'text-blue-600' : 'text-gray-900'}`}>{pendingClaims}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
