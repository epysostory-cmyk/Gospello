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
    // Count every page load — no deduplication
    setCount((c) => c + 1)
    fetch('/api/events/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    }).catch(() => {})
  }, [eventId])

  return (
    <span className="flex items-center gap-1.5">
      <Eye className="w-4 h-4 text-gray-400" />
      {count} {count === 1 ? 'view' : 'views'}
    </span>
  )
}
