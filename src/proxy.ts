import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const response = NextResponse.next()

  // ── Admin route protection ─────────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // Build Supabase client that reads edge-runtime cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Check profiles.role first, then fall back to admin_users table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const adminRoles = ['super_admin', 'admin', 'moderator']
    const isAdminByRole = profile && adminRoles.includes(profile.role)

    if (!isAdminByRole) {
      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!adminRecord) {
        return NextResponse.redirect(new URL('/404', request.url))
      }
    }

    return response
  }

  // ── Check for a real Supabase session cookie ───────────────────────────
  // Exclude PKCE code-verifier cookies (written during OAuth, not a real session)
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.includes('-auth-token') && !c.name.endsWith('-code-verifier')
  )

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  const referer = request.headers.get('referer') ?? ''
  const comingFromDashboard = referer.includes('/dashboard')
  if ((pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) && hasSession && !comingFromDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
