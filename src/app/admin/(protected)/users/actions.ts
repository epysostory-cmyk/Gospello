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

/** Suspend or reactivate a user */
export async function setUserStatusAction(userId: string, status: 'active' | 'suspended') {
  const admin = createAdminClient()
  await admin.from('profiles').update({ status }).eq('id', userId)
  revalidatePath('/admin/users')
  revalidatePath('/admin/organizations')
}

/** Hide or show a user from public listings */
export async function setUserHiddenAction(userId: string, hidden: boolean) {
  const admin = createAdminClient()
  await admin.from('profiles').update({ is_hidden: hidden }).eq('id', userId)
  revalidatePath('/admin/users')
  revalidatePath('/organizers')
  revalidatePath('/churches')
}
