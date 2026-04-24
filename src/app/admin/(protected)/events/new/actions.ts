'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'

interface AdminEventInput {
  adminId: string
  selectedProfile: {
    id: string
    name: string
    profileType: 'church' | 'seeded_org' | 'auth_org'
  }
  form: {
    title: string; description: string; category: string
    start_date: string; start_time: string; end_date: string; end_time: string
    is_online: boolean; online_platform: string; online_link: string
    location_name: string; address: string; city: string; state: string
    registration_type: 'free_no_registration' | 'free_registration' | 'paid'
    price: string; currency: string; payment_link: string
    capacity: string; tags: string[]
    banner_url: string
    visibility: 'public' | 'draft'
    speakers: string
    parking_available: boolean
    child_friendly: boolean
    notes: string
    source_url: string
  }
}

export async function createAdminEvent(input: AdminEventInput): Promise<{ error?: string; id?: string }> {
  const { adminId, selectedProfile, form } = input
  const adminClient = createAdminClient()

  try {
    const slug = slugify(form.title)

    const startDatetime = `${form.start_date}T${form.start_time}:00`

    const endDatetime = form.end_date
      ? `${form.end_date}T${form.end_time || '23:59'}:00`
      : null

    const church_id           = selectedProfile.profileType === 'church'     ? selectedProfile.id : null
    const seeded_organizer_id = selectedProfile.profileType === 'seeded_org' ? selectedProfile.id : null
    const organizer_id        = selectedProfile.profileType === 'auth_org'   ? selectedProfile.id : adminId

    const { data, error } = await adminClient.from('events').insert({
      organizer_id,
      church_id,
      seeded_organizer_id,
      title:             form.title.trim(),
      slug,
      description:       form.description.trim() || 'No description provided.',
      category:          form.category,
      status:            'approved',
      start_date:        startDatetime,
      end_date:          endDatetime,
      is_online:         form.is_online,
      online_platform:   form.online_platform || null,
      online_link:       form.online_link || null,
      location_name:     form.is_online ? (form.online_platform || 'Online') : (form.location_name.trim() || 'TBD'),
      address:           form.is_online ? null : (form.address.trim() || null),
      city:              form.is_online ? 'Online' : (form.city.trim() || 'Lagos'),
      state:             form.is_online ? 'Online' : form.state,
      country:           'Nigeria',
      registration_type: form.registration_type,
      is_free:           form.registration_type !== 'paid',
      price:             form.registration_type === 'paid' && form.price ? parseFloat(form.price) : null,
      currency:          form.currency || 'NGN',
      payment_link:      form.payment_link || null,
      rsvp_required:     form.registration_type === 'free_registration',
      capacity:          form.capacity ? parseInt(form.capacity) : null,
      tags:              form.tags,
      banner_url:        form.banner_url || null,
      gallery_urls:      [],
      visibility:        form.visibility,
      speakers:          form.speakers || null,
      parking_available: form.parking_available,
      child_friendly:    form.child_friendly,
      notes:             form.notes || null,
      created_by_admin:  true,
      source_url:        form.source_url || null,
    }).select('id').single()

    if (error) return { error: error.message }
    return { id: data.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
  }
}
