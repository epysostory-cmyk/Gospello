'use client'

import { useState, useTransition } from 'react'
import { Check, X, ChevronDown } from 'lucide-react'
import { approveClaim, rejectClaim } from './actions'

interface Props {
  claimId: string
}

export default function ClaimActions({ claimId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)

  if (done === 'approved') {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">Approved</span>
  }
  if (done === 'rejected') {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">Rejected</span>
  }

  function handleApprove() {
    setError('')
    startTransition(async () => {
      const res = await approveClaim(claimId)
      if (res.error) { setError(res.error); return }
      setDone('approved')
    })
  }

  function handleReject() {
    setError('')
    startTransition(async () => {
      const res = await rejectClaim(claimId, reason)
      if (res.error) { setError(res.error); return }
      setDone('rejected')
      setShowReject(false)
    })
  }

  return (
    <div className="flex flex-col gap-1.5 items-end">
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!showReject ? (
        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Check className="w-3 h-3" />
            Approve
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            Reject
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-64">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Rejection reason (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={isPending}
              className="flex-1 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Confirm Reject
            </button>
            <button
              onClick={() => { setShowReject(false); setReason('') }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
