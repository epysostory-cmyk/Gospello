import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'

// Test endpoint: GET /api/admin/auth/test-login?email=x&password=y
// Returns JSON showing exactly what happens at each step of login
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  const password = request.nextUrl.searchParams.get('password')

  if (!email || !password) {
    return NextResponse.json({ error: 'Pass ?email=...&password=... in the URL' })
  }

  const cookiesWritten: string[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name }) => cookiesWritten.push(name))
        },
      },
    }
  )

  const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError || !data.user) {
    return NextResponse.json({
      step: 'FAILED_SIGNIN',
      error: signInError?.message ?? 'No user returned',
      cookies_written: cookiesWritten,
    })
  }

  const adminClient = createAdminClient()
  const { data: adminUser, error: adminError } = await adminClient
    .from('admin_users').select('id, role').eq('id', data.user.id).single()

  return NextResponse.json({
    step: 'SIGNIN_OK',
    user_id: data.user.id,
    user_email: data.user.email,
    cookies_supabase_tried_to_write: cookiesWritten,
    admin_found: !!adminUser,
    admin_role: adminUser?.role ?? null,
    admin_error: adminError?.message ?? null,
    note: cookiesWritten.length === 0
      ? 'WARNING: Supabase did not write any cookies — this is the bug'
      : 'Cookies were written OK',
  })
}
