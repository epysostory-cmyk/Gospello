'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

// In-memory rate limiter: 5 attempts per IP per 30 minutes
// Works well for single-instance deployments; replace with Redis/Upstash for multi-instance scale
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30 * 60 * 1000 // 30 minutes

function getClientIp(): string {
  // headers() is async in Next.js 15 but the return value is synchronous-accessible
  // We use a try/catch to be safe across versions
  try {
    const h = headers() as unknown as { get: (k: string) => string | null }
    return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

function checkRateLimit(ip: string): { blocked: boolean; remainingMs?: number } {
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (entry) {
    if (now < entry.resetAt && entry.count >= MAX_ATTEMPTS) {
      return { blocked: true, remainingMs: entry.resetAt - now }
    }
    if (now >= entry.resetAt) {
      loginAttempts.delete(ip)
    }
  }
  return { blocked: false }
}

function recordFailure(ip: string) {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (entry && now < entry.resetAt) {
    entry.count += 1
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOCKOUT_MS })
  }
}

function clearAttempts(ip: string) {
  loginAttempts.delete(ip)
}

export async function adminLogin(_prev: { error: string } | null, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const ip = getClientIp()
  const rateCheck = checkRateLimit(ip)

  if (rateCheck.blocked) {
    const minutesLeft = Math.ceil((rateCheck.remainingMs ?? LOCKOUT_MS) / 60000)
    return { error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.` }
  }

  const supabase = await createClient()

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !data.user) {
    recordFailure(ip)
    return { error: 'Invalid email or password' }
  }

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient
    .from('admin_users')
    .select('id, role')
    .eq('id', data.user.id)
    .single()

  if (!adminUser) {
    await supabase.auth.signOut()
    recordFailure(ip)
    return { error: 'You do not have admin access.' }
  }

  clearAttempts(ip)
  redirect('/admin')
}
