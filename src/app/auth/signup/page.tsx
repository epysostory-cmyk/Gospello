'use client'

import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Building2, User } from 'lucide-react'
import type { AccountType } from '@/types/database'

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>}>
      <SignUpForm />
    </Suspense>
  )
}

function SignUpForm() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [accountType, setAccountType] = useState<AccountType>(
    (searchParams.get('type') as AccountType) ?? 'organizer'
  )
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) { setError('Please enter your name'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          account_type: accountType,
          display_name: displayName.trim(),
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Belt-and-suspenders: explicitly upsert the profile in case the
    // Supabase trigger (on_auth_user_created) hasn't been applied yet.
    if (data.user) {
      await fetch('/api/auth/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          email,
          accountType,
          displayName: displayName.trim(),
        }),
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 mb-4">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click the link to verify your account.
          </p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm font-semibold text-indigo-800 mb-1">
              {accountType === 'church' ? '⛪ Church account created' : '🎤 Organizer account created'}
            </p>
            <p className="text-xs text-indigo-700">
              {accountType === 'church'
                ? 'After confirming your email, you\'ll set up your church profile (name, location, service times).'
                : 'After confirming your email, you can start posting Christian events right away.'}
            </p>
          </div>
          <Link href="/auth/login" className="text-indigo-600 font-medium hover:text-indigo-700">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Gospello</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Create your account</h1>
          <p className="text-gray-500 mt-1">Start posting events for free</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSignUp} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {/* Account type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Register as...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('organizer')}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 transition-all text-left ${
                    accountType === 'organizer'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accountType === 'organizer' ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                    <User className={`w-4 h-4 ${accountType === 'organizer' ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <span className={`text-sm font-semibold ${accountType === 'organizer' ? 'text-indigo-700' : 'text-gray-700'}`}>
                    Organizer
                  </span>
                  <span className="text-xs text-gray-500 leading-tight">Post Christian events & conferences</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('church')}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 transition-all text-left ${
                    accountType === 'church'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accountType === 'church' ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                    <Building2 className={`w-4 h-4 ${accountType === 'church' ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <span className={`text-sm font-semibold ${accountType === 'church' ? 'text-indigo-700' : 'text-gray-700'}`}>
                    Church
                  </span>
                  <span className="text-xs text-gray-500 leading-tight">Manage your church profile & services</span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1.5">
                {accountType === 'church' ? 'Church Name' : 'Your Name'}
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder={accountType === 'church' ? 'Grace Community Church' : 'John Doe'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By signing up you agree to our{' '}
              <span className="text-indigo-600 cursor-pointer">Terms of Service</span>
            </p>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
