export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, CheckCircle2, Clock, Ticket } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ExportCSVButton from './_components/ExportCSVButton'

interface Props {
  params: Promise<{ id: string }>
}

const TYPE_LABELS: Record<string, string> = {
  free_no_registration: 'Free (No Reg.)',
  free_registration: 'Free (Registered)',
  paid: 'Paid',
}

export default async function EventRegistrationsPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  // Verify the event belongs to this organizer
  const { data: event } = await admin
    .from('events')
    .select('id, title, slug, organizer_id, start_date, city, state')
    .eq('id', id)
    .single()

  if (!event) notFound()
  if (event.organizer_id !== user.id) notFound()

  // Fetch all registrations
  const { data: registrations } = await admin
    .from('registrations')
    .select('*')
    .eq('event_id', id)
    .order('ticket_number', { ascending: true })

  const regs = registrations ?? []
  const totalCount = regs.length
  const paidConfirmedCount = regs.filter(r => r.paid_confirmed).length
  const freeCount = regs.filter(r => r.registration_type === 'free_registration').length
  const paidCount = regs.filter(r => r.registration_type === 'paid').length

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Events
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              {event.city ? ` · ${event.city}` : ''}
            </p>
          </div>
          {regs.length > 0 && (
            <ExportCSVButton registrations={regs} eventSlug={event.slug ?? id} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
          <div className="text-xs text-gray-500 mt-1">Total Registrations</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{freeCount}</div>
          <div className="text-xs text-gray-500 mt-1">Free</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{paidCount}</div>
          <div className="text-xs text-gray-500 mt-1">Paid</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{paidConfirmedCount}</div>
          <div className="text-xs text-gray-500 mt-1">Payment Confirmed</div>
        </div>
      </div>

      {/* Registrations table */}
      {regs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No registrations yet</h3>
          <p className="text-gray-500">Registrations will appear here once attendees sign up.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {regs.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Ticket number */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span className="font-mono text-sm font-semibold text-indigo-600">
                          #{String(reg.ticket_number).padStart(4, '0')}
                        </span>
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{reg.full_name}</p>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{reg.email}</p>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        reg.registration_type === 'paid'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {TYPE_LABELS[reg.registration_type] ?? reg.registration_type}
                      </span>
                    </td>

                    {/* Registered date */}
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(reg.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Payment status */}
                    <td className="px-4 py-3">
                      {reg.registration_type === 'paid' ? (
                        reg.paid_confirmed ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full w-fit">
                            <Clock className="w-3 h-3" />
                            Awaiting Payment
                          </span>
                        )
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          Registered
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
