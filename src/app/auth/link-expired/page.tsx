'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MailX, RefreshCw, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function LinkExpiredPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.resend({ type: 'signup', email })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MailX className="w-8 h-8 text-amber-500" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Verification link expired</h1>
        <p className="text-sm text-gray-500 mb-6">
          This link has expired or has already been used. Enter your email below to request a new verification link.
        </p>

        {sent ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-900">Verification email sent!</p>
            <p className="text-xs text-gray-500">Check your inbox and click the new link.</p>
            <Link href="/auth/login" className="text-sm text-indigo-600 hover:underline mt-2">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleResend} className="space-y-3 text-left">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <p className="text-center text-xs text-gray-400 pt-1">
              <Link href="/auth/login" className="text-indigo-600 hover:underline">Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
