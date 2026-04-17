'use client'

import { useState, useEffect } from 'react'
import { Loader2, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toggleSaveEvent } from '@/app/actions/saved-events'
import AuthModal from './AuthModal'
import type { User } from '@supabase/supabase-js'

interface Props {
  eventId: string
  eventTitle: string
  initialSaved?: boolean
  serverUserId?: string | null
}

export default function SaveButton({ eventId, eventTitle, initialSaved = false, serverUserId }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(serverUserId === undefined)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (serverUserId !== undefined) {
      if (serverUserId) setUser({ id: serverUserId } as User)
      setLoadingUser(false)
      return
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoadingUser(false)
    })
  }, [serverUserId])

  const handleSaveClick = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    setIsLoading(true)
    const result = await toggleSaveEvent(eventId)

    if (result.success) {
      setIsSaved(result.isSaved)
    }
    setIsLoading(false)
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }

  if (loadingUser) {
    return (
      <button
        disabled
        className="w-full py-3 rounded-xl bg-gray-50 flex items-center justify-center gap-2"
      >
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </button>
    )
  }

  return (
    <>
      <button
        onClick={handleSaveClick}
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
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-600' : ''}`} />
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
