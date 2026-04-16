'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/** Permanently delete a user + all their data */
export async function deleteUserAction(userId: string) {
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
  revalidatePath('/admin/organizations')
  revalidatePath('/organizers')
  revalidatePath('/churches')
}

/**
 * Suspend → also hides the profile AND their church from public.
 * Reactivate → also un-hides both.
 */
export async function setUserStatusAction(userId: string, status: 'active' | 'suspended') {
  const admin = createAdminClient()
  const hidden = status === 'suspended'

  await admin
    .from('profiles')
    .update({ status, is_hidden: hidden })
    .eq('id', userId)

  // Cascade to church record if this user owns one
  await admin
    .from('churches')
    .update({ is_hidden: hidden })
    .eq('profile_id', userId)

  revalidatePath('/admin/users')
  revalidatePath('/admin/organizations')
  revalidatePath('/organizers')
  revalidatePath('/churches')
}

/** Hide or show a user from public listings */
export async function setUserHiddenAction(userId: string, hidden: boolean) {
  const admin = createAdminClient()
  await admin.from('profiles').update({ is_hidden: hidden }).eq('id', userId)
  revalidatePath('/admin/users')
  revalidatePath('/organizers')
  revalidatePath('/churches')
}
