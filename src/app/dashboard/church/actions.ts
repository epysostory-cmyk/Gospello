'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function saveChurchProfile(formData: {
  name: string
  description: string
  address: string
  city: string
  state: string
  country: string
  service_times: string
  website_url: string
  phone: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  const { error } = await admin
    .from('churches')
    .update({
      name: formData.name,
      description: formData.description || null,
      address: formData.address || null,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      service_times: formData.service_times || null,
      website_url: formData.website_url || null,
      phone: formData.phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('profile_id', user.id)

  if (error) return { error: error.message }

  await admin
    .from('profiles')
    .update({ display_name: formData.name })
    .eq('id', user.id)

  revalidatePath('/dashboard/church')
  return { error: null }
}

export async function uploadChurchImage(
  formData: FormData,
  type: 'logo' | 'banner'
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { url: null, error: 'Not authenticated' }

  const file = formData.get('file') as File
  if (!file) return { url: null, error: 'No file provided' }

  const admin = createAdminClient()
  const ext = file.name.split('.').pop()
  const path = `${user.id}/${type}.${ext}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error } = await admin.storage
    .from('church-assets')
    .upload(path, buffer, { upsert: true, contentType: file.type })

  if (error) return { url: null, error: error.message }

  const { data: { publicUrl } } = admin.storage.from('church-assets').getPublicUrl(path)

  // Update the church record with the new image url
  await admin
    .from('churches')
    .update({ [`${type}_url`]: publicUrl, updated_at: new Date().toISOString() })
    .eq('profile_id', user.id)

  revalidatePath('/dashboard/church')
  return { url: publicUrl, error: null }
}
