'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function attendEvent(
  eventId: string,
  name: string,
  email: string,
  phone: string | null
): Promise<{ success: boolean; error?: string; alreadyRegistered?: boolean }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const adminClient = createAdminClient()

    const { error } = await adminClient.from('attendances').insert({
      event_id: eventId,
      user_id: user?.id ?? null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
    })

    if (error) {
      if (error.code === '23505') {
        return { success: false, alreadyRegistered: true }
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

/** One-click attend for free events with no RSVP — uses profile data, no form needed */
export async function instantAttend(
  eventId: string
): Promise<{ success: boolean; error?: string; alreadyAttending?: boolean }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const adminClient = createAdminClient()

    // Get profile for name/email
    const { data: profile } = await adminClient
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single()

    const { error } = await adminClient.from('attendances').insert({
      event_id: eventId,
      user_id: user.id,
      name: profile?.display_name || user.email?.split('@')[0] || 'Guest',
      email: profile?.email || user.email || '',
      phone: null,
    })

    if (error) {
      if (error.code === '23505') return { success: false, alreadyAttending: true }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Something went wrong.' }
  }
}

/** Remove an instant attendance record */
export async function unattend(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('attendances')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'Something went wrong.' }
  }
}

/** Server-side check: has current user attended this event? */
export async function checkUserAttended(eventId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('attendances')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle()

    return !!data
  } catch {
    return false
  }
}

export async function getAttendanceCount(eventId: string): Promise<number> {
  const adminClient = createAdminClient()
  const { count } = await adminClient
    .from('attendances')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
  return count ?? 0
}
