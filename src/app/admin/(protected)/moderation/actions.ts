'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function moderateEvent(eventId: string, status: 'approved' | 'rejected') {
  const adminClient = createAdminClient()
  await adminClient.from('events').update({ status }).eq('id', eventId)
  revalidatePath('/admin/moderation')
  revalidatePath('/admin')
}
