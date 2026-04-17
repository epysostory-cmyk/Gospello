'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

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

  const formContent = (
    <div className="w-full max-w-[420px] mx-auto">
      {sent ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-[#22C55E]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[22px] font-bold text-[#111827] mb-2">Check your email</h2>
          <p className="text-[14px] text-[#6B7280] mb-6">
            We sent a password reset link to <strong className="text-gray-800">{email}</strong>.
            Click the link in the email to set a new password.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#7C3AED] hover:text-[#6D28D9]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center mt-6 pb-12 md:pb-0">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-[14px] text-[#6B7280] hover:text-[#7C3AED] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
          </p>
        </>
      )}
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
          <h1 className="text-[24px] font-bold text-[#111827]">Reset password</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>
        {formContent}
      </div>

      {/* Desktop */}
      <div className="hidden md:flex min-h-screen">
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
            <h2 className="text-[32px] font-bold text-white leading-[1.3] mb-4">
              Forgot your password?
            </h2>
            <p className="text-[15px] text-white/75 leading-relaxed">
              No worries. Enter your email address and we&apos;ll send you a secure link to reset your password.
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-10 py-12 bg-white">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h1 className="text-[28px] font-bold text-[#111827]">Reset your password</h1>
              <p className="text-[15px] text-[#6B7280] mt-1">
                We&apos;ll send a reset link to your email
              </p>
            </div>
            {formContent}
          </div>
        </div>
      </div>
    </>
  )
}
