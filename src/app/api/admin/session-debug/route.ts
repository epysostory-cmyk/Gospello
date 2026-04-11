import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll()
  const cookieNames = allCookies.map(c => c.name)
  const supabaseCookies = allCookies.filter(c => c.name.includes('sb-') || c.name.includes('supabase'))

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
      problem: 'No valid session — login is not saving cookies',
      env_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      env_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      env_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      total_cookies_in_request: allCookies.length,
      all_cookie_names: cookieNames,
      supabase_cookies_count: supabaseCookies.length,
      supabase_cookie_names: supabaseCookies.map(c => c.name),
      error: userError?.message,
    })
  }

  const adminClient = createAdminClient()
  const { data: adminUser, error: adminError } = await adminClient
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    step: adminUser ? 'ALL_OK' : 'FAILED_AT_ADMIN_CHECK',
    user_id: user.id,
    user_email: user.email,
    admin_found: !!adminUser,
    admin_role: adminUser?.role ?? null,
    admin_error: adminError?.message ?? null,
    supabase_cookies_count: supabaseCookies.length,
  })
}
