export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Calendar, Users, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [eventsRes, pendingRes, usersRes, churchesRes] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('churches').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Live Events', value: eventsRes.count ?? 0, icon: Calendar, color: 'text-green-600 bg-green-50', href: '/admin/events?status=approved' },
    { label: 'Pending Review', value: pendingRes.count ?? 0, icon: Clock, color: 'text-amber-600 bg-amber-50', href: '/admin/events?status=pending' },
    { label: 'Registered Users', value: usersRes.count ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50', href: '/admin/users' },
    { label: 'Churches', value: churchesRes.count ?? 0, icon: CheckCircle, color: 'text-indigo-600 bg-indigo-50', href: '/admin/users' },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500 mt-1">Gospello platform at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-all">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {(pendingRes.count ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-amber-800 font-semibold mb-1">
            ⏳ {pendingRes.count} event{(pendingRes.count ?? 0) > 1 ? 's' : ''} awaiting review
          </p>
          <p className="text-amber-700 text-sm mb-3">Review and approve events so organizers can reach their community.</p>
          <Link
            href="/admin/events?status=pending"
            className="inline-block bg-amber-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Review Now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/events" className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-all group">
          <Calendar className="w-6 h-6 text-indigo-500 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">Event Review</h3>
          <p className="text-sm text-gray-500 mt-1">Approve, reject, and manage event submissions</p>
        </Link>
        <Link href="/admin/users" className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-all group">
          <Users className="w-6 h-6 text-indigo-500 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">User Management</h3>
          <p className="text-sm text-gray-500 mt-1">View and manage organizer and church accounts</p>
        </Link>
        <Link href="/admin/featured" className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-all group">
          <CheckCircle className="w-6 h-6 text-indigo-500 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">Featured Content</h3>
          <p className="text-sm text-gray-500 mt-1">Curate featured events and churches for the homepage</p>
        </Link>
      </div>
    </div>
  )
}
