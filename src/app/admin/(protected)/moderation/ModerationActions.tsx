'use client'

import { useFormStatus } from 'react-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { moderateEvent } from './actions'

function ApproveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-semibold transition-colors disabled:opacity-60 border border-green-500/20"
    >
      {pending
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <CheckCircle className="w-4 h-4" />
      }
      Approve
    </button>
  )
}

function RejectButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-semibold transition-colors disabled:opacity-60 border border-red-500/20"
    >
      {pending
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <XCircle className="w-4 h-4" />
      }
      Reject
    </button>
  )
}

export default function ModerationActions({ eventId }: { eventId: string }) {
  const approveWithId = moderateEvent.bind(null, eventId, 'approved')
  const rejectWithId = moderateEvent.bind(null, eventId, 'rejected')

  return (
    /* Full width row on mobile (both buttons share space), auto on desktop */
    <div className="flex gap-2 w-full sm:w-auto">
      <form action={approveWithId} className="flex-1 sm:flex-none">
        <ApproveButton />
      </form>
      <form action={rejectWithId} className="flex-1 sm:flex-none">
        <RejectButton />
      </form>
    </div>
  )
}
