'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import type { AccountType } from '@/types/database'

/* ─── Name validation ───────────────────────────────────────── */
function validateFullName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Please enter your full name'
  if (/[0-9]/.test(trimmed)) return 'Your name should not contain numbers'
  if (/[^a-zA-ZÀ-ÖØ-öø-ÿ\s'\-.]/.test(trimmed)) return 'Your name contains invalid characters'
  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length < 2) return 'Please enter your first and last name'
  if (words.some(w => w.length < 2)) return 'Each part of your name must be at least 2 characters'
  if (trimmed.length > 60) return 'Name is too long'
  return null
}

function validateChurchName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Please enter your church name'
  if (/^[0-9]/.test(trimmed)) return 'Church name should not start with a number'
  if (/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9\s'\-.,&()]/.test(trimmed)) return 'Church name contains invalid characters'
  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length < 2) return 'Please enter the full church name (e.g. "Grace Bible Church")'
  if (trimmed.length < 5) return 'Church name is too short'
  if (trimmed.length > 80) return 'Church name is too long'
  return null
}

/* ─── Password strength ─────────────────────────────────────── */
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label: 'Weak',   color: '#EF4444' },
    { label: 'Weak',   color: '#EF4444' },
    { label: 'Fair',   color: '#F97316' },
    { label: 'Good',   color: '#EAB308' },
    { label: 'Strong', color: '#22C55E' },
  ]
  return { score, ...map[score] }
}

/* ─── Google logo SVG ────────────────────────────────────────── */
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

/* ─── Input component ────────────────────────────────────────── */
function Field({
  id, label, type = 'text', value, onChange, placeholder, required, autoComplete,
  rightSlot, shake,
}: {
  id: string; label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder: string; required?: boolean
  autoComplete?: string; rightSlot?: React.ReactNode; shake?: boolean
}) {
  return (
    <div className={shake ? 'animate-shake' : ''}>
      <label htmlFor={id} className="block text-[13px] font-medium text-[#374151] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full h-[52px] px-4 rounded-xl border-[1.5px] border-[#E5E7EB] text-[15px] text-gray-900
            placeholder:text-gray-400 bg-white outline-none
            focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE]
            transition-all duration-150"
          style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
        />
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}

function SignUpForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  // If already signed in, skip signup
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [accountType, setAccountType] = useState<AccountType>(
    (searchParams.get('type') as AccountType) ?? 'organizer'
  )
  const [fullName, setFullName]         = useState('')
  const [churchName, setChurchName]     = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState(false)
  const [shake, setShake]               = useState(false)

  const strength = getStrength(password)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  /* ── Email sign-up ── */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // Name validation
    const nameError = accountType === 'church'
      ? validateChurchName(churchName)
      : validateFullName(fullName)
    if (nameError) { setError(nameError); triggerShake(); return }

    if (password.length < 6) { setError('Password must be at least 6 characters'); triggerShake(); return }
    setLoading(true)
    setError('')

    const displayName = accountType === 'church' ? churchName.trim() : fullName.trim()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          account_type: accountType,
          display_name: displayName,
          church_name: accountType === 'church' ? churchName.trim() : undefined,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await fetch('/api/auth/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          email,
          accountType,
          displayName,
        }),
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  /* ── Google OAuth ── */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    setGoogleLoading(false)
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 mb-4">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click the link to verify your account.
          </p>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm font-semibold text-purple-800 mb-1">
              {accountType === 'church' ? '⛪ Church account created' : '🎤 Organizer account created'}
            </p>
            <p className="text-xs text-purple-700">
              {accountType === 'church'
                ? "After confirming your email, you'll set up your church profile."
                : 'After confirming your email, you can start posting gospel events right away.'}
            </p>
          </div>
          <Link href="/auth/login" className="text-[#7C3AED] font-medium hover:text-[#6D28D9]">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  /* ── Form ── */
  const formContent = (
    <div className="w-full max-w-[420px] mx-auto">

      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Account type label */}
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
        I want to…
      </p>

      {/* Account type cards */}
      <div className="flex gap-3 mb-6">
        {([
          { type: 'organizer' as AccountType, icon: '🎤', title: 'Organizer', desc: 'Post gospel events and reach believers' },
          { type: 'church'    as AccountType, icon: '⛪', title: 'Church',    desc: 'Post events and get your church discovered' },
        ]).map(({ type, icon, title, desc }) => {
          const active = accountType === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className="relative flex-1 text-left p-4 rounded-2xl border-2 transition-all duration-200"
              style={{
                borderColor: active ? '#7C3AED' : '#E5E7EB',
                background:  active ? '#FAF5FF' : '#FFFFFF',
              }}
            >
              {/* Checkmark */}
              {active && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              )}
              <span className="text-3xl block mb-2">{icon}</span>
              <span
                className="block text-[15px] font-bold leading-tight"
                style={{ color: active ? '#7C3AED' : '#111827' }}
              >
                {title}
              </span>
              <span className="block text-[12px] text-[#6B7280] mt-1 leading-snug">{desc}</span>
            </button>
          )
        })}
      </div>

      {/* Form fields */}
      <form onSubmit={handleSignUp} className="space-y-4">

        {/* Full Name — only for organizer */}
        <div
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{
            maxHeight: accountType === 'organizer' ? '80px' : '0',
            opacity:   accountType === 'organizer' ? 1 : 0,
          }}
        >
          <Field
            id="fullName" label="Full Name" value={fullName}
            onChange={setFullName} placeholder="e.g. Tunde Bello"
            autoComplete="name" shake={shake}
          />
          <p className="text-[11px] text-gray-400 mt-1.5 px-1">Enter your first and last name — no numbers or symbols</p>
        </div>

        {/* Church name — only for church */}
        <div
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{
            maxHeight: accountType === 'church' ? '80px' : '0',
            opacity:   accountType === 'church' ? 1 : 0,
          }}
        >
          <Field
            id="churchName" label="Church Name" value={churchName}
            onChange={setChurchName}
            placeholder="e.g. Redeemed Christian Church Lagos"
            autoComplete="organization" shake={shake}
          />
          <p className="text-[11px] text-gray-400 mt-1.5 px-1">Enter the full official name of your church (at least 2 words)</p>
        </div>

        <Field
          id="email" label="Email Address" type="email" value={email}
          onChange={setEmail} placeholder="Enter your email address"
          required autoComplete="email" shake={shake}
        />

        {/* Password with show/hide + strength */}
        <div className={shake ? 'animate-shake' : ''}>
          <label htmlFor="password" className="block text-[13px] font-medium text-[#374151] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Create a strong password"
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

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{ background: i <= strength.score ? strength.color : '#E5E7EB' }}
                  />
                ))}
              </div>
              <p className="text-[11px] mt-1 font-medium" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Terms */}
        <p className="text-[12px] text-[#6B7280] text-center leading-relaxed">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-[#7C3AED] hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-[#7C3AED] hover:underline">Privacy Policy</Link>
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-xl text-white text-[16px] font-semibold
            flex items-center justify-center gap-2
            transition-all duration-150 active:scale-[0.98] disabled:opacity-80"
          style={{ background: loading ? '#7C3AED' : undefined, backgroundColor: '#7C3AED' }}
          onMouseOver={e => { if (!loading) (e.currentTarget.style.backgroundColor = '#6D28D9') }}
          onMouseOut={e => { (e.currentTarget.style.backgroundColor = '#7C3AED') }}
        >
          {loading
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : 'Create Account'}
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

      {/* Sign in link */}
      <p className="text-center text-[14px] text-[#6B7280] mt-6 pb-12 md:pb-0">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-[#7C3AED] font-semibold hover:text-[#6D28D9]">
          Sign in
        </Link>
      </p>
    </div>
  )

  return (
    <>
      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>

      {/* ── MOBILE layout (hidden on md+) ── */}
      <div className="md:hidden min-h-screen bg-white px-5 pt-12 overflow-y-auto">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#7C3AED' }}>
              <span className="text-white font-black text-base">G</span>
            </div>
            <span className="text-xl font-black text-gray-900">Gospello</span>
          </Link>
          <h1 className="text-[24px] font-bold text-[#111827] leading-tight">Join Gospello</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">Nigeria&apos;s home for gospel events</p>
        </div>

        {formContent}
      </div>

      {/* ── DESKTOP layout (hidden below md) ── */}
      <div className="hidden md:flex min-h-screen">

        {/* Left panel */}
        <div
          className="w-[45%] flex-shrink-0 relative flex flex-col"
          style={{ background: 'linear-gradient(160deg, #4F1787 0%, #6D28D9 55%, #7C3AED 100%)' }}
        >
          {/* Glow overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 60% 80%, rgba(167,139,250,0.18) 0%, transparent 70%)' }}
          />

          {/* Logo top-left */}
          <div className="px-10 pt-10 z-10">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white font-black text-sm">G</span>
              </div>
              <span className="text-lg font-black text-white">Gospello</span>
            </Link>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center px-12 z-10">
            <h2 className="text-[32px] font-bold text-white leading-[1.3] mb-8">
              Connecting believers to every gospel event in Nigeria
            </h2>
            <div className="space-y-3">
              {[
                'Free to post events',
                'Reach believers across all 36 states',
                'WhatsApp sharing built in',
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
          {formContent}
        </div>
      </div>
    </>
  )
}
