'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, emailApproved, emailRejected } from '@/lib/email'
import { revalidatePath } from 'next/cache'

export async function approveEvent(eventId: string) {
  const supabase = createAdminClient()

  const { data: event } = await supabase
    .from('events')
    .select('title, slug, profiles(email)')
    .eq('id', eventId)
    .single()

  await supabase
    .from('events')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', eventId)

  if (event?.profiles) {
    const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
    const { subject, html } = emailApproved(event.title, event.slug)
    await sendEmail({ to: (profile as { email: string }).email, subject, html })
  }

  revalidatePath('/admin/events')
}

export async function rejectEvent(eventId: string, reason: string) {
  const supabase = createAdminClient()

  const { data: event } = await supabase
    .from('events')
    .select('title, profiles(email)')
    .eq('id', eventId)
    .single()

  await supabase
    .from('events')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', eventId)

  if (event?.profiles) {
    const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
    const { subject, html } = emailRejected(event.title, reason)
    await sendEmail({ to: (profile as { email: string }).email, subject, html })
  }

  revalidatePath('/admin/events')
}

export async function hideEvent(eventId: string) {
  const supabase = createAdminClient()
  await supabase.from('events').update({ status: 'hidden' }).eq('id', eventId)
  revalidatePath('/admin/events')
}

export async function unhideEvent(eventId: string) {
  await approveEvent(eventId)
}

export async function deleteEvent(eventId: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  // Remove related records first to avoid FK constraint failures
  await supabase.from('attendances').delete().eq('event_id', eventId)
  await supabase.from('saved_events').delete().eq('event_id', eventId)

  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) return { error: error.message }

  revalidatePath('/admin/events')
  revalidatePath('/churches')
  revalidatePath('/events')
  return {}
}
