'use client'

import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'

interface Props {
  eventId: string
  initialCount: number
}

export default function ViewCounter({ eventId, initialCount }: Props) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const key = `gospello_viewed_${eventId}`
    try {
      const stored = localStorage.getItem(key)
      const now = Date.now()
      // Existing entry that hasn't expired
      if (stored && now < parseInt(stored, 10)) return

      // Optimistic +1
      setCount((c) => c + 1)
      // 24-hour expiry stored as unix ms
      localStorage.setItem(key, String(now + 24 * 60 * 60 * 1000))

      fetch('/api/events/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      }).catch(() => {})
    } catch {
      // localStorage unavailable (private mode etc.) — just fire the view
      fetch('/api/events/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      }).catch(() => {})
    }
  }, [eventId])

  return (
    <span className="flex items-center gap-1.5">
      <Eye className="w-4 h-4 text-gray-400" />
      {count} {count === 1 ? 'view' : 'views'}
    </span>
  )
}
