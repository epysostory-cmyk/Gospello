import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Dashboard' }

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, CheckCircle, Clock, XCircle, Plus, ArrowRight, Building2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Event } from '@/types/database'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Church accounts without a church profile must complete setup first
  const { data: profile } = await supabase.from('profiles').select('account_type, ministry_type, ministry_types').eq('id', user.id).single()
  if (profile?.account_type === 'church') {
    const { data: church } = await supabase.from('churches').select('id').eq('profile_id', user!.id).single()
    if (!church) redirect('/dashboard/church/setup')
  }

  // Check for missing denomination (church) or ministry_type (organizer)
  let churchDenomination: string | null = null
  if (profile?.account_type === 'church') {
    const { data: churchData } = await supabase
      .from('churches')
      .select('denomination')
      .eq('profile_id', user.id)
      .maybeSingle()
    churchDenomination = churchData?.denomination ?? null
  }
  const needsDenomination = profile?.account_type === 'church' && !churchDenomination
  const profileAny = profile as { ministry_type?: string | null; ministry_types?: string[] | null } | null
  const needsMinistryType = profile?.account_type === 'organizer'
    && !profileAny?.ministry_type
    && !(profileAny?.ministry_types?.length)

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: allEvents } = await supabase
    .from('events')
    .select('status')
    .eq('organizer_id', user.id)

  const stats = {
    total: allEvents?.length ?? 0,
    approved: allEvents?.filter((e) => e.status === 'approved').length ?? 0,
    pending: allEvents?.filter((e) => e.status === 'pending').length ?? 0,
    rejected: allEvents?.filter((e) => e.status === 'rejected').length ?? 0,
  }

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (status === 'pending') return <Clock className="w-4 h-4 text-amber-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const statusColor = (status: string) => {
    if (status === 'approved') return 'text-green-700 bg-green-50'
    if (status === 'pending') return 'text-amber-700 bg-amber-50'
    return 'text-red-700 bg-red-50'
  }

  return (
    <div className="space-y-8 max-w-4xl">

      {/* ── Completion banners ─────────────────────────────────── */}
      {needsDenomination && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Add your denomination so people can find your church more easily.
            </p>
          </div>
          <a href="/dashboard/church" className="flex-shrink-0 text-sm font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2">
            Update Profile →
          </a>
        </div>
      )}

      {needsMinistryType && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Add your ministry type so people can find you more easily.
            </p>
          </div>
          <a href="/dashboard/profile" className="flex-shrink-0 text-sm font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2">
            Update Profile →
          </a>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/dashboard/events/new"
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Post Event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: stats.total, icon: Calendar, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600 bg-red-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent events */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Events</h2>
          <Link href="/dashboard/events" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!events || events.length === 0 ? (
          <div className="p-10 text-center">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No events yet. Post your first event!</p>
            <Link
              href="/dashboard/events/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Post Event
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(events as Event[]).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{event.title}</p>
                  <p className="text-sm text-gray-500">{formatDate(event.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor(event.status)}`}>
                    {statusIcon(event.status)}
                    {event.status}
                  </span>
                  <Link
                    href={`/dashboard/events/${event.id}/edit`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm text-amber-800 font-medium">
            ⏳ You have {stats.pending} event{stats.pending > 1 ? 's' : ''} awaiting admin review. We&apos;ll notify you by email once it&apos;s approved.
          </p>
        </div>
      )}

      {/* Church profile prompt */}
      {profile?.account_type === 'church' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <p className="text-sm text-indigo-800 font-medium">
              Manage your church&apos;s public profile, logo, and banner
            </p>
          </div>
          <Link href="/dashboard/church" className="flex-shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Edit profile →
          </Link>
        </div>
      )}
    </div>
  )
}
