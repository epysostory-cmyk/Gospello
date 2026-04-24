'use client'

import { useState, useEffect } from 'react'
import { Loader2, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveEvent, unsaveEvent } from '@/app/actions/saved-events'
import AuthModal from './AuthModal'
import type { User } from '@supabase/supabase-js'

const LS_KEY = 'gospello_saved_events'

function getLocalSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function setLocalSaved(ids: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids))
}

interface Props {
  eventId: string
  eventTitle?: string
  initialSaved?: boolean
  serverUserId?: string | null
  /** 'icon' renders a heart circle (for cards), 'button' renders the full-width sidebar button */
  variant?: 'icon' | 'button'
  size?: 'sm' | 'md'
}

export default function SaveButton({
  eventId,
  eventTitle = 'this event',
  initialSaved = false,
  serverUserId,
  variant = 'button',
  size = 'sm',
}: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(serverUserId === undefined)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isLoading, setIsLoading] = useState(false)
  const [bouncing, setBouncing] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (serverUserId !== undefined) {
      if (serverUserId) setUser({ id: serverUserId } as User)
      setLoadingUser(false)

      if (!serverUserId) {
        // Guest: reconcile with localStorage
        const ids = getLocalSaved()
        setIsSaved(ids.includes(eventId))
      }
      return
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoadingUser(false)
      if (!data.user) {
        const ids = getLocalSaved()
        setIsSaved(ids.includes(eventId))
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, serverUserId])

  const handleSaveClick = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (!user) {
      // Guest: use localStorage for both variants
      const next = !isSaved
      const ids = getLocalSaved()
      const updated = next
        ? [...ids.filter(id => id !== eventId), eventId]
        : ids.filter(id => id !== eventId)
      setLocalSaved(updated)
      setIsSaved(next)
      triggerBounce()
      return
    }

    setIsLoading(true)
    triggerBounce()

    if (isSaved) {
      const result = await unsaveEvent(eventId)
      if (result.success) setIsSaved(false)
    } else {
      const result = await saveEvent(eventId)
      if (result.success) setIsSaved(true)
    }

    setIsLoading(false)
  }

  const triggerBounce = () => {
    setBouncing(true)
    setTimeout(() => setBouncing(false), 200)
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }

  // ── ICON VARIANT (for cards) ────────────────────────────────────────────
  if (variant === 'icon') {
    const circleSize = size === 'md' ? 'w-10 h-10' : 'w-8 h-8'
    const iconSize   = size === 'md' ? 'w-5 h-5' : 'w-4 h-4'

    return (
      <button
        onClick={handleSaveClick}
        aria-label={isSaved ? 'Unsave event' : 'Save event'}
        className={`
          ${circleSize} rounded-full flex items-center justify-center
          bg-white shadow-md border border-white/50
          select-none hover:scale-110 active:scale-95
          transition-transform duration-200
          ${bouncing ? 'scale-125' : 'scale-100'}
        `}
      >
        <Heart
          className={`${iconSize} transition-colors duration-150 ${
            isSaved ? 'fill-rose-500 text-rose-500' : 'fill-none text-gray-400'
          }`}
        />
      </button>
    )
  }

  // ── BUTTON VARIANT (for sidebar / detail page) ──────────────────────────
  if (loadingUser) {
    return (
      <button disabled className="w-full py-3 rounded-xl bg-gray-50 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => handleSaveClick()}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors ${
          isSaved
            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
        } disabled:opacity-60`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
        )}
        {isSaved ? 'Saved' : 'Save Event'}
      </button>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          title="Save to Favorites"
          subtitle={`Sign in or create a free account to save "${eventTitle}"`}
        />
      )}
    </>
  )
}
