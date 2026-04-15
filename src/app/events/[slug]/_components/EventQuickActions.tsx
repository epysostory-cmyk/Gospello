'use client'

import { Share2, Heart, Loader2 } from 'lucide-react'
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
  externalLink?: string | null
  lifecycle: 'upcoming' | 'ongoing' | 'ended'
}

export default function EventQuickActions({
  eventId,
  eventTitle,
  eventDate,
  eventUrl,
  initialSaved = false,
  isFree,
  externalLink,
  lifecycle,
}: Props) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [savingEvent, setSavingEvent] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase.auth])

  const handleSave = async () => {
    if (!user) { setShowAuthModal(true); return }
    setSavingEvent(true)
    const result = await toggleSaveEvent(eventId)
    if (result.success) setIsSaved(result.isSaved)
    setSavingEvent(false)
  }

  const whatsappText = encodeURIComponent(`Check out: ${eventTitle} • ${eventDate} • ${eventUrl}`)
  const twitterText = encodeURIComponent(eventTitle)

  const rsvpButton = lifecycle === 'ended' ? (
    <div className="flex-1 bg-gray-100 text-gray-500 font-semibold py-3 px-4 rounded-xl text-center text-sm">
      Event Ended
    </div>
  ) : !isFree && externalLink ? (
    <a
      href={externalLink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-xl text-center text-sm transition-colors"
    >
      Get Ticket
    </a>
  ) : (
    <a
      href="#attend"
      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-center text-sm transition-colors"
    >
      Register
    </a>
  )

  return (
    <>
      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center gap-2 px-3 py-3">

          {/* RSVP / Get Ticket (full width) */}
          {rsvpButton}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={savingEvent}
            className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl transition-colors ${
              isSaved ? 'bg-red-50 border border-red-200' : 'bg-gray-100 hover:bg-gray-200'
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
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Share event"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>

            {showShareMenu && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                {/* Menu */}
                <div className="absolute bottom-14 right-0 z-50 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden min-w-[160px]">
                  <a
                    href={`https://wa.me/?text=${whatsappText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShareMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-sm font-medium text-gray-700 border-b border-gray-100"
                  >
                    <span className="text-lg">💬</span> WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(eventUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShareMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-sky-50 text-sm font-medium text-gray-700 border-b border-gray-100"
                  >
                    <span className="text-lg">🐦</span> Twitter
                  </a>
                  <button
                    onClick={() => { navigator.clipboard.writeText(eventUrl); setShowShareMenu(false) }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700 w-full"
                  >
                    <span className="text-lg">📋</span> Copy Link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Spacer so content isn't hidden behind sticky bar */}
      <div className="h-20 md:hidden" />

      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false)
            supabase.auth.getUser().then(({ data }) => setUser(data.user))
          }}
          title="Save Event"
          subtitle={`Sign in to save "${eventTitle}" to your list`}
        />
      )}
    </>
  )
}
