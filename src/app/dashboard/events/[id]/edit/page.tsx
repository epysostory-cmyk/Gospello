'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import EventFormStepper from '../../new/_components/EventFormStepper'
import type { Event } from '@/types/database'
import BackButton from '@/components/ui/BackButton'

export default function EditEventPage() {
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Create client inside effect to avoid it as a stale dependency
    const supabase = createClient()
    const loadEvent = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .single()

      if (data) {
        setEvent(data as Event)
      }
      setLoading(false)
    }

    loadEvent()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Event not found</p>
      </div>
    )
  }

  return (
    <>
      <BackButton />
      <EventFormStepper isEditMode={true} initialEvent={event} />
    </>
  )
}
