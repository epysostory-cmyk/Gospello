'use client'

import { useEffect, useState } from 'react'
import { Heart, UserCheck, Ticket, CheckCircle2 } from 'lucide-react'
import type { RegistrationType } from '@/types/database'

interface Props {
  eventId: string
  eventTitle: string
  eventDate: string
  eventUrl: string
  isFree: boolean
  rsvpRequired: boolean
  lifecycle: 'upcoming' | 'ongoing' | 'ended'
  attendanceCount?: number
  registrationType?: RegistrationType
  isOrganizer?: boolean
  initialAttended?: boolean
}

export default function EventQuickActions({
  eventId,
  isFree,
  rsvpRequired,
  lifecycle,
  attendanceCount = 0,
  registrationType,
  isOrganizer = false,
  initialAttended = false,
}: Props) {
  const [attended, setAttended] = useState(initialAttended)

  // Check localStorage on mount to restore guest/form-registered state
  useEffect(() => {
    if (initialAttended) return
    const attendedKey = `gospello_attended_${eventId}`
    const regIdKey    = `gospello_regid_${eventId}`
    if (localStorage.getItem(attendedKey) || localStorage.getItem(regIdKey)) {
      setAttended(true)
    }
  }, [eventId, initialAttended])

  // Sync with AttendButton when attendance is recorded in the same tab
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail?.eventId === eventId) setAttended(true)
    }
    window.addEventListener('gospello:attended', handler as EventListener)
    return () => window.removeEventListener('gospello:attended', handler as EventListener)
  }, [eventId])

  const handleRsvpClick = () => {
    const el = document.getElementById('attend')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const mode =
    registrationType === 'free_no_registration' ? 'instant'
    : registrationType === 'free_registration'  ? 'rsvp'
    : registrationType === 'paid'               ? 'paid'
    : !isFree ? 'paid'
    : rsvpRequired ? 'rsvp'
    : 'instant'

  let priceBadgeLabel: string
  let priceBadgeCls: string
  if (registrationType === 'free_no_registration' || (isFree && !rsvpRequired)) {
    priceBadgeLabel = 'Free'
    priceBadgeCls   = 'bg-emerald-100 text-emerald-700'
  } else if (registrationType === 'free_registration' || (isFree && rsvpRequired)) {
    priceBadgeLabel = 'Free'
    priceBadgeCls   = 'bg-emerald-100 text-emerald-700'
  } else {
    priceBadgeLabel = 'Paid'
    priceBadgeCls   = 'bg-blue-100 text-blue-700'
  }

  const rsvpConfig = {
    instant: { label: 'INTERESTED',       Icon: Heart,      cls: 'bg-indigo-600 hover:bg-indigo-700' },
    rsvp:    { label: 'REGISTER FREE',    Icon: UserCheck,  cls: 'bg-indigo-600 hover:bg-indigo-700' },
    paid:    { label: 'GET TICKETS',      Icon: Ticket,     cls: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' },
  }[mode]

  const rsvpButton = isOrganizer ? (
    <div className="flex-1 bg-gray-50 text-gray-400 font-semibold py-3 px-4 rounded-2xl text-center text-sm border border-gray-200">
      You&apos;re organizing this event
    </div>
  ) : lifecycle === 'ended' ? (
    <div className="flex-1 bg-gray-100 text-gray-400 font-semibold py-3 px-4 rounded-2xl text-center text-sm">
      Event Ended
    </div>
  ) : attended ? (
    <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 font-semibold py-3 px-4 rounded-2xl text-sm border border-emerald-200">
      <CheckCircle2 className="w-4 h-4" />
      {mode === 'instant' ? "You're going! 🎉" : "You're registered! 🎉"}
    </div>
  ) : (
    <button
      onClick={handleRsvpClick}
      className={`flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 px-4 rounded-2xl text-sm tracking-wide transition-all ${rsvpConfig.cls}`}
    >
      <rsvpConfig.Icon className="w-4 h-4" />
      {rsvpConfig.label}
    </button>
  )

  return (
    <>
      {/* Mobile Sticky Bottom Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: '72px' }}
      >
        <div className="flex items-center gap-2.5 px-4 h-full">
          {/* Price badge */}
          <div className="flex flex-col items-start flex-shrink-0 min-w-[56px]">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priceBadgeCls}`}>
              {priceBadgeLabel}
            </span>
          </div>

          {/* RSVP / Get Ticket CTA */}
          {rsvpButton}
        </div>
      </div>

      {/* Spacer so page content isn't hidden behind sticky bar */}
      <div className="h-[72px] md:hidden" />
    </>
  )
}
