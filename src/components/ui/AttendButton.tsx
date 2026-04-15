'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, UserPlus, UserMinus, UserCheck, Ticket } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { attendEvent, instantAttend, unattend } from '@/app/actions/attendance'
import AuthModal from './AuthModal'
import type { User } from '@supabase/supabase-js'

interface Props {
  eventId: string
  eventTitle: string
  isFree: boolean
  rsvpRequired: boolean
  paymentLink?: string | null
  initialCount?: number
  initialAttended?: boolean
}

export default function AttendButton({
  eventId,
  eventTitle,
  isFree,
  rsvpRequired,
  paymentLink,
  initialCount = 0,
  initialAttended = false,
}: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [attended, setAttended] = useState(initialAttended)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Registration form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        setName(data.user.user_metadata?.display_name ?? '')
        setEmail(data.user.email ?? '')
      }
      setLoadingUser(false)
    })
  }, [])

  // Determine which attendance mode applies:
  // • instant — free, no registration required → one-tap attend
  // • rsvp    — free but registration required → fill form
  // • paid    — paid event (always requires registration → fill form + payment redirect)
  const mode = !isFree ? 'paid' : rsvpRequired ? 'rsvp' : 'instant'

  const doInstantAttend = async () => {
    setBusy(true)
    setError('')
    const res = await instantAttend(eventId)
    if (res.success) {
      setAttended(true)
      setCount(c => c + 1)
    } else if (res.alreadyAttending) {
      setAttended(true)
    } else {
      setError(res.error ?? 'Something went wrong. Try again.')
    }
    setBusy(false)
  }

  const handleClick = () => {
    if (!user) { setShowAuthModal(true); return }
    if (mode === 'instant') {
      doInstantAttend()
    } else {
      setShowForm(true)
    }
  }

  const handleUnattend = async () => {
    setBusy(true)
    const res = await unattend(eventId)
    if (res.success) {
      setAttended(false)
      setCount(c => Math.max(0, c - 1))
    }
    setBusy(false)
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        setName(data.user.user_metadata?.display_name ?? '')
        setEmail(data.user.email ?? '')
      }
      if (mode === 'instant') {
        doInstantAttend()
      } else {
        setShowForm(true)
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const result = await attendEvent(eventId, name, email, phone || null)
    if (result.alreadyRegistered || result.success) {
      setAttended(true)
      if (result.success) setCount(c => c + 1)
      setShowForm(false)
      // For paid events with a payment link, redirect after a short delay
      if (!isFree && paymentLink && result.success) {
        setTimeout(() => window.open(paymentLink, '_blank'), 500)
      }
    } else {
      setError(result.error ?? 'Failed to register. Please try again.')
    }
    setSubmitting(false)
  }

  if (loadingUser) {
    return (
      <div className="w-full h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
      </div>
    )
  }

  // ── Going state (instant mode) ─────────────────────────────
  if (attended && mode === 'instant') {
    return (
      <div className="space-y-1.5">
        <div className="w-full flex items-center justify-center gap-2.5 bg-emerald-50 text-emerald-700 font-semibold py-3.5 rounded-2xl border border-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          You&apos;re going! 🎉
        </div>
        <button
          onClick={handleUnattend}
          disabled={busy}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-500 py-2 transition-colors"
        >
          {busy
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <UserMinus className="w-3 h-3" />
          }
          Can&apos;t make it anymore
        </button>
      </div>
    )
  }

  // ── Registered state (rsvp / paid) ─────────────────────────
  if (attended) {
    return (
      <div className="w-full flex items-center justify-center gap-2.5 bg-emerald-50 text-emerald-700 font-semibold py-3.5 rounded-2xl border border-emerald-200 text-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        You&apos;re registered!
      </div>
    )
  }

  // ── CTA button ─────────────────────────────────────────────
  const btnConfig =
    mode === 'paid'
      ? { label: 'GET TICKETS', cls: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25', Icon: Ticket }
      : mode === 'rsvp'
      ? { label: 'REGISTER TO ATTEND', cls: 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20', Icon: UserCheck }
      : { label: 'ATTEND', cls: 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20', Icon: UserPlus }

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400'

  return (
    <>
      <button
        onClick={handleClick}
        disabled={busy}
        className={`w-full flex items-center justify-center gap-2.5 text-white font-bold py-3.5 rounded-2xl transition-all text-sm tracking-wide ${btnConfig.cls}`}
      >
        {busy
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <btnConfig.Icon className="w-4 h-4" />
        }
        {busy ? 'Please wait...' : btnConfig.label}
      </button>

      {error && <p className="text-red-500 text-xs text-center mt-1">{error}</p>}

      {/* Registration form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-900">
            {mode === 'paid' ? '🎟 Complete your registration' : '✏️ Confirm your spot'}
          </p>

          {mode === 'paid' && paymentLink && (
            <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
              After registering you&apos;ll be redirected to the payment page.
            </p>
          )}

          <input
            type="text"
            placeholder="Your full name *"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className={inputCls}
          />
          <input
            type="email"
            placeholder="Email address *"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={inputCls}
          />
          <input
            type="tel"
            placeholder="Phone number (optional)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className={inputCls}
          />

          {error && (
            <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError('') }}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors text-sm"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? 'Registering...' : mode === 'paid' ? 'Register & Pay →' : 'Confirm Spot'}
            </button>
          </div>
        </form>
      )}

      {/* Auth gate */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          title={
            mode === 'paid' ? 'Sign in to get tickets'
            : mode === 'rsvp' ? 'Sign in to register'
            : 'Sign in to attend'
          }
          subtitle={`Sign in or create a free account to attend "${eventTitle}"`}
        />
      )}
    </>
  )
}
