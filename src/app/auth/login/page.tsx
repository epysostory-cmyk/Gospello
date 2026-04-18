'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'

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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" /></div>}>
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

  const reason = searchParams.get('reason')

  // If already signed in, skip the login page entirely.
  // Also clears any orphaned OAuth state (e.g. after user presses Back from Google).
  useEffect(() => {
    if (reason === 'deleted') return
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) { router.replace('/dashboard'); return }
      // No valid session — wipe any leftover PKCE / partial OAuth tokens
      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key)
          }
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
        setError('No account found with these details. It may have been removed. Contact support@gospello.com if you need help.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    // Block unverified accounts — sign them out immediately and prompt to verify
    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      setError('Please verify your email before signing in. Check your inbox for the confirmation link we sent when you signed up.')
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

  const formContent = (
    <div className="w-full max-w-[420px] mx-auto">
      {reason === 'deleted' && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
          <p className="font-semibold mb-0.5">Your account no longer exists.</p>
          <p className="text-red-600">If you think this is a mistake, please contact <a href="mailto:support@gospello.com" className="underline font-medium">support@gospello.com</a></p>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-[13px] font-medium text-[#374151] mb-1.5">
            Email Address
          </label>
          <input
            id="email" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            required autoComplete="email"
            placeholder="Enter your email address"
            className="w-full h-[52px] px-4 rounded-xl border-[1.5px] border-[#E5E7EB] text-[15px]
              placeholder:text-gray-400 outline-none
              focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE]
              transition-all duration-150"
            style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-[13px] font-medium text-[#374151]">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-[12px] text-[#7C3AED] hover:underline">
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
              className="w-full h-[52px] px-4 pr-12 rounded-xl border-[1.5px] border-[#E5E7EB] text-[15px]
                placeholder:text-gray-400 outline-none
                focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE]
                transition-all duration-150"
              style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-xl text-white text-[16px] font-semibold
            flex items-center justify-center gap-2
            transition-all duration-150 active:scale-[0.98] disabled:opacity-80"
          style={{ backgroundColor: '#7C3AED' }}
          onMouseOver={e => { if (!loading) (e.currentTarget.style.backgroundColor = '#6D28D9') }}
          onMouseOut={e => { (e.currentTarget.style.backgroundColor = '#7C3AED') }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#E5E7EB]" />
        <span className="text-[13px] text-[#9CA3AF] bg-white px-3">or</span>
        <div className="flex-1 h-px bg-[#E5E7EB]" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full h-[52px] rounded-xl border-[1.5px] border-[#E5E7EB] bg-white
          flex items-center justify-center gap-[10px]
          text-[15px] font-medium text-[#374151]
          hover:bg-[#F9FAFB] hover:border-[#D1D5DB]
          transition-all duration-150 disabled:opacity-60"
      >
        {googleLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <GoogleIcon />}
        Continue with Google
      </button>

      {/* Sign up link */}
      <p className="text-center text-[14px] text-[#6B7280] mt-6 pb-12 md:pb-0">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-[#7C3AED] font-semibold hover:text-[#6D28D9]">
          Sign up free
        </Link>
      </p>
    </div>
  )

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden min-h-screen bg-white px-5 pt-12 overflow-y-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#7C3AED' }}>
              <span className="text-white font-black text-base">G</span>
            </div>
            <span className="text-xl font-black text-gray-900">Gospello</span>
          </Link>
          <h1 className="text-[24px] font-bold text-[#111827]">Welcome back</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">Sign in to manage your events</p>
        </div>
        {formContent}
      </div>

      {/* Desktop */}
      <div className="hidden md:flex min-h-screen">
        {/* Left panel */}
        <div
          className="w-[45%] flex-shrink-0 relative flex flex-col"
          style={{ background: 'linear-gradient(160deg, #4F1787 0%, #6D28D9 55%, #7C3AED 100%)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 60% 80%, rgba(167,139,250,0.18) 0%, transparent 70%)' }}
          />
          <div className="px-10 pt-10 z-10">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white font-black text-sm">G</span>
              </div>
              <span className="text-lg font-black text-white">Gospello</span>
            </Link>
          </div>
          <div className="flex-1 flex flex-col justify-center px-12 z-10">
            <h2 className="text-[32px] font-bold text-white leading-[1.3] mb-8">
              Welcome back to Nigeria&apos;s gospel events platform
            </h2>
            <div className="space-y-3">
              {[
                'Manage all your events in one place',
                'Track registrations and attendance',
                'Share events directly to WhatsApp',
              ].map(benefit => (
                <div key={benefit} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                  <span className="text-[15px] text-white/85">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center px-10 py-12 bg-white overflow-y-auto">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h1 className="text-[28px] font-bold text-[#111827]">Welcome back</h1>
              <p className="text-[15px] text-[#6B7280] mt-1">Sign in to manage your events</p>
            </div>
            {formContent}
          </div>
        </div>
      </div>
    </>
  )
}
