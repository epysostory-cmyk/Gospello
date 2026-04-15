'use client'

import { Heart, Share2, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import SaveButton from '@/components/ui/SaveButton'

interface Props {
  eventId: string
  eventTitle: string
  eventDate: string
  eventUrl: string
  initialSaved?: boolean
  isFree: boolean
  externalLink?: string | null
  lifecycle: 'upcoming' | 'ongoing' | 'ended'
  attendanceCount?: number
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
  attendanceCount = 0,
}: Props) {
  const [showShareMenu, setShowShareMenu] = useState(false)

  const whatsappText = encodeURIComponent(`Check out: ${eventTitle} • ${eventDate} • ${eventUrl}`)
  const twitterText = encodeURIComponent(eventTitle)

  // On mobile (< md), show sticky bottom bar
  // On desktop (md+), show in sidebar (via parent)
  return (
    <>
      {/* Mobile Sticky Bottom Bar (< md) */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 safe-area-inset-bottom z-40">
        <div className="flex gap-2 p-3 max-w-full">
          {/* RSVP Button - Full Width */}
          {lifecycle !== 'ended' ? (
            isFree ? (
              <a
                href={`#attend`}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-center text-sm"
              >
                Register
              </a>
            ) : externalLink ? (
              <a
                href={externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-center text-sm"
              >
                Get Ticket
              </a>
            ) : (
              <div className="flex-1 bg-gray-100 text-gray-600 font-semibold py-3 px-4 rounded-xl text-center text-sm">
                Ended
              </div>
            )
          ) : (
            <div className="flex-1 bg-gray-100 text-gray-600 font-semibold py-3 px-4 rounded-xl text-center text-sm">
              Ended
            </div>
          )}

          {/* Save Button - Icon */}
          <div className="w-12">
            <button
              onClick={() => {
                // Trigger SaveButton logic via ref if needed
                // For now, just show that it's clickable
              }}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Save event"
            >
              <Heart className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Share Menu - Icon */}
          <div className="relative w-12">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Share event"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>

            {/* Share Menu Dropdown */}
            {showShareMenu && (
              <div className="absolute bottom-14 right-0 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
                <a
                  href={`https://wa.me/?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2 px-4 py-3 hover:bg-green-50 text-sm font-medium text-gray-700 border-b border-gray-100 whitespace-nowrap"
                >
                  <span className="text-lg">💬</span> WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(eventUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2 px-4 py-3 hover:bg-sky-50 text-sm font-medium text-gray-700 border-b border-gray-100 whitespace-nowrap"
                >
                  <span className="text-lg">🐦</span> Twitter
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(eventUrl)
                    setShowShareMenu(false)
                  }}
                  className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700 w-full text-left whitespace-nowrap"
                >
                  <span className="text-lg">📋</span> Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add padding to prevent content from being hidden behind sticky bar */}
      <div className="h-20 md:hidden" />
    </>
  )
}
