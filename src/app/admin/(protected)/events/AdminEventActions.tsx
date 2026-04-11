'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { Event } from '@/types/database'

export default function AdminEventActions({ event }: { event: Event }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const approve = async () => {
    setLoading('approve')
    await supabase
      .from('events')
      .update({ status: 'approved', approved_at: new Date().toISOString(), rejection_reason: null })
      .eq('id', event.id)
    setLoading(null)
    router.refresh()
  }

  const reject = async () => {
    if (!rejectionReason.trim()) { alert('Please provide a rejection reason'); return }
    setLoading('reject')
    await supabase
      .from('events')
      .update({ status: 'rejected', rejection_reason: rejectionReason })
      .eq('id', event.id)
    setLoading(null)
    setShowRejectForm(false)
    router.refresh()
  }

  if (showRejectForm) {
    return (
      <div className="space-y-2 min-w-52">
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Reason for rejection..."
          rows={2}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={reject}
            disabled={loading === 'reject'}
            className="flex items-center gap-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg disabled:opacity-60"
          >
            {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Reject
          </button>
          <button
            onClick={() => setShowRejectForm(false)}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {event.status !== 'approved' && (
        <button
          onClick={approve}
          disabled={loading === 'approve'}
          className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
        >
          {loading === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
          Approve
        </button>
      )}
      {event.status !== 'rejected' && (
        <button
          onClick={() => setShowRejectForm(true)}
          className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <XCircle className="w-3 h-3" />
          Reject
        </button>
      )}
    </div>
  )
}
