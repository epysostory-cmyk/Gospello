'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/** Permanently delete a user + all their data (auth cascade) */
export async function deleteProfileAction(profileId: string) {
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(profileId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/organizations')
  revalidatePath('/admin/users')
  revalidatePath('/organizers')
  revalidatePath('/churches')
}

/** Suspend or reactivate a profile */
export async function setProfileStatusAction(profileId: string, status: 'active' | 'suspended') {
  const admin = createAdminClient()
  await admin.from('profiles').update({ status }).eq('id', profileId)
  revalidatePath('/admin/organizations')
  revalidatePath('/admin/users')
}

/** Hide or show a profile from the public organizers listing */
export async function setProfileHiddenAction(profileId: string, hidden: boolean) {
  const admin = createAdminClient()
  await admin.from('profiles').update({ is_hidden: hidden }).eq('id', profileId)
  revalidatePath('/admin/organizations')
  revalidatePath('/organizers')
}

/** Delete only the church record (keeps the user account) */
export async function deleteChurchAction(churchId: string) {
  const admin = createAdminClient()
  await admin.from('churches').delete().eq('id', churchId)
  revalidatePath('/admin/organizations')
  revalidatePath('/churches')
}

/** Hide or show a church from the public churches listing */
export async function setChurchHiddenAction(churchId: string, hidden: boolean) {
  const admin = createAdminClient()
  await admin.from('churches').update({ is_hidden: hidden }).eq('id', churchId)
  revalidatePath('/admin/organizations')
  revalidatePath('/churches')
}
