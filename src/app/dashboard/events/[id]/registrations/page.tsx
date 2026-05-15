export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, CheckCircle2, Clock, Ticket, BookmarkCheck, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ExportCSVButton from './_components/ExportCSVButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EventRegistrationsPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  // Fetch event — include registration_type + is_free + views so we can tailor the UI
  const { data: event } = await admin
    .from('events')
    .select('id, title, slug, organizer_id, start_date, city, state, registration_type, is_free, views_count')
    .eq('id', id)
    .single()

  if (!event) notFound()
  if (event.organizer_id !== user.id) notFound()

  const regType = event.registration_type as string | null
  const isPaid = regType === 'paid'
  const isFreeReg = regType === 'free_registration'
  const isInstant = regType === 'free_no_registration' || (!regType && event.is_free)

  // Fetch registrations + saved count + attendance count in parallel
  const [{ data: registrations }, { count: savedCount }, { count: attendanceCount }] = await Promise.all([
    admin
      .from('registrations')
      .select('*')
      .eq('event_id', id)
      .order('ticket_number', { ascending: true }),
    admin
      .from('saved_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id),
    admin
      .from('attendances')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id),
  ])

  const regs = registrations ?? []
  const interestedCount = savedCount ?? 0
  const confirmedCount = regs.filter(r => r.paid_confirmed).length
  const pendingPaymentCount = regs.filter(r => !r.paid_confirmed).length

  return (
    <div className="max-w-3xl space-y-5">

      {/* Back + header */}
      <div>
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Events
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{event.title}</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              {event.city ? ` · ${event.city}` : ''}
            </p>
          </div>
          {regs.length > 0 && (
            <ExportCSVButton registrations={regs} eventSlug={event.slug ?? id} />
          )}
        </div>
      </div>

      {/* ── Instant / free-no-registration ── */}
      {isInstant && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-3xl font-black text-gray-900">{(event.views_count ?? 0).toLocaleString()}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Eye className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Views</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-3xl font-black text-emerald-600">{(attendanceCount ?? 0).toLocaleString()}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Users className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Going</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-3xl font-black text-rose-500">{interestedCount.toLocaleString()}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <BookmarkCheck className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Saved</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              This is a free drop-in event — no registration required. Anyone can tap <span className="font-semibold text-gray-700">I&apos;m Going</span> on the event page.
            </p>
          </div>
        </>
      )}

      {/* ── Free registration ── */}
      {isFreeReg && (
        <>
          {/* Stats — only what matters for a free event */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-3xl font-black text-gray-900">{(event.views_count ?? 0).toLocaleString()}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Eye className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Views</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-3xl font-black text-emerald-600">{regs.length}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Users className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Registered</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-3xl font-black text-rose-500">{interestedCount}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <BookmarkCheck className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Saved</p>
              </div>
            </div>
          </div>

          {/* Attendee list */}
          {regs.length === 0 ? (
            <EmptyState />
          ) : (
            <AttendeeList regs={regs} showPayment={false} />
          )}
        </>
      )}

      {/* ── Paid event ── */}
      {isPaid && (
        <>
          {/* Stats — payment-aware */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-3xl font-black text-gray-900">{(event.views_count ?? 0).toLocaleString()}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Eye className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Views</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-3xl font-black text-indigo-600">{regs.length}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Users className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Registered</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-3xl font-black text-emerald-600">{confirmedCount}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Paid</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-3xl font-black text-rose-500">{interestedCount}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <BookmarkCheck className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Saved</p>
              </div>
            </div>
          </div>

          {pendingPaymentCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <span className="font-semibold">{pendingPaymentCount} {pendingPaymentCount === 1 ? 'person' : 'people'}</span> registered but payment hasn&apos;t been confirmed yet. Check your payment dashboard.
            </div>
          )}

          {regs.length === 0 ? (
            <EmptyState />
          ) : (
            <AttendeeList regs={regs} showPayment={true} />
          )}
        </>
      )}

    </div>
  )
}

/* ── Shared components ───────────────────────────────────── */

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
      <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
      <p className="text-base font-semibold text-gray-700 mb-1">No registrations yet</p>
      <p className="text-sm text-gray-400">People who register will appear here.</p>
    </div>
  )
}

function AttendeeList({ regs, showPayment }: { regs: any[]; showPayment: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">{regs.length} {regs.length === 1 ? 'attendee' : 'attendees'}</p>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-gray-50 sm:hidden">
        {regs.map(reg => (
          <div key={reg.id} className="px-4 py-3.5 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-gray-900 text-sm">{reg.full_name}</p>
              <span className="font-mono text-xs font-bold text-indigo-500 flex-shrink-0">
                #{String(reg.ticket_number).padStart(4, '0')}
              </span>
            </div>
            <p className="text-xs text-gray-500">{reg.email}</p>
            <div className="flex items-center justify-between pt-0.5">
              <p className="text-xs text-gray-400">
                {formatDate(reg.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              {showPayment && (
                reg.paid_confirmed
                  ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Confirmed
                    </span>
                  : <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ticket</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Registered</th>
              {showPayment && (
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {regs.map(reg => (
              <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-sm font-bold text-indigo-500">
                    #{String(reg.ticket_number).padStart(4, '0')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 text-sm">{reg.full_name}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-500">{reg.email}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                  {formatDate(reg.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                {showPayment && (
                  <td className="px-4 py-3">
                    {reg.paid_confirmed
                      ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Confirmed
                        </span>
                      : <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                    }
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
