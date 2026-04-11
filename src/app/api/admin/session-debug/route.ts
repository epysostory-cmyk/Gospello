import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll()
  const cookieNames = allCookies.map(c => c.name)

  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    .replace('https://', '').split('.')[0]
  const key = `sb-${projectRef}-auth-token`

  // Try single cookie first, then chunked
  let raw = request.cookies.get(key)?.value ?? null
  if (!raw) {
    const chunks: string[] = []
    for (let i = 0; i < 10; i++) {
      const chunk = request.cookies.get(`${key}.${i}`)?.value
      if (!chunk) break
      chunks.push(chunk)
    }
    if (chunks.length > 0) raw = chunks.join('')
  }

  if (!raw) {
    return NextResponse.json({
      step: 'NO_COOKIE',
      total_cookies: allCookies.length,
      all_cookie_names: cookieNames,
      expected_cookie_key: key,
      message: 'Session cookie not found. Login did not write cookies to browser.',
    })
  }

  // Try to decode
  try {
    const b64url = raw.startsWith('base64-') ? raw.slice(7) : raw
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const json = Buffer.from(padded, 'base64').toString('utf-8')
    const session = JSON.parse(json)
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    if (!userId) {
      return NextResponse.json({ step: 'COOKIE_FOUND_NO_USER', raw_length: raw.length })
    }

    // Check admin
    const adminClient = createAdminClient()
    const { data: adminUser, error: adminError } = await adminClient
      .from('admin_users').select('id, role').eq('id', userId).single()

    return NextResponse.json({
      step: adminUser ? 'ALL_OK' : 'NOT_ADMIN',
      user_id: userId,
      user_email: userEmail,
      admin_role: adminUser?.role ?? null,
      admin_error: adminError?.message ?? null,
      cookie_found: key,
      total_cookies: allCookies.length,
    })
  } catch (e) {
    return NextResponse.json({
      step: 'DECODE_FAILED',
      error: String(e),
      raw_starts_with: raw.substring(0, 30),
      total_cookies: allCookies.length,
    })
  }
}
