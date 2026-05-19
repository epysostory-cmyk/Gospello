'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function uploadAdminLogo(formData: FormData): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }
  if (file.size > 3 * 1024 * 1024) return { error: 'Logo must be under 3 MB' }

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) return { error: 'Only JPEG, PNG, GIF, or WebP allowed' }

  const admin = createAdminClient()
  const bucket = 'avatars'

  // Ensure bucket exists and is public
  const { data: existing } = await admin.storage.getBucket(bucket)
  if (!existing) {
    await admin.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `seeded-profiles/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadErr } = await admin.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadErr) return { error: uploadErr.message }

  const { data: { publicUrl } } = admin.storage.from(bucket).getPublicUrl(path)
  return { url: publicUrl }
}

interface UpdateChurchInput {
  id: string
  logoUrl?: string | null
  form: {
    name: string; city: string; state: string; country: string; address: string
    phone: string; website: string; instagram: string; facebook: string
    description: string; source_url: string
    pastor_name: string; leader_title: string; founder: string
    denomination: string; service_times: { day: string; name: string; time: string }[]
    is_hidden: boolean
  }
}

interface UpdateOrganizerInput {
  id: string
  logoUrl?: string | null
  form: {
    name: string; city: string; state: string; country: string; address: string
    phone: string; whatsapp: string; website: string; instagram: string
    facebook: string; twitter: string; youtube: string
    description: string; source_url: string
    contact_person: string; ministry_type: string
    is_hidden: boolean
  }
}

export async function updateAdminChurch(input: UpdateChurchInput): Promise<{ error?: string }> {
  const { id, form, logoUrl } = input
  const adminClient = createAdminClient()

  try {
    const { error } = await adminClient.from('churches').update({
      name:          form.name.trim(),
      logo_url:      logoUrl !== undefined ? logoUrl : undefined,
      description:   form.description.trim() || null,
      address:       form.address.trim() || null,
      city:          form.city.trim(),
      state:         form.state,
      country:       form.country || 'Nigeria',
      phone:         form.phone.trim() || null,
      website_url:   form.website.trim() || null,
      instagram:     form.instagram.trim() || null,
      facebook:      form.facebook.trim() || null,
      pastor_name:   form.pastor_name.trim() || null,
      leader_title:  form.leader_title.trim() || null,
      founder:       form.founder.trim() || null,
      denomination:  form.denomination.trim() || null,
      service_times: form.service_times.length > 0 ? JSON.stringify(form.service_times) : null,
      source_url:    form.source_url.trim() || null,
      is_hidden:     form.is_hidden,
    }).eq('id', id)

    if (error) return { error: error.message }
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
  }
}

export async function updateAdminOrganizer(input: UpdateOrganizerInput): Promise<{ error?: string }> {
  const { id, form, logoUrl } = input
  const adminClient = createAdminClient()

  try {
    const { error } = await adminClient.from('seeded_organizers').update({
      name:           form.name.trim(),
      logo_url:       logoUrl !== undefined ? logoUrl : undefined,
      description:    form.description.trim() || null,
      contact_person: form.contact_person.trim() || null,
      ministry_type:  form.ministry_type.trim() || null,
      city:           form.city.trim(),
      state:          form.state,
      country:        form.country || 'Nigeria',
      address:        form.address.trim() || null,
      phone:          form.phone.trim() || null,
      whatsapp:       form.whatsapp.trim() || null,
      website:        form.website.trim() || null,
      instagram:      form.instagram.trim() || null,
      facebook:       form.facebook.trim() || null,
      twitter:        form.twitter.trim() || null,
      youtube:        form.youtube.trim() || null,
      source_url:     form.source_url.trim() || null,
      is_hidden:      form.is_hidden,
    }).eq('id', id)

    if (error) return { error: error.message }
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
  }
}
