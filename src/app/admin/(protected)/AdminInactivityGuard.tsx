'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000   // 2 hours
const WARN_BEFORE_MS  = 2 * 60 * 1000          // warn 2 minutes before logout

export default function AdminInactivityGuard() {
  const router = useRouter()
  const idleTimer  = useRef<ReturnType<typeof setTimeout>>()
  const warnTimer  = useRef<ReturnType<typeof setTimeout>>()
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(120)
  const countdownRef = useRef<ReturnType<typeof setInterval>>()

  const signOut = useCallback(async () => {
    await fetch('/auth/signout', { method: 'POST' })
    router.replace('/admin/login')
  }, [router])

  const resetTimers = useCallback(() => {
    clearTimeout(idleTimer.current)
    clearTimeout(warnTimer.current)
    clearInterval(countdownRef.current)
    setShowWarning(false)

    warnTimer.current = setTimeout(() => {
      setShowWarning(true)
      setSecondsLeft(120)
      countdownRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { clearInterval(countdownRef.current); return 0 }
          return s - 1
        })
      }, 1000)
    }, IDLE_TIMEOUT_MS - WARN_BEFORE_MS)

    idleTimer.current = setTimeout(() => {
      signOut()
    }, IDLE_TIMEOUT_MS)
  }, [signOut])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    const handleActivity = () => resetTimers()

    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }))
    resetTimers()

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity))
      clearTimeout(idleTimer.current)
      clearTimeout(warnTimer.current)
      clearInterval(countdownRef.current)
    }
  }, [resetTimers])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Still there?</h2>
        <p className="text-sm text-gray-500 mb-6">
          You&apos;ll be signed out in <span className="font-bold text-amber-600">{secondsLeft}s</span> due to inactivity.
        </p>
        <div className="flex gap-3">
          <button
            onClick={signOut}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Sign out now
          </button>
          <button
            onClick={resetTimers}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  )
}
