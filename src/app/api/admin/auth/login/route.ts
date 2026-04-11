import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return NextResponse.json({ error: 'missing' }, { status: 400 })
  }

  // Capture every cookie Supabase wants to write
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Just collect them — we'll write them onto the response below
          cookiesToSet.forEach((c) => pendingCookies.push(c))
        },
      },
    }
  )

  const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError || !data.user) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 })
  }

  // Verify admin via service-role client (bypasses RLS)
  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient
    .from('admin_users')
    .select('id, role')
    .eq('id', data.user.id)
    .single()

  if (!adminUser) {
    await supabase.auth.signOut()
    return NextResponse.json({ error: 'noaccess' }, { status: 403 })
  }

  // Build response and stamp every session cookie directly onto it
  const response = NextResponse.json({ success: true })

  pendingCookies.forEach(({ name, value }) => {
    response.cookies.set(name, value, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
  })

  return response
}
