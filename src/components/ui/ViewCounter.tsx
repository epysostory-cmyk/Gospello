'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye } from 'lucide-react'

const SESSION_KEY = 'gsp_session_id'

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

interface Props {
  eventId: string
  initialCount: number
}

export default function ViewCounter({ eventId, initialCount }: Props) {
  const [count, setCount] = useState(initialCount)
  const searchParams = useSearchParams()

  useEffect(() => {
    setCount((c) => c + 1)
    const sessionId = getSessionId()
    const referral = searchParams.get('ref') ?? undefined
    fetch('/api/events/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, sessionId, referral }),
    }).catch(() => {})
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className="flex items-center gap-1.5">
      <Eye className="w-4 h-4 text-gray-400" />
      {count} {count === 1 ? 'view' : 'views'}
    </span>
  )
}
