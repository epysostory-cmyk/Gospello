'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendEmail, emailSuspended, emailRestored } from '@/lib/email'

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
export async function setUserStatusAction(
  userId: string,
  status: 'active' | 'suspended',
  suspensionReason = 'Your account was found to be in violation of our community guidelines.'
) {
  const admin = createAdminClient()
  const hidden = status === 'suspended'

  // Fetch profile before update so we have name + email for the notification
  const { data: profile } = await admin
    .from('profiles')
    .select('display_name, email')
    .eq('id', userId)
    .single()

  await admin
    .from('profiles')
    .update({ status, is_hidden: hidden })
    .eq('id', userId)

  // Cascade to church record if this user owns one
  await admin
    .from('churches')
    .update({ is_hidden: hidden })
    .eq('profile_id', userId)

  // Send notification email (best-effort, non-blocking)
  if (profile?.email) {
    const name = profile.display_name ?? 'there'
    const { subject, html } = status === 'suspended'
      ? emailSuspended(name, suspensionReason)
      : emailRestored(name)
    void sendEmail({ to: profile.email, subject, html })
  }

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
