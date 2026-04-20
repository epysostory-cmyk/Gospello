'use client'

import { UserPlus, UserCheck, Ticket } from 'lucide-react'
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
}

export default function EventQuickActions({
  isFree,
  rsvpRequired,
  lifecycle,
  attendanceCount = 0,
  registrationType,
}: Props) {

  const handleRsvpClick = () => {
    const el = document.getElementById('attend')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const mode = !isFree ? 'paid' : rsvpRequired ? 'rsvp' : 'instant'

  const rsvpConfig = {
    instant: { label: 'ATTEND',      Icon: UserPlus,  cls: 'bg-indigo-600 hover:bg-indigo-700' },
    rsvp:    { label: 'REGISTER',    Icon: UserCheck, cls: 'bg-indigo-600 hover:bg-indigo-700' },
    paid:    { label: 'GET TICKETS', Icon: Ticket,    cls: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' },
  }[mode]

  let priceBadgeLabel: string
  let priceBadgeCls: string
  if (registrationType === 'free_no_registration' || (isFree && !rsvpRequired)) {
    priceBadgeLabel = 'Free'
    priceBadgeCls   = 'bg-emerald-100 text-emerald-700'
  } else if (registrationType === 'free_registration' || (isFree && rsvpRequired)) {
    priceBadgeLabel = 'Free + Reg'
    priceBadgeCls   = 'bg-amber-100 text-amber-800'
  } else {
    priceBadgeLabel = 'Paid'
    priceBadgeCls   = 'bg-blue-100 text-blue-700'
  }

  const rsvpButton = lifecycle === 'ended' ? (
    <div className="flex-1 bg-gray-100 text-gray-400 font-semibold py-3 px-4 rounded-2xl text-center text-sm">
      Event Ended
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
          {/* Price badge + attendee count */}
          <div className="flex flex-col items-start flex-shrink-0 min-w-[56px]">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priceBadgeCls}`}>
              {priceBadgeLabel}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              {attendanceCount > 0 ? `${attendanceCount} attending` : 'Be first!'}
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
