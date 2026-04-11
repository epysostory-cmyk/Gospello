import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const origin = request.nextUrl.origin

  if (!email || !password) {
    return NextResponse.redirect(new URL('/admin/login?error=missing', origin), { status: 302 })
  }

  // Build response first — we attach cookies to this as Supabase writes them
  let supabaseResponse = NextResponse.redirect(new URL('/admin', origin), { status: 302 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write every session cookie directly onto the redirect response
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError || !data.user) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid', origin), { status: 302 })
  }

  // Verify admin status via service-role client (bypasses RLS)
  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient
    .from('admin_users')
    .select('id, role')
    .eq('id', data.user.id)
    .single()

  if (!adminUser) {
    // Not an admin — sign out and redirect back with error
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/admin/login?error=noaccess', origin), { status: 302 })
  }

  // Cookies are already on supabaseResponse — return it to redirect to /admin
  return supabaseResponse
}
