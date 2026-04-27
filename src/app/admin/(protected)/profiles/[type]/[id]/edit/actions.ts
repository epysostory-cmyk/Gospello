'use server'

import { createAdminClient } from '@/lib/supabase/admin'

interface UpdateChurchInput {
  id: string
  logoUrl?: string | null
  form: {
    name: string; city: string; state: string; address: string
    phone: string; website: string; instagram: string; facebook: string
    description: string; source_url: string
    pastor_name: string; denomination: string; service_times: string[]
    is_hidden: boolean
  }
}

interface UpdateOrganizerInput {
  id: string
  logoUrl?: string | null
  form: {
    name: string; city: string; state: string; address: string
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
      phone:         form.phone.trim() || null,
      website_url:   form.website.trim() || null,
      instagram:     form.instagram.trim() || null,
      facebook:      form.facebook.trim() || null,
      pastor_name:   form.pastor_name.trim() || null,
      denomination:  form.denomination.trim() || null,
      service_times: form.service_times.filter(Boolean).length > 0 ? form.service_times.filter(Boolean).join('\n') : null,
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
