'use client'

import { Share2, Heart, Loader2, UserPlus, UserCheck, Ticket } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toggleSaveEvent } from '@/app/actions/saved-events'
import AuthModal from '@/components/ui/AuthModal'
import type { User } from '@supabase/supabase-js'

interface Props {
  eventId: string
  eventTitle: string
  eventDate: string
  eventUrl: string
  initialSaved?: boolean
  isFree: boolean
  rsvpRequired: boolean
  lifecycle: 'upcoming' | 'ongoing' | 'ended'
}

export default function EventQuickActions({
  eventId,
  eventTitle,
  eventDate,
  eventUrl,
  initialSaved = false,
  isFree,
  rsvpRequired,
  lifecycle,
}: Props) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [savingEvent, setSavingEvent] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const handleSave = async () => {
    if (!user) { setShowAuthModal(true); return }
    setSavingEvent(true)
    const result = await toggleSaveEvent(eventId)
    if (result.success) setIsSaved(result.isSaved)
    setSavingEvent(false)
  }

  // Scroll to the AttendButton on the page
  const handleRsvpClick = () => {
    const el = document.getElementById('attend')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const whatsappText = encodeURIComponent(
    `${eventTitle} • ${eventDate} • ${eventUrl}`
  )

  // Determine mode for button label
  const mode = !isFree ? 'paid' : rsvpRequired ? 'rsvp' : 'instant'

  const rsvpConfig = {
    instant: { label: 'ATTEND', Icon: UserPlus, cls: 'bg-indigo-600 hover:bg-indigo-700' },
    rsvp:    { label: 'REGISTER', Icon: UserCheck, cls: 'bg-indigo-600 hover:bg-indigo-700' },
    paid:    { label: 'GET TICKETS', Icon: Ticket, cls: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' },
  }[mode]

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
      {/* ── Mobile Sticky Bottom Bar ───────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center gap-2.5 px-4 py-3">
          {/* RSVP / Get Ticket CTA (takes most space) */}
          {rsvpButton}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={savingEvent}
            className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all ${
              isSaved
                ? 'bg-red-50 border border-red-200'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title={isSaved ? 'Unsave' : 'Save event'}
          >
            {savingEvent
              ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              : <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            }
          </button>

          {/* Share */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Share event"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>

            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                <div className="absolute bottom-[56px] right-0 z-50 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden min-w-[170px]">
                  <a
                    href={`https://wa.me/?text=${whatsappText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShareMenu(false)}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 text-sm font-medium text-gray-700 border-b border-gray-50"
                  >
                    <span className="text-xl">💬</span>
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(eventTitle)}&url=${encodeURIComponent(eventUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShareMenu(false)}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-sky-50 text-sm font-medium text-gray-700 border-b border-gray-50"
                  >
                    <span className="text-xl">🐦</span>
                    <span>Twitter / X</span>
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

      {/* Auth modal (for save) */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false)
            const supabase = createClient()
            supabase.auth.getUser().then(({ data }) => setUser(data.user))
          }}
          title="Save Event"
          subtitle={`Sign in to save "${eventTitle}" to your list`}
        />
      )}
    </>
  )
}
