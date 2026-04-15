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
