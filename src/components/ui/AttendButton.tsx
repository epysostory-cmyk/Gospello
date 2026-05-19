'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, UserPlus, UserMinus, UserCheck, Ticket, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { instantAttend, unattend, anonymousAttend } from '@/app/actions/attendance'
import { registerForEvent, regenerateTicket } from '@/app/actions/registrations'
import type { User } from '@supabase/supabase-js'
import HaveAnEventCTA from './HaveAnEventCTA'
import AddToCalendar from './AddToCalendar'

interface Props {
  eventId: string
  eventTitle: string
  isFree: boolean
  rsvpRequired: boolean
  /** Authoritative registration type from DB — takes precedence over isFree/rsvpRequired when present */
  registrationType?: 'free_no_registration' | 'free_registration' | 'paid' | null
  paymentLink?: string | null
  initialCount?: number
  initialAttended?: boolean
  /** Server-side user info — skips the client-side auth fetch so button renders immediately */
  serverUserId?: string | null
  serverUserName?: string | null
  serverUserEmail?: string | null
  /** True when the current user is the organizer of this event — hide the button */
  isOrganizer?: boolean
  /** True for online/virtual events — changes CTA copy */
  isOnline?: boolean
  /** Post-RSVP nudge data — enables calendar + WhatsApp prompts after attendance */
  eventSlug?: string
  eventStartDate?: string
  eventEndDate?: string | null
  eventLocation?: string
  eventDescription?: string | null
}

function PostRsvpNudge({
  eventTitle, eventSlug, eventStartDate, eventEndDate, eventLocation, eventDescription, isOnline,
}: {
  eventTitle: string
  eventSlug?: string
  eventStartDate?: string
  eventEndDate?: string | null
  eventLocation?: string
  eventDescription?: string | null
  isOnline?: boolean
}) {
  if (!eventSlug || !eventStartDate) return null

  const siteUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://gospello.com'
  const eventUrl = `${siteUrl}/events/${eventSlug}`

  const dateLabel = new Date(eventStartDate).toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const venueLabel = isOnline ? 'online' : (eventLocation || '')
  const waText = `Hey! I'm going to ${eventTitle} on ${dateLabel}${venueLabel ? ` at ${venueLabel}` : ''}. You should come too — ${eventUrl}?ref=wa`
  const waHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      <p className="text-xs font-semibold text-gray-500 text-center">You&apos;re in — what&apos;s next?</p>
      <AddToCalendar
        title={eventTitle}
        startDate={eventStartDate}
        endDate={eventEndDate}
        location={eventLocation ?? ''}
        description={eventDescription}
      />
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ fill: '#25D366' }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Invite a friend on WhatsApp
      </a>
    </div>
  )
}

export default function AttendButton({
  eventId,
  eventTitle,
  isFree,
  rsvpRequired,
  registrationType,
  paymentLink,
  initialCount = 0,
  initialAttended = false,
  serverUserId,
  serverUserName,
  serverUserEmail,
  isOrganizer = false,
  isOnline = false,
  eventSlug,
  eventStartDate,
  eventEndDate,
  eventLocation,
  eventDescription,
}: Props) {
  const [user, setUser] = useState<User | null>(null)
  // If we got server-side user data, skip the loading state entirely
  const [loadingUser, setLoadingUser] = useState(!serverUserId && serverUserId !== null ? true : serverUserId === undefined)
  const [showForm, setShowForm] = useState(false)
  // Start with server-authoritative value; useEffect corrects for guests using localStorage
  const [attended, setAttended] = useState(initialAttended)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Registration form state — pre-filled from server props when available
  const [name, setName] = useState(serverUserName ?? '')
  const [email, setEmail] = useState(serverUserEmail ?? '')
  const [submitting, setSubmitting] = useState(false)

  // Post-registration state (free events only)
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [ticketPdfBase64, setTicketPdfBase64] = useState<string | null>(null)
  const [ticketNumber, setTicketNumber] = useState<number | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  // Paid event state — simple redirect, no ticket
  const [paidSent, setPaidSent] = useState(false)


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

  // After hydration, read localStorage to restore guest/form-registered state.
  // This MUST be a useEffect — useState initialisers run on the server where
  // window/localStorage don't exist, so SSR always returns false regardless.
  useEffect(() => {
    if (initialAttended) return // logged-in user already resolved server-side
    const attended  = localStorage.getItem(`gospello_attended_${eventId}`)
    const regId     = localStorage.getItem(`gospello_regid_${eventId}`)
    const ticketNum = localStorage.getItem(`gospello_ticketnum_${eventId}`)
    const savedEmail = localStorage.getItem(`gospello_email_${eventId}`)
    if (attended || regId) {
      setAttended(true)
      if (regId)       setRegistrationId(regId)
      if (ticketNum)   setTicketNumber(Number(ticketNum))
      if (savedEmail && !serverUserEmail) setEmail(savedEmail)
    }
  }, [eventId, initialAttended, serverUserEmail])

  // Determine which attendance mode applies.
  // registration_type is the source of truth when explicitly set; fall back to is_free/rsvp_required for older events.
  // • instant — free, no registration required → one-tap attend
  // • rsvp    — free but registration required → fill form + instant ticket
  // • paid    — paid event → fill form + payment redirect + confirm
  const mode: 'instant' | 'rsvp' | 'paid' =
    registrationType === 'free_no_registration' ? 'instant'
    : registrationType === 'free_registration' ? 'rsvp'
    : registrationType === 'paid' ? 'paid'
    : !isFree ? 'paid'
    : rsvpRequired ? 'rsvp'
    : 'instant'

  // Guest one-tap is ONLY allowed when the organiser explicitly chose "Free — No Registration".
  // For legacy events (registration_type null) or any rsvp mode, guests always see the form.
  const guestCanOneTap = registrationType === 'free_no_registration'

  const notifyAttended = (id: string) => {
    window.dispatchEvent(new CustomEvent('gospello:attended', { detail: { eventId: id } }))
  }

  const doInstantAttend = async () => {
    setBusy(true)
    setError('')
    const res = await instantAttend(eventId)
    if (res.success) {
      setAttended(true)
      setCount(c => c + 1)
      notifyAttended(eventId)
    } else if (res.alreadyAttending) {
      setAttended(true)
      notifyAttended(eventId)
    } else {
      setError(res.error ?? 'Something went wrong. Try again.')
    }
    setBusy(false)
  }

  const doAnonymousAttend = async () => {
    setBusy(true)
    setError('')
    // Guard against double-tap from the same browser
    const key = `gospello_attended_${eventId}`
    if (typeof window !== 'undefined' && localStorage.getItem(key)) {
      setAttended(true)
      setBusy(false)
      return
    }
    const res = await anonymousAttend(eventId)
    if (res.success) {
      setAttended(true)
      setCount(c => c + 1)
      if (typeof window !== 'undefined') localStorage.setItem(key, '1')
      notifyAttended(eventId)
    } else {
      setError(res.error ?? 'Something went wrong. Try again.')
    }
    setBusy(false)
  }

  const handleClick = () => {
    if (mode === 'instant') {
      if (user) {
        doInstantAttend()
      } else if (guestCanOneTap) {
        // Explicitly free-no-registration: guest one-tap, no form
        doAnonymousAttend()
      } else {
        // Legacy event without explicit registration_type: show form so guest can enter name+email
        setShowForm(true)
      }
    } else {
      // rsvp or paid: always show name+email form
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Client-side name validation
    const trimmedName = name.trim()
    if (trimmedName.includes('@')) {
      setError('Please enter your real name, not an email address.')
      setSubmitting(false)
      return
    }
    if (trimmedName.length < 2) {
      setError('Please enter your full name.')
      setSubmitting(false)
      return
    }
    const words = trimmedName.split(/\s+/).filter(Boolean)
    if (words.length < 2) {
      setError('Please enter your full name (first and last name).')
      setSubmitting(false)
      return
    }
    if (/^[0-9\s]+$/.test(trimmedName)) {
      setError('Please enter a valid name.')
      setSubmitting(false)
      return
    }

    const regType = mode === 'paid' ? 'paid' : mode === 'instant' ? 'free_no_registration' : 'free_registration'
    const result = await registerForEvent(eventId, name, email, regType)

    if (result.alreadyRegistered) {
      setAttended(true)
      setShowForm(false)
      // Restore any saved regId/ticketNumber from localStorage so re-download works
      const savedRegId = localStorage.getItem(`gospello_regid_${eventId}`)
      const savedTicketNum = localStorage.getItem(`gospello_ticketnum_${eventId}`)
      if (savedRegId) setRegistrationId(savedRegId)
      if (savedTicketNum) setTicketNumber(Number(savedTicketNum))
      setError('You already registered with this email. Check your inbox for your ticket.')
      setSubmitting(false)
      return
    }

    if (result.success) {
      setAttended(true)
      setCount(c => c + 1)
      setShowForm(false)
      setRegistrationId(result.registrationId ?? null)
      setTicketNumber(result.ticketNumber ?? null)
      notifyAttended(eventId)
      // Persist so the button stays in "registered" state after a page refresh
      if (typeof window !== 'undefined') {
        if (result.registrationId) localStorage.setItem(`gospello_regid_${eventId}`, result.registrationId)
        if (result.ticketNumber)    localStorage.setItem(`gospello_ticketnum_${eventId}`, String(result.ticketNumber))
        localStorage.setItem(`gospello_email_${eventId}`, email.trim().toLowerCase())
      }

      if (mode === 'rsvp') {
        // Free registration — ticket generated immediately
        setTicketPdfBase64(result.ticketPdfBase64 ?? null)
      } else if (mode === 'paid') {
        // Paid — open payment link directly, Gospello's job is done
        if (paymentLink) window.open(paymentLink, '_blank')
        setPaidSent(true)
      }
    } else {
      setError(result.error ?? 'Failed to register. Please try again.')
    }

    setSubmitting(false)
  }

  const downloadTicket = (base64?: string | null, num?: number | null) => {
    const pdf = base64 ?? ticketPdfBase64
    if (!pdf) return
    const ticketStr = String(num ?? ticketNumber ?? 1).padStart(4, '0')
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${pdf}`
    link.download = `gospello-ticket-${ticketStr}.pdf`
    link.click()
  }

  const handleRedownload = async () => {
    if (!registrationId) return
    setRegenerating(true)
    setError('')
    const result = await regenerateTicket(registrationId, email)
    if (result.success && result.ticketPdfBase64) {
      setTicketPdfBase64(result.ticketPdfBase64)
      setTicketNumber(result.ticketNumber ?? ticketNumber)
      downloadTicket(result.ticketPdfBase64, result.ticketNumber ?? ticketNumber)
    } else {
      setError(result.error ?? 'Could not retrieve ticket. Please try again.')
    }
    setRegenerating(false)
  }

  // ── Organizer: cannot attend their own event ──────────────
  if (isOrganizer) {
    return (
      <div className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-500 font-medium py-3.5 rounded-2xl border border-gray-200 text-sm">
        <UserCheck className="w-4 h-4" />
        You&apos;re organizing this event
      </div>
    )
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
          {isOnline ? "You're in! 🎉" : "You're going! 🎉"}
        </div>
        <PostRsvpNudge
          eventTitle={eventTitle}
          eventSlug={eventSlug}
          eventStartDate={eventStartDate}
          eventEndDate={eventEndDate}
          eventLocation={eventLocation}
          eventDescription={eventDescription}
          isOnline={isOnline}
        />
        {user && (
          <button
            onClick={handleUnattend}
            disabled={busy}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-500 py-2 transition-colors"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
            Can&apos;t make it anymore
          </button>
        )}
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
        <button
          onClick={() => downloadTicket()}
          className="w-full flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 font-medium py-2.5 rounded-xl hover:bg-indigo-50 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Download Ticket {ticketNumber ? `#${String(ticketNumber).padStart(4, '0')}` : ''}
        </button>
        <PostRsvpNudge
          eventTitle={eventTitle}
          eventSlug={eventSlug}
          eventStartDate={eventStartDate}
          eventEndDate={eventEndDate}
          eventLocation={eventLocation}
          eventDescription={eventDescription}
          isOnline={isOnline}
        />
        <HaveAnEventCTA compact />
      </div>
    )
  }

  // ── Registered state — rsvp, no ticket in memory (refresh fallback) ──
  if (attended && mode === 'rsvp') {
    return (
      <div className="space-y-2">
        <div className="w-full flex items-center justify-center gap-2.5 bg-emerald-50 text-emerald-700 font-semibold py-3.5 rounded-2xl border border-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          You&apos;re registered! 🎉
        </div>
        {registrationId && (
          <button
            onClick={handleRedownload}
            disabled={regenerating}
            className="w-full flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 font-medium py-2.5 rounded-xl hover:bg-indigo-50 disabled:opacity-60 transition-colors text-sm"
          >
            {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {regenerating ? 'Getting ticket...' : `Download Ticket${ticketNumber ? ` #${String(ticketNumber).padStart(4, '0')}` : ''}`}
          </button>
        )}
        <PostRsvpNudge
          eventTitle={eventTitle}
          eventSlug={eventSlug}
          eventStartDate={eventStartDate}
          eventEndDate={eventEndDate}
          eventLocation={eventLocation}
          eventDescription={eventDescription}
          isOnline={isOnline}
        />
        {error && <p className="text-red-600 text-xs text-center">{error}</p>}
      </div>
    )
  }

  // ── Paid: redirected to payment page ────────────────────────
  if (mode === 'paid' && paidSent) {
    return (
      <div className="space-y-2.5">
        <div className="w-full flex items-center justify-center gap-2.5 bg-emerald-50 text-emerald-700 font-semibold py-3.5 rounded-2xl border border-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          Payment page opened
        </div>
        <p className="text-center text-xs text-gray-400 leading-relaxed">
          Complete your payment there to secure your spot.
        </p>
        {paymentLink && (
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            <Ticket className="w-4 h-4" />
            Open payment page again
          </a>
        )}
      </div>
    )
  }

  // ── CTA button ─────────────────────────────────────────────
  const btnConfig =
    mode === 'paid'
      ? { label: 'GET TICKETS', cls: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25', Icon: Ticket }
      : mode === 'rsvp'
      ? { label: 'REGISTER FOR FREE', cls: 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20', Icon: UserCheck }
      : { label: isOnline ? 'COUNT ME IN' : "I'M GOING", cls: 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20', Icon: UserPlus }

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

      {error && !showForm && (
        <p className="text-amber-700 text-xs bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg mt-2 text-center">{error}</p>
      )}

      {/* Registration form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-900">
            {mode === 'paid' ? 'Enter your details to continue' : 'Confirm your spot'}
          </p>

          {mode === 'paid' && paymentLink && (
            <p className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
              You&apos;ll go straight to the payment page after this.
            </p>
          )}

          {mode === 'rsvp' && (
            <p className="text-xs text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
              Your ticket will be ready to download immediately after you register.
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
              {submitting ? 'Please wait...' : mode === 'paid' ? 'Go to Payment →' : 'Confirm Spot'}
            </button>
          </div>
        </form>
      )}

    </>
  )
}
