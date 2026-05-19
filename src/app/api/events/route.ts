import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'
import { geocodeEvent } from '@/lib/geocode'
import { NextRequest, NextResponse } from 'next/server'
import type { RecurrenceRule } from '@/types/database'
import { generateOccurrenceDates } from '@/lib/recurrence'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.description || !body.start_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // slugify() already appends a random suffix for uniqueness
    const slug = slugify(body.title)

    const coords = body.is_online ? null : await geocodeEvent({
      address: body.address, city: body.city, state: body.state, country: body.country,
    })

    // Prepare event data
    const eventData = {
      title: body.title,
      slug,
      description: body.description,
      category: body.category || 'worship',
      organizer_id: user.id,
      status: body.status || 'pending',
      visibility: body.visibility || 'public',
      start_date: body.start_date,
      end_date: body.end_date || null,
      is_online: body.is_online || false,
      online_platform: body.online_platform || null,
      online_link: body.online_link || null,
      location_name: body.location_name || '',
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      country: body.country || 'Nigeria',
      is_free: body.is_free !== false,
      price: body.price || null,
      currency: body.currency || 'NGN',
      payment_link: body.payment_link || null,
      registration_type: body.registration_type || 'free_no_registration',
      rsvp_required: body.rsvp_required || false,
      capacity: body.capacity || null,
      tags: body.tags || [],
      banner_url: body.banner_url || null,
      gallery_urls: body.gallery_urls || [],
      speakers: body.speakers || null,
      parking_available: body.parking_available || false,
      child_friendly: body.child_friendly || false,
      notes: body.notes || null,
      shuttle_available: body.shuttle_available || false,
      wheelchair_accessible: body.wheelchair_accessible || false,
      food_provided: body.food_provided || false,
      accommodation_available: body.accommodation_available || false,
      dress_code: body.dress_code || null,
      no_recording: body.no_recording || false,
      gender_restriction: body.gender_restriction || null,
      daily_schedule: body.daily_schedule || null,
      timezone: body.timezone || 'Africa/Lagos',
      livestream_url: body.livestream_url || null,
      is_featured: false,
      featured_until: null,
      views_count: 0,
      latitude:  coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
    }

    const recurrenceRule: RecurrenceRule | null = body.recurrence_rule ?? null

    if (recurrenceRule) {
      // Create the series record first
      const seriesSlug = slugify(body.title + '-series')
      const { data: series, error: seriesErr } = await adminClient
        .from('event_series')
        .insert([{
          title: body.title,
          slug: seriesSlug,
          recurrence_rule: recurrenceRule,
          organizer_id: user.id,
        }])
        .select()
        .single()

      if (seriesErr) {
        return NextResponse.json({ error: seriesErr.message }, { status: 400 })
      }

      // Generate all occurrence dates
      const baseDate = new Date(body.start_date)
      const occurrences = generateOccurrenceDates(recurrenceRule, baseDate)

      // Duration in ms (for computing end_date of each occurrence)
      const durationMs = body.end_date
        ? new Date(body.end_date).getTime() - baseDate.getTime()
        : 2 * 60 * 60 * 1000 // default 2h

      const childEvents = occurrences.map((occDate, idx) => {
        const occEnd = new Date(occDate.getTime() + durationMs)
        return {
          ...eventData,
          slug: slugify(body.title + (idx === 0 ? '' : `-${idx + 1}`)),
          start_date: occDate.toISOString(),
          end_date: body.end_date ? occEnd.toISOString() : null,
          event_series_id: series.id,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        }
      })

      const { data: insertedEvents, error: eventsErr } = await adminClient
        .from('events')
        .insert(childEvents)
        .select()

      if (eventsErr) {
        return NextResponse.json({ error: eventsErr.message }, { status: 400 })
      }

      return NextResponse.json({ series, events: insertedEvents, count: insertedEvents?.length }, { status: 201 })
    }

    // Insert event using admin client (handles defaults)
    const { data, error } = await adminClient
      .from('events')
      .insert([eventData])
      .select()
      .single()

    if (error) {
      console.error('Event creation error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create event' },
        { status: 400 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
