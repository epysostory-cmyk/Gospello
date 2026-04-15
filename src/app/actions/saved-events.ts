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
