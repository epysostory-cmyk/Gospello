'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { moderateEvent } from './actions'

function ApproveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium transition-colors disabled:opacity-60 flex items-center gap-1.5"
    >
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
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
      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium transition-colors disabled:opacity-60 flex items-center gap-1.5"
    >
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
      Reject
    </button>
  )
}

export default function ModerationActions({ eventId }: { eventId: string }) {
  const approveWithId = moderateEvent.bind(null, eventId, 'approved')
  const rejectWithId = moderateEvent.bind(null, eventId, 'rejected')

  return (
    <div className="flex gap-2">
      <form action={approveWithId}>
        <ApproveButton />
      </form>
      <form action={rejectWithId}>
        <RejectButton />
      </form>
    </div>
  )
}
