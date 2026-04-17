'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [done, setDone]                 = useState(false)
  const [error, setError]               = useState('')

  // Supabase sends tokens as hash params — exchange them for a session
  useEffect(() => {
    supabase.auth.getSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden min-h-screen bg-white px-5 pt-12">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#7C3AED' }}>
              <span className="text-white font-black text-base">G</span>
            </div>
            <span className="text-xl font-black text-gray-900">Gospello</span>
          </Link>
          <h1 className="text-[24px] font-bold text-[#111827]">Set new password</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">Choose a strong password</p>
        </div>
        <FormContent
          password={password} setPassword={setPassword}
          showPassword={showPassword} setShowPassword={setShowPassword}
          loading={loading} done={done} error={error}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Desktop */}
      <div className="hidden md:flex min-h-screen">
        <div
          className="w-[45%] flex-shrink-0 relative flex flex-col"
          style={{ background: 'linear-gradient(160deg, #4F1787 0%, #6D28D9 55%, #7C3AED 100%)' }}
        >
          <div className="absolute inset-0 pointer-events-none"
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
            <h2 className="text-[32px] font-bold text-white leading-[1.3] mb-4">Almost done</h2>
            <p className="text-[15px] text-white/75">Set a new password to get back into your account.</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-10 py-12 bg-white">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h1 className="text-[28px] font-bold text-[#111827]">Set new password</h1>
              <p className="text-[15px] text-[#6B7280] mt-1">Choose a strong password for your account</p>
            </div>
            <FormContent
              password={password} setPassword={setPassword}
              showPassword={showPassword} setShowPassword={setShowPassword}
              loading={loading} done={done} error={error}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </>
  )
}

function FormContent({ password, setPassword, showPassword, setShowPassword, loading, done, error, onSubmit }: {
  password: string; setPassword: (v: string) => void
  showPassword: boolean; setShowPassword: (v: boolean) => void
  loading: boolean; done: boolean; error: string
  onSubmit: (e: React.FormEvent) => void
}) {
  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-[#22C55E]" strokeWidth={2.5} />
        </div>
        <h2 className="text-[22px] font-bold text-[#111827] mb-2">Password updated!</h2>
        <p className="text-[14px] text-[#6B7280]">Redirecting you to your dashboard…</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-[13px] font-medium text-[#374151] mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required minLength={6}
              placeholder="Create a strong password"
              className="w-full h-[52px] px-4 pr-12 rounded-xl border-[1.5px] border-[#E5E7EB] text-[15px]
                placeholder:text-gray-400 outline-none
                focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE]
                transition-all duration-150"
              style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full h-[52px] rounded-xl text-white text-[16px] font-semibold
            flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-80"
          style={{ backgroundColor: '#7C3AED' }}
          onMouseOver={e => { if (!loading) (e.currentTarget.style.backgroundColor = '#6D28D9') }}
          onMouseOut={e => { (e.currentTarget.style.backgroundColor = '#7C3AED') }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
