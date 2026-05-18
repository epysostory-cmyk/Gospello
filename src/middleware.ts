import { NextRequest, NextResponse } from 'next/server'

// Set ADMIN_GATE_TOKEN in your Vercel environment variables.
// Anyone who doesn't know this token will see a 404 on the admin login page.
const GATE_TOKEN = process.env.ADMIN_GATE_TOKEN ?? 'gsp-2024-secure'
const GATE_COOKIE = 'gsp_admin_gate'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Only intercept the admin login entry point
  if (pathname === '/admin/login') {
    const tokenParam  = searchParams.get('key')
    const gateCookie  = request.cookies.get(GATE_COOKIE)?.value

    // Already has a valid gate cookie — let them through
    if (gateCookie === GATE_TOKEN) {
      return NextResponse.next()
    }

    // Correct token in query string — set gate cookie and redirect clean
    if (tokenParam === GATE_TOKEN) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.set(GATE_COOKIE, GATE_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/admin',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
      return response
    }

    // No token, no cookie — return 404 so the page appears to not exist
    return new NextResponse(null, { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/login'],
}
