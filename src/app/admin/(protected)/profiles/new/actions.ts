'use server'

import { createAdminClient } from '@/lib/supabase/admin'

interface CreateProfileInput {
  adminId: string
  accountType: 'church' | 'organizer'
  visible: boolean
  logoUrl?: string | null
  form: {
    name: string; slug: string; city: string; state: string; address: string
    phone: string; website: string; instagram: string; facebook: string
    description: string; source_url: string
    // church
    pastor_name: string; denomination: string; service_times: string[]
    // organizer
    contact_person: string; ministry_type: string
  }
}

export async function createAdminProfile(input: CreateProfileInput): Promise<{ error?: string; id?: string }> {
  const { adminId, accountType, visible, form, logoUrl } = input
  const adminClient = createAdminClient()

  // Generate unique slug
  const baseSlug = form.slug || form.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
  const uniqueSuffix = Math.random().toString(36).substring(2, 7)
  const slug = `${baseSlug}-${uniqueSuffix}`

  try {
    if (accountType === 'church') {
      const { data, error } = await adminClient.from('churches').insert({
        name:             form.name.trim(),
        slug,
        logo_url:         logoUrl || null,
        description:      form.description.trim() || null,
        address:          form.address.trim() || null,
        city:             form.city.trim(),
        state:            form.state,
        country:          'Nigeria',
        phone:            form.phone.trim() || null,
        website_url:      form.website.trim() || null,
        instagram:        form.instagram.trim() || null,
        facebook:         form.facebook.trim() || null,
        pastor_name:      form.pastor_name.trim() || null,
        denomination:     form.denomination.trim() || null,
        service_times:    form.service_times.length > 0 ? form.service_times.join('\n') : null,
        source:           'admin_seed',
        source_url:       form.source_url.trim() || null,
        owner_user_id:    null,
        is_claimed:       false,
        created_by_admin: true,
        is_hidden:        !visible,
        is_verified:      false,
        verified_badge:   false,
        // profile_id is nullable — requires migration_phase2 to have been run
      }).select('id').single()

      if (error) return { error: error.message }
      return { id: data.id }
    } else {
      const { data, error } = await adminClient.from('seeded_organizers').insert({
        name:            form.name.trim(),
        slug,
        logo_url:        logoUrl || null,
        description:     form.description.trim() || null,
        contact_person:  form.contact_person.trim() || null,
        ministry_type:   form.ministry_type.trim() || null,
        city:            form.city.trim(),
        state:           form.state,
        address:         form.address.trim() || null,
        phone:           form.phone.trim() || null,
        website:         form.website.trim() || null,
        instagram:       form.instagram.trim() || null,
        facebook:        form.facebook.trim() || null,
        source:          'admin_seed',
        source_url:      form.source_url.trim() || null,
        owner_user_id:   null,
        is_claimed:      false,
        created_by_admin: true,
        is_hidden:       !visible,
        is_verified:     false,
        verified_badge:  false,
      }).select('id').single()

      if (error) return { error: error.message }
      return { id: data.id }
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
  }
}
