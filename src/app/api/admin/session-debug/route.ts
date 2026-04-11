import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll()
  const supabaseCookies = allCookies.filter(c => c.name.includes('sb-'))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({
      step: 'FAILED_AT_GETUSER',
      total_cookies: allCookies.length,
      supabase_cookies: supabaseCookies.map(c => c.name),
      error: userError?.message,
    })
  }

  const adminClient = createAdminClient()
  const { data: adminUser, error: adminError } = await adminClient
    .from('admin_users').select('*').eq('id', user.id).single()

  return NextResponse.json({
    step: adminUser ? 'ALL_OK' : 'FAILED_AT_ADMIN_CHECK',
    user_email: user.email,
    admin_role: adminUser?.role ?? null,
    admin_error: adminError?.message ?? null,
  })
}
