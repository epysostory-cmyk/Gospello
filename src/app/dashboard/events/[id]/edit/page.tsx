import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import EventFormStepper from '../../new/_components/EventFormStepper'
import type { Event } from '@/types/database'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
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

  // Only the organizer can edit their own event
  if (event.organizer_id !== user.id) notFound()

  return (
    <div>
      <div className="px-4 pt-4 max-w-2xl mx-auto">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Events
        </Link>
      </div>
      <EventFormStepper isEditMode={true} initialEvent={event as Partial<Event>} />
    </div>
  )
}
