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
    const key = `viewed_${eventId}`
    const alreadyCounted = sessionStorage.getItem(key)
    if (alreadyCounted) return

    // Optimistic — show +1 immediately
    setCount((c) => c + 1)
    sessionStorage.setItem(key, '1')

    // Fire to DB in background
    fetch('/api/events/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    }).catch(() => {})
  }, [eventId])

  return (
    <span className="flex items-center gap-1.5">
      <Eye className="w-4 h-4 text-gray-400" />
      {count} views
    </span>
  )
}
