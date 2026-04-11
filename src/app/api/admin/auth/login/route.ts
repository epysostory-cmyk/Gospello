import {
  serializeCookieHeader,
  DEFAULT_COOKIE_OPTIONS,
  createChunks,
  stringToBase64URL,
} from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Extract the project ref from the URL  e.g. "atrdstihzvnvbgxveplm"
function getProjectRef(url: string) {
  return url.replace('https://', '').split('.')[0]
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return NextResponse.json({ error: 'missing' }, { status: 400 })
  }

  // Use the admin (service role) client to sign in — it bypasses RLS and
  // gives us the session object directly without any async event listeners
  const adminClient = createAdminClient()

  // Sign in using the REST API directly so we get raw tokens back
  const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  })

  if (!signInRes.ok) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 })
  }

  const session = await signInRes.json()

  if (!session.access_token || !session.user) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 })
  }

  // Verify this user is an admin (service role bypasses RLS)
  const { data: adminUser } = await adminClient
    .from('admin_users')
    .select('id, role')
    .eq('id', session.user.id)
    .single()

  if (!adminUser) {
    return NextResponse.json({ error: 'noaccess' }, { status: 403 })
  }

  // Build the session object in the exact format @supabase/ssr stores it
  const sessionToStore = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
    expires_in: session.expires_in,
    token_type: session.token_type ?? 'bearer',
    user: session.user,
  }

  // Encode and chunk exactly as @supabase/ssr does
  const projectRef = getProjectRef(SUPABASE_URL)
  const storageKey = `sb-${projectRef}-auth-token`
  const encoded = 'base64-' + stringToBase64URL(JSON.stringify(sessionToStore))
  const chunks = createChunks(storageKey, encoded)

  const cookieOptions = {
    ...DEFAULT_COOKIE_OPTIONS,
    maxAge: DEFAULT_COOKIE_OPTIONS.maxAge,
  }

  // Build the redirect response and append a Set-Cookie header per chunk
  const response = NextResponse.json({ success: true })

  chunks.forEach(({ name, value }) => {
    // Use headers.append so multiple Set-Cookie headers are preserved
    response.headers.append(
      'Set-Cookie',
      serializeCookieHeader(name, value, cookieOptions)
    )
  })

  return response
}
