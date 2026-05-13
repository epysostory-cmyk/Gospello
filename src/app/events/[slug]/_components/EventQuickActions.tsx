'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Ticket, UserCheck, Heart } from 'lucide-react'
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
  registrationType,
  isOrganizer = false,
  initialAttended = false,
}: Props) {
  const [attended, setAttended] = useState(initialAttended)

  useEffect(() => {
    if (initialAttended) return
    const attendedKey = `gospello_attended_${eventId}`
    const regIdKey    = `gospello_regid_${eventId}`
    if (localStorage.getItem(attendedKey) || localStorage.getItem(regIdKey)) {
      setAttended(true)
    }
  }, [eventId, initialAttended])

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

  if (lifecycle === 'ended') {
    return (
      <>
        <div
          className="fixed bottom-0 left-0 right-0 md:hidden z-40 px-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', paddingTop: '8px' }}
        >
          <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl px-5 py-3.5 text-center text-sm font-medium text-gray-400 shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
            This event has ended
          </div>
        </div>
        <div className="h-20 md:hidden" />
      </>
    )
  }

  if (isOrganizer) {
    return (
      <>
        <div
          className="fixed bottom-0 left-0 right-0 md:hidden z-40 px-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', paddingTop: '8px' }}
        >
          <div className="bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl px-5 py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
            <UserCheck className="w-4 h-4" />
            You&apos;re organizing this event
          </div>
        </div>
        <div className="h-20 md:hidden" />
      </>
    )
  }

  if (attended) {
    return (
      <>
        <div
          className="fixed bottom-0 left-0 right-0 md:hidden z-40 px-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', paddingTop: '8px' }}
        >
          <div className="bg-emerald-600 rounded-2xl px-5 py-3.5 flex items-center justify-center gap-2.5 text-white font-bold text-sm shadow-[0_8px_32px_rgba(5,150,105,0.35)]">
            <CheckCircle2 className="w-5 h-5" />
            {mode === 'instant' ? "You're going! 🎉" : "You're registered! 🎉"}
          </div>
        </div>
        <div className="h-20 md:hidden" />
      </>
    )
  }

  /* Determine CTA label + style */
  const cta =
    mode === 'paid'
      ? {
          label: 'GET TICKETS',
          cls: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_8px_32px_rgba(245,158,11,0.40)]',
          Icon: Ticket,
        }
      : mode === 'rsvp'
      ? {
          label: 'REGISTER FREE',
          cls: 'bg-indigo-600 shadow-[0_8px_32px_rgba(99,102,241,0.35)]',
          Icon: UserCheck,
        }
      : {
          label: 'I\'M GOING',
          cls: 'bg-indigo-600 shadow-[0_8px_32px_rgba(99,102,241,0.35)]',
          Icon: Heart,
        }

  return (
    <>
      {/* Floating action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 md:hidden z-40 px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', paddingTop: '8px' }}
      >
        <button
          onClick={handleRsvpClick}
          className={`w-full flex items-center justify-center gap-2.5 text-white font-black py-4 rounded-2xl text-[15px] tracking-wide transition-all active:scale-[0.98] ${cta.cls}`}
        >
          <cta.Icon className="w-5 h-5" />
          {cta.label}
        </button>
      </div>

      {/* Spacer so content isn't hidden behind bar */}
      <div className="h-[72px] md:hidden" />
    </>
  )
}
