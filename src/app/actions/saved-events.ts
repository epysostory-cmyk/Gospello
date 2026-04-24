'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function toggleSaveEvent(
  eventId: string
): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, isSaved: false, error: 'You must be logged in to save events' }
    }

    const adminClient = createAdminClient()

    // Check if already saved
    const { data: existing } = await adminClient
      .from('saved_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle()

    if (existing) {
      // Already saved — remove it
      const { error } = await adminClient
        .from('saved_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId)

      if (error) {
        return { success: false, isSaved: true, error: error.message }
      }

      return { success: true, isSaved: false }
    } else {
      // Not saved — save it
      const { error } = await adminClient
        .from('saved_events')
        .insert({
          user_id: user.id,
          event_id: eventId,
        })

      if (error) {
        return { success: false, isSaved: false, error: error.message }
      }

      return { success: true, isSaved: true }
    }
  } catch (err) {
    return { success: false, isSaved: false, error: 'Something went wrong. Please try again.' }
  }
}

export async function saveEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('saved_events')
      .insert({ user_id: user.id, event_id: eventId })

    if (error && error.code !== '23505') return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'Something went wrong.' }
  }
}

export async function unsaveEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('saved_events')
      .delete()
      .eq('user_id', user.id)
      .eq('event_id', eventId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'Something went wrong.' }
  }
}

export async function getSavedEventIds(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('saved_events')
      .select('event_id')
      .eq('user_id', user.id)

    return (data ?? []).map((r: { event_id: string }) => r.event_id)
  } catch {
    return []
  }
}

export async function migrateSavedEvents(eventIds: string[]): Promise<{ success: boolean }> {
  try {
    if (!eventIds.length) return { success: true }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    const adminClient = createAdminClient()
    const rows = eventIds.map(id => ({ user_id: user.id, event_id: id }))

    // Insert all, ignore duplicates (23505)
    await adminClient.from('saved_events').upsert(rows, { onConflict: 'user_id,event_id', ignoreDuplicates: true })
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function checkEventSaved(eventId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data } = await supabase
      .from('saved_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle()

    return !!data
  } catch {
    return false
  }
}
