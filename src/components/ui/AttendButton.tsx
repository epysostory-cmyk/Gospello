'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, UserPlus, UserMinus, UserCheck, Ticket, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { instantAttend, unattend } from '@/app/actions/attendance'
import { registerForEvent, confirmPayment } from '@/app/actions/registrations'
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
  /** Server-side user info — skips the client-side auth fetch so button renders immediately */
  serverUserId?: string | null
  serverUserName?: string | null
  serverUserEmail?: string | null
}

export default function AttendButton({
  eventId,
  eventTitle,
  isFree,
  rsvpRequired,
  paymentLink,
  initialCount = 0,
  initialAttended = false,
  serverUserId,
  serverUserName,
  serverUserEmail,
}: Props) {
  const [user, setUser] = useState<User | null>(null)
  // If we got server-side user data, skip the loading state entirely
  const [loadingUser, setLoadingUser] = useState(!serverUserId && serverUserId !== null ? true : serverUserId === undefined)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [attended, setAttended] = useState(initialAttended)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Registration form state — pre-filled from server props when available
  const [name, setName] = useState(serverUserName ?? '')
  const [email, setEmail] = useState(serverUserEmail ?? '')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Post-registration state
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [ticketPdfBase64, setTicketPdfBase64] = useState<string | null>(null)
  const [ticketNumber, setTicketNumber] = useState<number | null>(null)
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const [ticketConfirmed, setTicketConfirmed] = useState(false)

  useEffect(() => {
    // Skip the auth fetch if the server already told us the user state
    if (serverUserId !== undefined) {
      // serverUserId = string means logged in; null means logged out
      if (serverUserId) {
        setUser({ id: serverUserId } as User)
      }
      setLoadingUser(false)
      return
    }
    // Fallback: fetch client-side (e.g. when used outside the event page)
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
  // • rsvp    — free but registration required → fill form + instant ticket
  // • paid    — paid event → fill form + payment redirect + confirm
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
      if (data.user) {
        setUser(data.user)
        if (!name) setName(data.user.user_metadata?.display_name ?? '')
        if (!email) setEmail(data.user.email ?? '')
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

    const regType = mode === 'paid' ? 'paid' : 'free_registration'
    const result = await registerForEvent(eventId, name, email, regType)

    if (result.alreadyRegistered) {
      setAttended(true)
      setShowForm(false)
      setSubmitting(false)
      return
    }

    if (result.success) {
      setAttended(true)
      setCount(c => c + 1)
      setShowForm(false)
      setRegistrationId(result.registrationId ?? null)
      setTicketNumber(result.ticketNumber ?? null)

      if (mode === 'rsvp') {
        // Free registration — ticket is ready now
        setTicketPdfBase64(result.ticketPdfBase64 ?? null)
      } else if (mode === 'paid') {
        // Paid — open payment link, then show confirmation step
        if (paymentLink) {
          setTimeout(() => window.open(paymentLink, '_blank'), 400)
        }
        setShowPaymentConfirm(true)
      }
    } else {
      setError(result.error ?? 'Failed to register. Please try again.')
    }

    setSubmitting(false)
  }

  const handleConfirmPayment = async () => {
    if (!registrationId) return
    setConfirmingPayment(true)
    setError('')
    const result = await confirmPayment(registrationId)
    if (result.success) {
      setTicketPdfBase64(result.ticketPdfBase64 ?? null)
      setTicketNumber(result.ticketNumber ?? null)
      setShowPaymentConfirm(false)
      setTicketConfirmed(true)
    } else {
      setError(result.error ?? 'Could not confirm payment. Please try again.')
    }
    setConfirmingPayment(false)
  }

  const downloadTicket = () => {
    if (!ticketPdfBase64) return
    const ticketStr = String(ticketNumber ?? 1).padStart(4, '0')
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${ticketPdfBase64}`
    link.download = `gospello-ticket-${ticketStr}.pdf`
    link.click()
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
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
          Can&apos;t make it anymore
        </button>
      </div>
    )
  }

  // ── Registered state — rsvp with ticket ready ───────────────
  if (attended && mode === 'rsvp' && ticketPdfBase64) {
    return (
      <div className="space-y-2">
        <div className="w-full flex items-center justify-center gap-2.5 bg-emerald-50 text-emerald-700 font-semibold py-3.5 rounded-2xl border border-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          You&apos;re registered! 🎉
        </div>
        <p className="text-center text-xs text-gray-500">Your ticket has been emailed to you.</p>
        <button
          onClick={downloadTicket}
          className="w-full flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 font-medium py-2.5 rounded-xl hover:bg-indigo-50 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Download Ticket {ticketNumber ? `#${String(ticketNumber).padStart(4, '0')}` : ''}
        </button>
      </div>
    )
  }

  // ── Registered state — rsvp, no ticket yet (fallback) ───────
  if (attended && mode === 'rsvp') {
    return (
      <div className="w-full flex items-center justify-center gap-2.5 bg-emerald-50 text-emerald-700 font-semibold py-3.5 rounded-2xl border border-emerald-200 text-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        You&apos;re registered!
      </div>
    )
  }

  // ── Paid: ticket confirmed ───────────────────────────────────
  if (attended && mode === 'paid' && ticketConfirmed && ticketPdfBase64) {
    return (
      <div className="space-y-2">
        <div className="w-full flex items-center justify-center gap-2.5 bg-emerald-50 text-emerald-700 font-semibold py-3.5 rounded-2xl border border-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          Payment confirmed! Ticket issued 🎟
        </div>
        <p className="text-center text-xs text-gray-500">Your ticket has been emailed to you.</p>
        <button
          onClick={downloadTicket}
          className="w-full flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 font-medium py-2.5 rounded-xl hover:bg-indigo-50 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Download Ticket {ticketNumber ? `#${String(ticketNumber).padStart(4, '0')}` : ''}
        </button>
      </div>
    )
  }

  // ── Paid: awaiting payment confirmation ──────────────────────
  if (attended && mode === 'paid' && showPaymentConfirm) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 mb-1">Complete your payment 💳</p>
          <p className="text-xs text-amber-700">
            You&apos;ve been registered. After completing payment on the payment page,
            tap the button below to receive your ticket.
          </p>
        </div>
        {paymentLink && (
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            <Ticket className="w-4 h-4" />
            Go to Payment Page →
          </a>
        )}
        <button
          onClick={handleConfirmPayment}
          disabled={confirmingPayment}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {confirmingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
          {confirmingPayment ? 'Confirming...' : "I've completed payment — get my ticket"}
        </button>
        {error && <p className="text-red-600 text-xs text-center">{error}</p>}
      </div>
    )
  }

  // ── Paid: registered, awaiting (no payment confirm panel) ────
  if (attended && mode === 'paid') {
    return (
      <div className="w-full flex items-center justify-center gap-2.5 bg-emerald-50 text-emerald-700 font-semibold py-3.5 rounded-2xl border border-emerald-200 text-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        Registered — awaiting payment
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

          {mode === 'rsvp' && (
            <p className="text-xs text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
              Your ticket will be emailed to you after registration.
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
