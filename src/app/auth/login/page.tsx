'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    }>
      <LoginPage />
    </Suspense>
  )
}

function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]               = useState('')
  const [logoUrl, setLogoUrl]           = useState<string | null>(null)

  const reason = searchParams.get('reason')

  useEffect(() => {
    supabase.from('platform_settings').select('site_logo_url').eq('id', 'default').single()
      .then(({ data }) => { if (data?.site_logo_url) setLogoUrl(data.site_logo_url) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (reason === 'deleted') return
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) { router.replace('/dashboard'); return }
      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) keysToRemove.push(key)
        }
        keysToRemove.forEach(k => localStorage.removeItem(k))
      } catch { /* ignore */ }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials') || msg.includes('user not found')) {
        setError('Incorrect email or password. Please try again.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }
    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      setError('Please verify your email before signing in. Check your inbox for the confirmation link.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    setGoogleLoading(false)
  }

  const INPUT_CLS = `w-full h-[52px] px-4 rounded-lg border border-gray-300 text-sm text-gray-900
    placeholder:text-gray-400 bg-white outline-none
    focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
    transition-colors`

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-5 pt-16 pb-16">

        {/* Logo */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2">
            {logoUrl ? (
              <Image src={logoUrl} alt="Gospello" width={140} height={40} className="h-8 w-auto object-contain" />
            ) : (
              <>
                <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <span className="text-base font-bold text-gray-900">Gospello</span>
              </>
            )}
          </Link>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your email and password to continue.</p>
        </div>

        {/* Error banners */}
        {reason === 'deleted' && (
          <div className="mb-5 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
            <p className="font-semibold mb-0.5">Your account no longer exists.</p>
            <p className="text-red-600">If you think this is a mistake, contact <a href="mailto:support@gospello.com" className="underline font-medium">support@gospello.com</a></p>
          </div>
        )}
        {error && (
          <div className="mb-5 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required autoComplete="email"
              placeholder="Enter your email"
              className={INPUT_CLS}
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs text-indigo-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password"
                placeholder="Enter your password"
                className={`${INPUT_CLS} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
              flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full h-[52px] rounded-lg border border-gray-300 bg-white
            flex items-center justify-center gap-2.5
            text-sm font-medium text-gray-700
            hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          {googleLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <GoogleIcon />}
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-indigo-600 font-semibold hover:underline">
            Sign up free
          </Link>
        </p>

      </div>
    </div>
  )
}
