'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function toggleProfileHidden(id: string, type: 'church' | 'organizer', currentHidden: boolean) {
  const admin = createAdminClient()
  const table = type === 'church' ? 'churches' : 'seeded_organizers'

  const { error } = await admin.from(table).update({ is_hidden: !currentHidden }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/seededchurches')
  return { hidden: !currentHidden }
}

export async function deleteProfile(id: string, type: 'church' | 'organizer') {
  const admin = createAdminClient()

  // Block delete if this profile has any events linked to it
  const { count } = type === 'church'
    ? await admin.from('events').select('id', { count: 'exact', head: true }).eq('church_id', id)
    : await admin.from('events').select('id', { count: 'exact', head: true }).eq('seeded_organizer_id', id)

  if (count && count > 0) {
    return {
      error: `Cannot delete — this profile has ${count} event${count !== 1 ? 's' : ''} linked to it. Delete or reassign those events first.`,
    }
  }

  const table = type === 'church' ? 'churches' : 'seeded_organizers'
  const { error } = await admin.from(table).delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/seededchurches')
  return { success: true }
}
