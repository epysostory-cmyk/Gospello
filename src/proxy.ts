import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check for a real Supabase session cookie.
  // Must exclude the PKCE code-verifier cookie (sb-*-auth-token-code-verifier)
  // which is written when OAuth starts but does NOT represent an active session.
  // Matching it causes a redirect loop when the user presses Back from Google.
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.includes('-auth-token') && !c.name.endsWith('-code-verifier')
  )

  // Protect admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  // BUT: don't redirect if they're already coming from /dashboard (breaks redirect loop)
  const referer = request.headers.get('referer') ?? ''
  const comingFromDashboard = referer.includes('/dashboard')
  if ((pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) && hasSession && !comingFromDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
