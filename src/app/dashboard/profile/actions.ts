'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface UpdateProfileInput {
  display_name: string
  avatar_url: string | null
  bio?: string
  state?: string
  city?: string
  address?: string
  phone?: string
  whatsapp?: string
  website?: string
  instagram?: string
  facebook?: string
  twitter?: string
  youtube?: string
  contact_person?: string
  ministry_types?: string[]
}

export async function updateProfile(input: UpdateProfileInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const payload: Record<string, unknown> = {
    display_name: input.display_name.trim(),
    avatar_url:   input.avatar_url,
    updated_at:   new Date().toISOString(),
  }

  if (input.bio !== undefined)            payload.bio            = input.bio.trim() || null
  if (input.state !== undefined)          payload.state          = input.state || null
  if (input.city !== undefined)           payload.city           = input.city.trim() || null
  if (input.address !== undefined)        payload.address        = input.address.trim() || null
  if (input.phone !== undefined)          payload.phone          = input.phone.trim() || null
  if (input.whatsapp !== undefined)       payload.whatsapp       = input.whatsapp.trim() || null
  if (input.website !== undefined)        payload.website        = input.website.trim() || null
  if (input.instagram !== undefined)      payload.instagram      = input.instagram.trim() || null
  if (input.facebook !== undefined)       payload.facebook       = input.facebook.trim() || null
  if (input.twitter !== undefined)        payload.twitter        = input.twitter.trim() || null
  if (input.youtube !== undefined)        payload.youtube        = input.youtube.trim() || null
  if (input.contact_person !== undefined) payload.contact_person = input.contact_person.trim() || null
  if (input.ministry_types !== undefined) payload.ministry_types = input.ministry_types.length > 0 ? input.ministry_types : null

  const { error } = await adminClient.from('profiles').update(payload).eq('id', user.id)
  if (error) return { error: error.message }
  return {}
}
