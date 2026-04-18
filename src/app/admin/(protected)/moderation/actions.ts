'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function moderateEvent(eventId: string, status: 'approved' | 'rejected') {
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('events').update({ status }).eq('id', eventId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/moderation')
  revalidatePath('/admin')
}

export async function bulkModerateEvents(ids: string[], status: 'approved' | 'rejected') {
  if (!ids.length) return
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('events').update({ status }).in('id', ids)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/moderation')
  revalidatePath('/admin')
}
