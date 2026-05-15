'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, emailApproved, emailRejected } from '@/lib/email'
import { revalidatePath } from 'next/cache'

export async function moderateEvent(
  eventId: string,
  status: 'approved' | 'rejected',
  reason?: string,
) {
  const adminClient = createAdminClient()

  // Fetch event + organizer email in one query
  const { data: event } = await adminClient
    .from('events')
    .select('title, slug, profiles(email, display_name)')
    .eq('id', eventId)
    .single()

  // Update status
  const update: Record<string, unknown> = { status }
  if (status === 'approved') {
    update.approved_at = new Date().toISOString()
    update.rejection_reason = null
  } else if (reason) {
    update.rejection_reason = reason
  }

  const { error } = await adminClient.from('events').update(update).eq('id', eventId)
  if (error) throw new Error(error.message)

  // Send email — best-effort, don't block the action if it fails
  if (event) {
    const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
    const to = (profile as { email?: string } | null)?.email
    if (to) {
      const organizerName = (profile as { display_name?: string } | null)?.display_name ?? undefined
      if (status === 'approved') {
        const { subject, html } = emailApproved(event.title, event.slug, organizerName)
        void sendEmail({ to, subject, html })
      } else {
        const { subject, html } = emailRejected(event.title, reason ?? 'Your event did not meet our publishing guidelines.', eventId)
        void sendEmail({ to, subject, html })
      }
    }
  }

  revalidatePath('/admin/moderation')
  revalidatePath('/admin')
}

export async function bulkModerateEvents(ids: string[], status: 'approved' | 'rejected') {
  if (!ids.length) return
  const adminClient = createAdminClient()

  // Fetch all events + organizer emails
  const { data: events } = await adminClient
    .from('events')
    .select('id, title, slug, profiles(email, display_name)')
    .in('id', ids)

  const update: Record<string, unknown> = { status }
  if (status === 'approved') update.approved_at = new Date().toISOString()

  const { error } = await adminClient.from('events').update(update).in('id', ids)
  if (error) throw new Error(error.message)

  // Send emails — best-effort
  if (events) {
    for (const event of events) {
      const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
      const to = (profile as { email?: string } | null)?.email
      if (!to) continue
      const organizerName = (profile as { display_name?: string } | null)?.display_name ?? undefined
      if (status === 'approved') {
        const { subject, html } = emailApproved(event.title, event.slug, organizerName)
        void sendEmail({ to, subject, html })
      }
      // Bulk reject doesn't have a per-event reason — skip email for now
    }
  }

  revalidatePath('/admin/moderation')
  revalidatePath('/admin')
}
