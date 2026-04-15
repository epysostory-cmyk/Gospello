'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function setOrgStatus(profileId: string, status: 'active' | 'suspended') {
  const adminClient = createAdminClient()
  await adminClient.from('profiles').update({ status }).eq('id', profileId)
  revalidatePath('/admin/organizations')
}
