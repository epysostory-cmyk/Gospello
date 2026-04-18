import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  // Sign out on the server — this clears the auth cookie properly
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
