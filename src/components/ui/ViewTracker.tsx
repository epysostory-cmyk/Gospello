'use client'

import { useEffect } from 'react'

export default function ViewTracker({ eventId }: { eventId: string }) {
  useEffect(() => {
    fetch('/api/events/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    }).catch(() => {})
  }, [eventId])

  return null
}
