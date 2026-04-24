'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveClaim(claimId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  // Fetch claim details
  const { data: claim, error: claimErr } = await adminClient
    .from('claim_requests')
    .select('*')
    .eq('id', claimId)
    .single()

  if (claimErr || !claim) return { error: 'Claim not found' }
  if (claim.status !== 'pending') return { error: 'Claim is no longer pending' }

  // Update claim status
  const { error: updateErr } = await adminClient
    .from('claim_requests')
    .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', claimId)

  if (updateErr) return { error: updateErr.message }

  // Update the profile table
  if (claim.profile_type === 'church') {
    await adminClient.from('churches').update({
      is_claimed: true,
      owner_user_id: claim.claimant_id,
      claim_verified_at: new Date().toISOString(),
    }).eq('id', claim.profile_id)
  } else {
    await adminClient.from('seeded_organizers').update({
      is_claimed: true,
      owner_user_id: claim.claimant_id,
      claim_verified_at: new Date().toISOString(),
    }).eq('id', claim.profile_id)
  }

  revalidatePath('/admin/claims')
  return {}
}

export async function rejectClaim(claimId: string, reason: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { data: claim, error: claimErr } = await adminClient
    .from('claim_requests')
    .select('profile_type, profile_id, status')
    .eq('id', claimId)
    .single()

  if (claimErr || !claim) return { error: 'Claim not found' }
  if (claim.status !== 'pending') return { error: 'Claim is no longer pending' }

  const { error: updateErr } = await adminClient
    .from('claim_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || null,
    })
    .eq('id', claimId)

  if (updateErr) return { error: updateErr.message }

  // Clear the pending claim state on the profile
  if (claim.profile_type === 'church') {
    await adminClient.from('churches').update({
      claim_requested_at: null,
      claim_requested_by: null,
    }).eq('id', claim.profile_id)
  } else {
    await adminClient.from('seeded_organizers').update({
      claim_requested_at: null,
      claim_requested_by: null,
    }).eq('id', claim.profile_id)
  }

  revalidatePath('/admin/claims')
  return {}
}
