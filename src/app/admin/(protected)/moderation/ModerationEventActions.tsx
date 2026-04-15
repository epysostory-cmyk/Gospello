'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { approveEvent } from '../events/actions'

export default function ModerationEventActions({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    await approveEvent(eventId)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <CheckCircle className="w-3 h-3" />
      )}
      Re-approve
    </button>
  )
}
