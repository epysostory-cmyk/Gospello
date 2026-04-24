'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

interface SubmitClaimInput {
  profileId: string
  profileType: 'church' | 'organizer'
  claimant_name: string
  claimant_role: string
  claimant_phone: string
  verification_notes: string
}

export async function submitClaim(input: SubmitClaimInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to claim a profile' }

  const adminClient = createAdminClient()

  // Check for existing pending/approved claim
  const { data: existing } = await adminClient
    .from('claim_requests')
    .select('id, status')
    .eq('profile_id', input.profileId)
    .eq('profile_type', input.profileType)
    .in('status', ['pending', 'approved'])
    .single()

  if (existing?.status === 'approved') return { error: 'This profile has already been claimed' }
  if (existing?.status === 'pending') return { error: 'A claim is already pending for this profile' }

  // Fetch profile name
  let profileName = ''
  if (input.profileType === 'church') {
    const { data } = await adminClient.from('churches').select('name').eq('id', input.profileId).single()
    profileName = data?.name ?? ''
  } else {
    const { data } = await adminClient.from('seeded_organizers').select('name').eq('id', input.profileId).single()
    profileName = data?.name ?? ''
  }

  // Fetch claimant email
  const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single()

  const { error } = await adminClient.from('claim_requests').insert({
    profile_type: input.profileType,
    profile_id: input.profileId,
    profile_name: profileName,
    claimant_id: user.id,
    claimant_name: input.claimant_name,
    claimant_email: profile?.email ?? user.email ?? '',
    claimant_role: input.claimant_role,
    claimant_phone: input.claimant_phone,
    verification_notes: input.verification_notes,
    status: 'pending',
  })

  if (error) return { error: error.message }

  // Mark claim as pending on the profile
  const now = new Date().toISOString()
  if (input.profileType === 'church') {
    await adminClient.from('churches').update({ claim_requested_at: now, claim_requested_by: user.id }).eq('id', input.profileId)
  } else {
    await adminClient.from('seeded_organizers').update({ claim_requested_at: now, claim_requested_by: user.id }).eq('id', input.profileId)
  }

  return {}
}
