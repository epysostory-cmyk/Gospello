import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { eventId, sessionId, referral } = await request.json()
    if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

    const adminClient = createAdminClient()

    await adminClient.rpc('increment_event_views', { p_event_id: eventId })

    if (sessionId) {
      await adminClient
        .from('event_page_views')
        .upsert(
          { event_id: eventId, session_id: sessionId, referral: referral ?? null },
          { onConflict: 'event_id,session_id', ignoreDuplicates: true }
        )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
