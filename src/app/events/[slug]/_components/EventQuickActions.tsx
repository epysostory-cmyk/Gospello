'use client'

import { Share2, UserPlus, UserCheck, Ticket } from 'lucide-react'
import { useState } from 'react'
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
  eventTitle,
  eventDate,
  eventUrl,
  isFree,
  rsvpRequired,
  lifecycle,
  attendanceCount = 0,
  registrationType,
}: Props) {
  const [showShareMenu, setShowShareMenu] = useState(false)

  const handleRsvpClick = () => {
    const el = document.getElementById('attend')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // ?ref=wa forces WhatsApp to scrape a fresh URL (bypasses its og cache)
  const waShareUrl = `${eventUrl}?ref=wa`
  const waMessage = encodeURIComponent(
    `Hey 👋 I found this gospel event on Gospello!\n\n🎵 ${eventTitle}\n📅 ${eventDate}\n\nCheck it out 👉 ${waShareUrl}`
  )

  const mode = !isFree ? 'paid' : rsvpRequired ? 'rsvp' : 'instant'

  const rsvpConfig = {
    instant: { label: 'ATTEND',      Icon: UserPlus, cls: 'bg-indigo-600 hover:bg-indigo-700' },
    rsvp:    { label: 'REGISTER',    Icon: UserCheck, cls: 'bg-indigo-600 hover:bg-indigo-700' },
    paid:    { label: 'GET TICKETS', Icon: Ticket,   cls: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' },
  }[mode]

  let priceBadgeLabel: string
  let priceBadgeCls: string
  if (registrationType === 'free_no_registration' || (isFree && !rsvpRequired)) {
    priceBadgeLabel = 'Free'
    priceBadgeCls = 'bg-emerald-100 text-emerald-700'
  } else if (registrationType === 'free_registration' || (isFree && rsvpRequired)) {
    priceBadgeLabel = 'Free + Reg'
    priceBadgeCls = 'bg-amber-100 text-amber-800'
  } else {
    priceBadgeLabel = 'Paid'
    priceBadgeCls = 'bg-blue-100 text-blue-700'
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

          {/* Share */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Share event"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>

            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                <div className="absolute bottom-[56px] right-0 z-50 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden min-w-[170px]">
                  <a
                    href={`https://wa.me/?text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShareMenu(false)}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 text-sm font-medium text-gray-700 border-b border-gray-50"
                  >
                    <span className="text-xl">💬</span>
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`https://x.com/intent/tweet?text=${encodeURIComponent(eventTitle)}&url=${encodeURIComponent(eventUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShareMenu(false)}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-100 text-sm font-medium text-gray-700 border-b border-gray-50"
                  >
                    <span className="text-xl font-bold">𝕏</span>
                    <span>X (Twitter)</span>
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(eventUrl)
                      setShowShareMenu(false)
                    }}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 text-sm font-medium text-gray-700 w-full"
                  >
                    <span className="text-xl">📋</span>
                    <span>Copy Link</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Spacer so page content isn't hidden behind sticky bar */}
      <div className="h-[72px] md:hidden" />
    </>
  )
}
