import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ 
      status: 'NO_USER', 
      error: userError?.message,
      message: 'getUser() returned null — session cookies missing or invalid'
    })
  }

  const adminClient = createAdminClient()
  const { data: adminUser, error: adminError } = await adminClient
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    status: adminUser ? 'ADMIN_OK' : 'NOT_ADMIN',
    userId: user.id,
    email: user.email,
    adminUser,
    adminError: adminError?.message,
  })
}
