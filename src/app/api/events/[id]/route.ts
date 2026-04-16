import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify event ownership
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', id)
      .single()

    if (!event || event.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      title: body.title,
      description: body.description,
      category: body.category,
      status: body.status || 'pending', // Reset to pending on edit
      visibility: body.visibility,
      start_date: body.start_date,
      end_date: body.end_date || null,
      is_online: body.is_online,
      online_platform: body.online_platform || null,
      online_link: body.online_link || null,
      location_name: body.location_name || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      is_free: body.is_free,
      price: body.price || null,
      currency: body.currency || 'NGN',
      payment_link: body.payment_link || null,
      registration_type: body.registration_type || 'free_no_registration',
      rsvp_required: body.rsvp_required,
      capacity: body.capacity || null,
      tags: body.tags || [],
      banner_url: body.banner_url || null,
      gallery_urls: body.gallery_urls || [],
      speakers: body.speakers || null,
      parking_available: body.parking_available,
      child_friendly: body.child_friendly,
      notes: body.notes || null,
    }

    const { data, error } = await adminClient
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Event update error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update event' },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
