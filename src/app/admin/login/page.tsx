'use client'

import { useState, Suspense } from 'react'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Get project ref from URL e.g. "atrdstihzvnvbgxveplm"
function getProjectRef() {
  return SUPABASE_URL.replace('https://', '').split('.')[0]
}

// Base64url encode (same as @supabase/ssr's stringToBase64URL)
function toBase64URL(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
  return str
}

// Chunk and write session cookies directly to document.cookie
// Mirrors exactly what @supabase/ssr does internally
function writeSessionCookies(session: Record<string, unknown>) {
  const projectRef = getProjectRef()
  const key = `sb-${projectRef}-auth-token`
  const value = 'base64-' + toBase64URL(JSON.stringify(session))
  const MAX_CHUNK = 3180
  const encoded = encodeURIComponent(value)
  const cookieOpts = '; path=/; max-age=34560000; samesite=lax'

  if (encoded.length <= MAX_CHUNK) {
    document.cookie = `${key}=${value}${cookieOpts}`
  } else {
    // Split into chunks
    let remaining = encoded
    let i = 0
    while (remaining.length > 0) {
      let head = remaining.slice(0, MAX_CHUNK)
      // Don't cut in middle of a % escape
      const lastPct = head.lastIndexOf('%')
      if (lastPct > MAX_CHUNK - 3) head = head.slice(0, lastPct)
      const chunkValue = decodeURIComponent(head)
      document.cookie = `${key}.${i}=${chunkValue}${cookieOpts}`
      remaining = remaining.slice(head.length)
      i++
    }
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Invalid email or password.',
  noaccess: 'You do not have admin access.',
}

function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error') ?? ''

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Step 1: Call Supabase Auth REST API directly — no library, no async event chains
    const authRes = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      }
    )

    if (!authRes.ok) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    const session = await authRes.json()

    if (!session.access_token || !session.user) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // Step 2: Verify admin status server-side
    const verifyRes = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id }),
      credentials: 'same-origin',
    })

    if (!verifyRes.ok) {
      setError('You do not have admin access.')
      setLoading(false)
      return
    }

    // Step 3: Write session cookies directly and synchronously to document.cookie
    // This bypasses all async event chains in @supabase/ssr and guarantees
    // cookies are written before the next navigation request is sent
    writeSessionCookies({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
      expires_in: session.expires_in ?? 3600,
      token_type: session.token_type ?? 'bearer',
      user: session.user,
    })

    // Step 4: Navigate. Cookies are already set synchronously above.
    window.location.href = '/admin'
  }

  const displayError = error || ERROR_MESSAGES[urlError] || ''

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="text-gray-400 mt-1 text-sm">Gospello Admin Panel</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {displayError && (
              <div className="bg-red-900/30 text-red-400 text-sm px-4 py-3 rounded-lg border border-red-800">
                {displayError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Admin Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@gospello.com"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in to Admin'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-6">
            Not an admin?{' '}
            <a href="/auth/login" className="text-gray-400 hover:text-gray-300">
              Go to regular sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  )
}
