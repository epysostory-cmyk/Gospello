'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Check, ChevronLeft } from 'lucide-react'
import { NIGERIAN_STATES } from '@/lib/utils'
import type { AccountType } from '@/types/database'

const SIGNUP_MINISTRY_TYPES = [
  'Pastor', 'Youth Pastor', 'Evangelist', 'Prophet', 'Apostle', 'Bishop',
  'Worship Leader', 'Gospel Artist', 'Event Organizer', 'Conference Host',
  'Campus Minister', 'Ministry Leader', 'Musician', 'Christian Speaker',
  'Campus Fellowship', 'Other',
]

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

const INPUT_CLS = `w-full h-[52px] px-4 rounded-lg border border-gray-300 text-sm text-gray-900
  placeholder:text-gray-400 bg-white outline-none
  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
  transition-colors`

const SELECT_CLS = `w-full h-[52px] px-4 rounded-lg border border-gray-300 text-sm text-gray-900
  bg-white outline-none appearance-none
  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
  disabled:bg-gray-50 disabled:text-gray-400
  transition-colors`

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
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

  const [siteLogoUrl, setSiteLogoUrl] = useState<string>('https://atrdstihzvnvbgxveplm.supabase.co/storage/v1/object/public/site-assets/logo/dccedb39-bf4b-4b4b-beec-fc285f57ad68/1777020281172.png')

  useEffect(() => {
    supabase
      .from('platform_settings')
      .select('site_logo_url')
      .eq('id', 'default')
      .single()
      .then(({ data }) => {
        if (data?.site_logo_url) setSiteLogoUrl(data.site_logo_url)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
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

  const [accountType, setAccountType] = useState<AccountType>(
    (searchParams.get('type') as AccountType) ?? 'organizer'
  )
  const [fullName, setFullName]           = useState('')
  const [churchName, setChurchName]       = useState('')
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [showPassword, setShowPassword]   = useState(false)
  const [state, setState]                 = useState('')
  const [city, setCity]                   = useState('')
  const [ministryTypes, setMinistryTypes] = useState<string[]>([])
  const [loading, setLoading]             = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]                 = useState('')
  const [emailError, setEmailError]       = useState('')
  const [success, setSuccess]             = useState(false)
  const [shake, setShake]                 = useState(false)

  const strength = getStrength(password)
  useEffect(() => { setCity('') }, [state])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  const toggleMinistryType = (type: string) => {
    setMinistryTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : prev.length < 3 ? [...prev, type] : prev
    )
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const nameError = accountType === 'church'
      ? validateChurchName(churchName)
      : validateFullName(fullName)
    if (nameError) { setError(nameError); triggerShake(); return }
    if (accountType === 'organizer' && ministryTypes.length === 0) {
      setError('Please select at least one ministry type')
      triggerShake()
      return
    }
    if (password.length < 6) { setError('Password must be at least 6 characters'); triggerShake(); return }
    setLoading(true)
    setError('')
    setEmailError('')

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

    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    if (data.user && (data.user.identities?.length ?? 1) === 0) {
      await supabase.auth.signOut()
      setEmailError('exists')
      setLoading(false)
      return
    }

    if (data.user) {
      fetch('/api/auth/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          email,
          accountType,
          displayName,
          state: state || undefined,
          ministryType: ministryTypes.length > 0 ? ministryTypes.join(', ') : undefined,
        }),
      }).catch(() => {})
    }

    setSuccess(true)
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    setGoogleLoading(false)
  }

  const Logo = () => (
    <Link href="/" className="inline-flex items-center gap-2">
      {siteLogoUrl ? (
        <Image src={siteLogoUrl} alt="Gospello" width={120} height={36} className="h-8 w-auto object-contain" />
      ) : (
        <>
          <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="text-base font-bold text-gray-900">Gospello</span>
        </>
      )}
    </Link>
  )

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            We sent a confirmation link to <strong className="text-gray-700">{email}</strong>. Click it to verify your account, then sign in.
          </p>
          <ol className="text-left text-sm text-gray-600 mb-6 space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-5">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">1</span>
              Open the email we sent to <strong>{email}</strong>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">2</span>
              Click the confirmation link inside
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">3</span>
              Sign in to access your dashboard
            </li>
          </ol>
          <Link
            href="/auth/login"
            className="block w-full h-[52px] rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center transition-colors"
          >
            Go to Sign In
          </Link>
          <p className="text-xs text-gray-400 mt-4">Didn&apos;t get the email? Check your spam folder.</p>
        </div>
      </div>
    )
  }

  const formContent = (
    <div className="w-full max-w-[420px] mx-auto">

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Account type */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Account type</p>
      <div className="flex gap-3 mb-6">
        {([
          { type: 'organizer' as AccountType, icon: '🎤', title: 'Organizer', desc: 'Post events and reach believers' },
          { type: 'church'    as AccountType, icon: '⛪', title: 'Church',    desc: 'List your church and post events' },
        ]).map(({ type, icon, title, desc }) => {
          const active = accountType === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className={`relative flex-1 text-left p-4 rounded-xl border-2 transition-colors ${
                active ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {active && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              )}
              <span className="text-2xl block mb-2">{icon}</span>
              <span className={`block text-sm font-semibold ${active ? 'text-indigo-600' : 'text-gray-900'}`}>{title}</span>
              <span className="block text-xs text-gray-500 mt-0.5 leading-snug">{desc}</span>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSignUp} className={`space-y-4 ${shake ? 'animate-shake' : ''}`}>

        {/* Full name — organizer */}
        <div className="overflow-hidden transition-all duration-200" style={{ maxHeight: accountType === 'organizer' ? '110px' : '0', opacity: accountType === 'organizer' ? 1 : 0 }}>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Tunde Bello" autoComplete="name" className={INPUT_CLS} />
            <p className="text-xs text-gray-400 mt-1">First and last name</p>
          </div>
        </div>

        {/* Church name — church */}
        <div className="overflow-hidden transition-all duration-200" style={{ maxHeight: accountType === 'church' ? '110px' : '0', opacity: accountType === 'church' ? 1 : 0 }}>
          <div>
            <label htmlFor="churchName" className="block text-sm font-medium text-gray-700 mb-1.5">Church Name</label>
            <input id="churchName" type="text" value={churchName} onChange={e => setChurchName(e.target.value)}
              placeholder="e.g. Redeemed Christian Church Lagos" autoComplete="organization" className={INPUT_CLS} />
            <p className="text-xs text-gray-400 mt-1">Full official name of your church</p>
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <input id="email" type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailError('') }}
            required autoComplete="email" placeholder="Enter your email" className={INPUT_CLS} />
          {emailError === 'exists' && (
            <p className="mt-1.5 text-xs text-red-600">
              An account with this email already exists.{' '}
              <Link href="/auth/login" className="font-semibold underline">Sign in instead?</Link>
            </p>
          )}
        </div>

        {/* Ministry types — organizer */}
        <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: accountType === 'organizer' ? '360px' : '0', opacity: accountType === 'organizer' ? 1 : 0 }}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                Ministry Type <span className="text-red-400 text-xs font-normal">* required</span>
              </p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                ministryTypes.length === 0 ? 'bg-gray-100 text-gray-400'
                : ministryTypes.length < 3 ? 'bg-indigo-100 text-indigo-600'
                : 'bg-indigo-600 text-white'
              }`}>
                {ministryTypes.length}/3
              </span>
            </div>
            {ministryTypes.length === 0 && accountType === 'organizer' && (
              <p className="text-xs text-gray-400 mb-2">Pick at least 1, up to 3</p>
            )}
            <div className="flex flex-wrap gap-2">
              {SIGNUP_MINISTRY_TYPES.map(type => {
                const selected = ministryTypes.includes(type)
                const disabled = !selected && ministryTypes.length >= 3
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleMinistryType(type)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected ? 'bg-indigo-600 border-indigo-600 text-white'
                      : disabled ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 flex-shrink-0" strokeWidth={3} />}
                    {type}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
          <select id="state" value={state} onChange={e => setState(e.target.value)} className={SELECT_CLS}>
            <option value="">Select your state</option>
            {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
          <input id="city" type="text" value={city} onChange={e => setCity(e.target.value)}
            placeholder="e.g. Lekki" className={INPUT_CLS} />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required minLength={6} autoComplete="new-password"
              placeholder="Create a password (min. 6 characters)"
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
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{ background: i <= strength.score ? strength.color : '#E5E7EB' }} />
                ))}
              </div>
              <p className="text-xs mt-1 font-medium" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}
        </div>

        {/* Terms */}
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-indigo-600 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
            flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
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

      <p className="text-center text-sm text-gray-500 mt-6 pb-12 md:pb-0">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  )

  return (
    <>
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

      <div className="min-h-screen bg-white">
        <div className="max-w-lg mx-auto px-5 pt-8 pb-16">

          {/* Top nav */}
          <div className="flex items-center justify-between mb-10">
            <Logo />
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Free to join. Start posting events in minutes.</p>
          </div>

          {formContent}
        </div>
      </div>
    </>
  )
}
