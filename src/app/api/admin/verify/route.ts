import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('admin_users')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Not an admin' }, { status: 403 })
    }

    return NextResponse.json({ role: data.role })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
