'use client'

import { useState, useTransition } from 'react'
import { Loader2, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { moderateEvent } from './actions'

export default function ModerationActions({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  const handleApprove = () => {
    startTransition(async () => {
      await moderateEvent(eventId, 'approved')
    })
  }

  const handleReject = () => {
    if (!reason.trim()) {
      setReasonError('Please give a reason — the host needs to know what to fix.')
      return
    }
    setReasonError('')
    startTransition(async () => {
      await moderateEvent(eventId, 'rejected', reason.trim())
      setShowRejectForm(false)
      setReason('')
    })
  }

  if (showRejectForm) {
    return (
      <div className="w-full sm:w-72 space-y-2">
        <textarea
          value={reason}
          onChange={e => { setReason(e.target.value); setReasonError('') }}
          placeholder="Tell the host what needs to change, e.g. 'Please add a clear event location and a proper banner image.'"
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-red-300 bg-[#1A1A1A] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-red-400 resize-none leading-relaxed"
          autoFocus
        />
        {reasonError && <p className="text-red-400 text-xs">{reasonError}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setShowRejectForm(false); setReason(''); setReasonError('') }}
            disabled={isPending}
            className="flex-1 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 text-xs font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold transition-colors disabled:opacity-50 border border-red-500/20"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
            Send & Reject
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 w-full sm:w-auto">
      <button
        type="button"
        onClick={handleApprove}
        disabled={isPending}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-semibold transition-colors disabled:opacity-60 border border-green-500/20"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Approve
      </button>
      <button
        type="button"
        onClick={() => setShowRejectForm(true)}
        disabled={isPending}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-semibold transition-colors disabled:opacity-60 border border-red-500/20"
      >
        <XCircle className="w-4 h-4" />
        Reject
      </button>
    </div>
  )
}
