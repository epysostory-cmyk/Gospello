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

export async function getAttendanceCount(eventId: string): Promise<number> {
  const adminClient = createAdminClient()
  const { count } = await adminClient
    .from('attendances')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
  return count ?? 0
}
