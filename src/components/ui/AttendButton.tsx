'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { attendEvent } from '@/app/actions/attendance'
import AuthModal from './AuthModal'
import type { User } from '@supabase/supabase-js'

interface Props {
  eventId: string
  eventTitle: string
  isFree: boolean
  externalLink?: string | null
  initialCount?: number
}

export default function AttendButton({ eventId, eventTitle, isFree, externalLink, initialCount = 0 }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showAttendForm, setShowAttendForm] = useState(false)
  const [attended, setAttended] = useState(false)
  const [count, setCount] = useState(initialCount)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        setName(data.user.user_metadata?.display_name ?? '')
        setEmail(data.user.email ?? '')
      }
      setLoadingUser(false)
    })
  }, [supabase.auth])

  const handleAttendClick = () => {
    if (!isFree && externalLink) {
      window.open(externalLink, '_blank')
      return
    }
    if (!user) {
      setShowAuthModal(true)
    } else {
      setShowAttendForm(true)
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        setName(data.user.user_metadata?.display_name ?? '')
        setEmail(data.user.email ?? '')
      }
      setShowAttendForm(true)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const result = await attendEvent(eventId, name, email, phone || null)

    if (result.alreadyRegistered) {
      setAttended(true)
      setShowAttendForm(false)
      setSubmitting(false)
      return
    }

    if (!result.success) {
      setError(result.error ?? 'Failed to register. Try again.')
      setSubmitting(false)
      return
    }

    setAttended(true)
    setCount((c) => c + 1)
    setShowAttendForm(false)
    setSubmitting(false)
  }

  if (loadingUser) {
    return (
      <div className="w-full py-3 rounded-xl bg-indigo-50 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
      </div>
    )
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <>
      {/* Attend count */}
      {count > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          <UserCheck className="w-4 h-4 text-indigo-400" />
          <span>{count} {count === 1 ? 'person' : 'people'} attending</span>
        </div>
      )}

      {/* Main CTA */}
      {attended ? (
        <div className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 font-semibold py-3 rounded-xl border border-green-200">
          <CheckCircle className="w-4 h-4" />
          You&apos;re registered!
        </div>
      ) : !isFree ? (
        <button
          onClick={handleAttendClick}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Get Ticket
        </button>
      ) : (
        <button
          onClick={handleAttendClick}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Attend Event
        </button>
      )}

      {/* Attendance form (inline, shown below button) */}
      {showAttendForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-900">Confirm your attendance</p>

          <input
            type="text"
            placeholder="Your full name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputCls}
          />
          <input
            type="email"
            placeholder="Email address *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputCls}
          />
          <input
            type="tel"
            placeholder="Phone number (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
          />

          {error && (
            <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAttendForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? 'Registering...' : 'Confirm'}
            </button>
          </div>
        </form>
      )}

      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          title="Join to Attend"
          subtitle={`Sign in or create a free account to attend "${eventTitle}"`}
        />
      )}
    </>
  )
}
