'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function setFeatured(eventId: string, featured: boolean) {
  const adminClient = createAdminClient()
  await adminClient.from('events').update({ is_featured: featured }).eq('id', eventId)
  revalidatePath('/admin/featured')
}

export async function toggleFeatured(
  id: string,
  table: 'events' | 'churches',
  newVal: boolean,
  durationDays?: number | null
) {
  const adminClient = createAdminClient()

  const updateData: Record<string, unknown> = { is_featured: newVal }

  if (table === 'events') {
    if (newVal && durationDays && durationDays > 0) {
      const until = new Date()
      until.setDate(until.getDate() + durationDays)
      updateData.featured_until = until.toISOString()
    } else if (!newVal) {
      updateData.featured_until = null
    }
  }

  const { error } = await adminClient
    .from(table)
    .update(updateData)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin/featured')
}
