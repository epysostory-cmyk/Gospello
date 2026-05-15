'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [logoUrl, setLogoUrl] = useState<string>('https://atrdstihzvnvbgxveplm.supabase.co/storage/v1/object/public/site-assets/logo/dccedb39-bf4b-4b4b-beec-fc285f57ad68/1777020281172.png')

  useEffect(() => {
    supabase.from('platform_settings').select('site_logo_url').eq('id', 'default').single()
      .then(({ data }) => { if (data?.site_logo_url) setLogoUrl(data.site_logo_url) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
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

        {sent ? (
          /* ── Success state ── */
          <div className="py-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
              <MailCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              We sent a password reset link to{' '}
              <span className="font-semibold text-gray-800">{email}</span>.
              Click the link in the email to set a new password.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {error && (
              <div className="mb-5 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
                  flex items-center justify-center gap-2
                  transition-colors active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
