'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Bell } from 'lucide-react'

const DISMISSED_KEY = 'gospello_nudge_dismissed'
const LOCATION_KEY  = 'gospello_user_location'

interface CachedLocation { state: string }

export default function NotificationNudge() {
  const [visible, setVisible]       = useState(false)
  const [email, setEmail]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')
  const [userState, setUserState]   = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Don't show if already dismissed or subscribed
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return
    } catch { /* ignore */ }

    // Load user's state from location cache
    try {
      const raw = localStorage.getItem(LOCATION_KEY)
      if (raw) {
        const parsed: CachedLocation = JSON.parse(raw)
        if (parsed?.state) setUserState(parsed.state)
      }
    } catch { /* ignore */ }

    // Only show after user has scrolled past the sentinel (events section)
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          // Sentinel scrolled out of view — user has passed the events section
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* ignore */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/notify-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), state: userState }),
      })
      if (!res.ok) throw new Error('Failed')
      setDone(true)
      try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* ignore */ }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const label = userState
    ? `New gospel events in ${userState}`
    : 'New gospel events near you'

  return (
    <>
      {/* Sentinel — placed right after the upcoming events section triggers */}
      <div ref={sentinelRef} aria-hidden />

      {/* Nudge bar */}
      {visible && !done && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="max-w-xl mx-auto px-4 py-3.5">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center mt-0.5">
                <Bell className="w-4 h-4 text-indigo-600" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-gray-900 leading-snug mb-0.5">
                  Want to know first?
                </p>
                <p className="text-[11.5px] text-gray-500 mb-2.5 leading-snug">
                  Get notified when {label} are posted.
                </p>

                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-gray-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="flex-shrink-0 h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[12px] font-semibold disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {loading ? '…' : 'Notify me'}
                  </button>
                </form>
                {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
              </div>

              {/* Dismiss */}
              <button
                onClick={dismiss}
                className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 mt-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success state */}
      {done && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-indigo-600 text-white"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 flex-shrink-0" />
              <p className="text-[13px] font-semibold">You&apos;re in! We&apos;ll let you know first. 🙌</p>
            </div>
            <button onClick={() => setDone(false)} className="flex-shrink-0">
              <X className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
