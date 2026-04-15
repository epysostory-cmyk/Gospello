'use client'

import { useFormStatus } from 'react-dom'
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { setOrgStatus } from './actions'

function ActionButton({ suspended }: { suspended: boolean }) {
  const { pending } = useFormStatus()
  if (suspended) {
    return (
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-xs font-medium transition-colors disabled:opacity-60"
      >
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
        Reactivate
      </button>
    )
  }
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 text-xs font-medium transition-colors disabled:opacity-60"
    >
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
      Suspend
    </button>
  )
}

export default function OrgActions({ profileId, suspended }: { profileId: string; suspended: boolean }) {
  const newStatus = suspended ? 'active' : 'suspended'
  const actionWithId = setOrgStatus.bind(null, profileId, newStatus)

  return (
    <form action={actionWithId}>
      <ActionButton suspended={suspended} />
    </form>
  )
}
