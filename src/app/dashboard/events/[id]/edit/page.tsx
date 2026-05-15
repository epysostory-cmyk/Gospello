import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import EventFormStepper from '../../new/_components/EventFormStepper'
import type { Event } from '@/types/database'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Clock, XCircle } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

const STATUS_BANNER: Record<string, { icon: React.ElementType; bg: string; border: string; iconColor: string; title: string; desc: string }> = {
  approved: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
    title: 'This event is currently live',
    desc: 'Saving changes will take it offline and send it back for review. It will be hidden from Gospello until your team re-approves it.',
  },
  pending: {
    icon: Clock,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-500',
    title: 'This event is under review',
    desc: 'Saving changes will resubmit it. Your team will review the updated version.',
  },
  rejected: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    title: 'This event was rejected',
    desc: 'Fix the issues mentioned and save — it will be resubmitted for review automatically.',
  },
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) notFound()
  if (event.organizer_id !== user.id) notFound()

  const banner = STATUS_BANNER[event.status as string]
  const Icon = banner?.icon

  return (
    <div>
      <div className="px-4 pt-4 max-w-2xl mx-auto space-y-4">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Events
        </Link>

        {/* Status-aware banner */}
        {banner && Icon && (
          <div className={`rounded-xl border ${banner.bg} ${banner.border} px-4 py-3 flex items-start gap-3`}>
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${banner.iconColor}`} />
            <div>
              <p className="text-sm font-semibold text-gray-900">{banner.title}</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{banner.desc}</p>
              {/* Show rejection reason if there is one */}
              {event.status === 'rejected' && event.rejection_reason && (
                <div className="mt-2 bg-white border border-red-100 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-red-700 mb-0.5">Feedback from our team</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{event.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <EventFormStepper isEditMode={true} initialEvent={event as Partial<Event>} eventStatus={event.status as string} />
    </div>
  )
}
