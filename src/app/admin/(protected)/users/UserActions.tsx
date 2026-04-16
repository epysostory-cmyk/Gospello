'use client'

import { useTransition } from 'react'
import { ShieldOff, ShieldCheck, EyeOff, Eye, Trash2, Loader2 } from 'lucide-react'
import { deleteUserAction, setUserStatusAction, setUserHiddenAction } from './actions'

interface Props {
  userId: string
  status: string
  isHidden: boolean
  displayName: string
}

export default function UserActions({ userId, status, isHidden, displayName }: Props) {
  const [pending, startTransition] = useTransition()
  const suspended = status === 'suspended'

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => { await fn() })
  }

  const confirmDelete = () => {
    if (window.confirm(`Permanently delete "${displayName}" and ALL their data? This cannot be undone.`)) {
      run(() => deleteUserAction(userId))
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">

      {/* Suspend / Reactivate */}
      <button
        disabled={pending}
        onClick={() => run(() => setUserStatusAction(userId, suspended ? 'active' : 'suspended'))}
        title={suspended ? 'Reactivate account' : 'Suspend account'}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
          suspended
            ? 'bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400'
            : 'bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 text-amber-400'
        }`}
      >
        {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : suspended ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
        {suspended ? 'Reactivate' : 'Suspend'}
      </button>

      {/* Hide / Show */}
      <button
        disabled={pending}
        onClick={() => run(() => setUserHiddenAction(userId, !isHidden))}
        title={isHidden ? 'Show on public site' : 'Hide from public site'}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
          isHidden
            ? 'bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 text-indigo-400'
            : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400'
        }`}
      >
        {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        {isHidden ? 'Show' : 'Hide'}
      </button>

      {/* Delete */}
      <button
        disabled={pending}
        onClick={confirmDelete}
        title="Permanently delete user and all data"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 transition-colors disabled:opacity-50"
      >
        {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        Delete
      </button>

    </div>
  )
}
