import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json()
    if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

    const adminClient = createAdminClient()
    await adminClient.rpc('increment_event_views', { p_event_id: eventId })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
