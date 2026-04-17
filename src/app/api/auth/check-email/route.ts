import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ exists: false })

    const normalised = email.trim().toLowerCase()
    const admin = createAdminClient()

    // Query auth.users directly via the service-role REST API
    // This is the only source of truth — catches users even if profile row is missing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const res = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(normalised)}`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } }
    )

    if (res.ok) {
      const body = await res.json()
      // GoTrue returns { users: [...] } — check if any match
      const users: Array<{ email?: string }> = body?.users ?? []
      if (users.some(u => u.email?.toLowerCase() === normalised)) {
        return NextResponse.json({ exists: true })
      }
    }

    // Fallback: profiles table (fast, catches edge cases)
    const { data } = await admin
      .from('profiles')
      .select('id')
      .eq('email', normalised)
      .maybeSingle()

    return NextResponse.json({ exists: !!data })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
