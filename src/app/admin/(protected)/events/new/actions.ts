'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'
import { geocodeEvent } from '@/lib/geocode'
import type { DaySchedule, RecurrenceRule } from '@/types/database'
import { generateOccurrenceDates } from '@/lib/recurrence'

export async function uploadAdminBanner(formData: FormData): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Banner must be under 5 MB' }

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) return { error: 'Only JPEG, PNG, GIF, or WebP allowed' }

  const admin = createAdminClient()
  const bucket = 'event-banners'

  // Ensure bucket exists and is public
  const { data: existing } = await admin.storage.getBucket(bucket)
  if (!existing) {
    await admin.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `event-banners/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadErr } = await admin.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadErr) return { error: uploadErr.message }

  const { data: { publicUrl } } = admin.storage.from(bucket).getPublicUrl(path)
  return { url: publicUrl }
}

interface AdminEventInput {
  adminId: string
  selectedProfile: {
    id: string
    name: string
    profileType: 'church' | 'seeded_org' | 'auth_org'
  }
  startDatetime: string
  endDatetime: string | null
  recurrenceRule?: RecurrenceRule
  form: {
    title: string; description: string; category: string
    is_online: boolean; online_platform: string; online_link: string
    location_name: string; address: string; city: string; state: string; country: string
    registration_type: 'free_no_registration' | 'free_registration' | 'paid'
    price: string; currency: string; payment_link: string
    capacity: string; tags: string[]
    banner_url: string
    visibility: 'public' | 'draft'
    speakers: string
    parking_available: boolean
    child_friendly: boolean
    notes: string
    shuttle_available: boolean
    wheelchair_accessible: boolean
    food_provided: boolean
    accommodation_available: boolean
    dress_code: string
    no_recording: boolean
    gender_restriction: string
    source_url: string
    daily_schedule: DaySchedule[] | null
    timezone: string
    livestream_url: string
    time_tba?: boolean
  }
}

export async function createAdminEvent(input: AdminEventInput): Promise<{ error?: string; id?: string }> {
  const { adminId, selectedProfile, form, startDatetime, endDatetime, recurrenceRule } = input
  const adminClient = createAdminClient()

  try {
    const slug = slugify(form.title)

    const church_id           = selectedProfile.profileType === 'church'     ? selectedProfile.id : null
    const seeded_organizer_id = selectedProfile.profileType === 'seeded_org' ? selectedProfile.id : null
    // Seed-profile events (church / seeded_org) have no auth-user organizer — leave null.
    // Only real auth organizer profiles get organizer_id set.
    const organizer_id        = selectedProfile.profileType === 'auth_org'   ? selectedProfile.id : null

    const coords = form.is_online ? null : await geocodeEvent({
      address: form.address, city: form.city, state: form.state, country: form.country,
    })

    // Create series first so every event insert (including the first) already has event_series_id set
    let seriesId: string | null = null
    if (recurrenceRule) {
      const seriesSlug = slugify(form.title + '-series')
      const { data: series, error: seriesErr } = await adminClient
        .from('event_series')
        .insert([{
          title: form.title.trim(),
          slug: seriesSlug,
          recurrence_rule: recurrenceRule,
          organizer_id: organizer_id,
          church_id,
          seeded_organizer_id,
        }])
        .select('id')
        .single()
      if (seriesErr) return { error: seriesErr.message }
      seriesId = series.id
    }

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
      daily_schedule:    form.daily_schedule ?? null,
      is_online:         form.is_online,
      online_platform:   form.online_platform || null,
      online_link:       form.online_link || null,
      location_name:     form.is_online ? (form.online_platform || 'Online') : (form.location_name.trim() || ''),
      address:           form.is_online ? null : (form.address.trim() || null),
      city:              form.is_online ? 'Online' : (form.city.trim() || ''),
      state:             form.is_online ? 'Online' : form.state,
      country:           form.is_online ? 'Online' : (form.country || 'Nigeria'),
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
      speakers:               form.speakers || null,
      parking_available:      form.parking_available,
      child_friendly:         form.child_friendly,
      notes:                  form.notes || null,
      shuttle_available:      form.shuttle_available,
      wheelchair_accessible:  form.wheelchair_accessible,
      food_provided:          form.food_provided,
      accommodation_available: form.accommodation_available,
      dress_code:             form.dress_code || null,
      no_recording:           form.no_recording,
      gender_restriction:     form.gender_restriction || null,
      created_by_admin:       true,
      source_url:        form.source_url || null,
      timezone:          form.timezone || 'Africa/Lagos',
      livestream_url:    form.livestream_url || null,
      latitude:          coords?.latitude ?? null,
      longitude:         coords?.longitude ?? null,
      time_tba:          form.time_tba ?? false,
      event_series_id:   seriesId,
    }).select('id').single()

    if (error) return { error: error.message }

    if (seriesId && data) {
      // Generate and insert remaining occurrences
      const baseDate   = new Date(startDatetime)
      const durationMs = endDatetime
        ? new Date(endDatetime).getTime() - baseDate.getTime()
        : 2 * 60 * 60 * 1000
      const allDates = generateOccurrenceDates(recurrenceRule!, baseDate)

      if (allDates.length > 1) {
        const baseEventData = {
          organizer_id, church_id, seeded_organizer_id,
          description: form.description.trim() || 'No description provided.',
          category: form.category,
          status: 'approved' as const,
          is_online: form.is_online,
          online_platform: form.online_platform || null,
          online_link: form.online_link || null,
          location_name: form.is_online ? (form.online_platform || 'Online') : (form.location_name.trim() || ''),
          address: form.is_online ? null : (form.address.trim() || null),
          city: form.is_online ? 'Online' : (form.city.trim() || ''),
          state: form.is_online ? 'Online' : form.state,
          country: form.is_online ? 'Online' : (form.country || 'Nigeria'),
          registration_type: form.registration_type,
          is_free: form.registration_type !== 'paid',
          price: form.registration_type === 'paid' && form.price ? parseFloat(form.price) : null,
          currency: form.currency || 'NGN',
          payment_link: form.payment_link || null,
          rsvp_required: form.registration_type === 'free_registration',
          capacity: form.capacity ? parseInt(form.capacity) : null,
          tags: form.tags,
          banner_url: form.banner_url || null,
          gallery_urls: [],
          visibility: form.visibility,
          speakers: form.speakers || null,
          parking_available: form.parking_available,
          child_friendly: form.child_friendly,
          notes: form.notes || null,
          shuttle_available: form.shuttle_available,
          wheelchair_accessible: form.wheelchair_accessible,
          food_provided: form.food_provided,
          accommodation_available: form.accommodation_available,
          dress_code: form.dress_code || null,
          no_recording: form.no_recording,
          gender_restriction: form.gender_restriction || null,
          created_by_admin: true,
          source_url: form.source_url || null,
          timezone: form.timezone || 'Africa/Lagos',
          livestream_url: form.livestream_url || null,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
          time_tba: form.time_tba ?? false,
          event_series_id: seriesId,
        }

        const childEvents = allDates.slice(1).map((occDate, idx) => ({
          ...baseEventData,
          title: form.title.trim(),
          slug: slugify(form.title + `-${idx + 2}`),
          start_date: occDate.toISOString(),
          end_date: endDatetime ? new Date(occDate.getTime() + durationMs).toISOString() : null,
        }))

        const { error: childErr } = await adminClient.from('events').insert(childEvents)
        if (childErr) return { error: childErr.message }
      }
    }

    return { id: data.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
  }
}

/* ── Update an existing event (admin, keeps current status) ─── */
interface AdminEventUpdateInput {
  eventId: string
  startDatetime: string
  endDatetime: string | null
  form: AdminEventInput['form']
}

export async function updateAdminEvent(input: AdminEventUpdateInput): Promise<{ error?: string }> {
  const { eventId, form, startDatetime, endDatetime } = input
  const adminClient = createAdminClient()

  try {
    const coords = form.is_online ? null : await geocodeEvent({
      address: form.address, city: form.city, state: form.state, country: form.country,
    })

    const { error } = await adminClient.from('events').update({
      title:             form.title.trim(),
      description:       form.description.trim() || 'No description provided.',
      category:          form.category,
      start_date:        startDatetime,
      end_date:          endDatetime,
      daily_schedule:    form.daily_schedule ?? null,
      is_online:         form.is_online,
      online_platform:   form.online_platform || null,
      online_link:       form.online_link || null,
      location_name:     form.is_online ? (form.online_platform || 'Online') : (form.location_name.trim() || ''),
      address:           form.is_online ? null : (form.address.trim() || null),
      city:              form.is_online ? 'Online' : (form.city.trim() || ''),
      state:             form.is_online ? 'Online' : form.state,
      country:           form.is_online ? 'Online' : (form.country || 'Nigeria'),
      registration_type: form.registration_type,
      is_free:           form.registration_type !== 'paid',
      price:             form.registration_type === 'paid' && form.price ? parseFloat(form.price) : null,
      currency:          form.currency || 'NGN',
      payment_link:      form.payment_link || null,
      rsvp_required:     form.registration_type === 'free_registration',
      capacity:          form.capacity ? parseInt(form.capacity) : null,
      tags:              form.tags,
      banner_url:        form.banner_url || null,
      visibility:        form.visibility,
      speakers:               form.speakers || null,
      parking_available:      form.parking_available,
      child_friendly:         form.child_friendly,
      notes:                  form.notes || null,
      shuttle_available:      form.shuttle_available,
      wheelchair_accessible:  form.wheelchair_accessible,
      food_provided:          form.food_provided,
      accommodation_available: form.accommodation_available,
      dress_code:             form.dress_code || null,
      no_recording:           form.no_recording,
      gender_restriction:     form.gender_restriction || null,
      source_url:             form.source_url || null,
      timezone:          form.timezone || 'Africa/Lagos',
      livestream_url:    form.livestream_url || null,
      latitude:          coords?.latitude ?? null,
      longitude:         coords?.longitude ?? null,
      time_tba:          form.time_tba ?? false,
    }).eq('id', eventId)

    if (error) return { error: error.message }
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
  }
}
