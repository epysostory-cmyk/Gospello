'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import {
  ShieldOff, ShieldCheck, EyeOff, Eye, Trash2, Loader2,
  Building2, MoreHorizontal,
} from 'lucide-react'
import {
  deleteProfileAction, setProfileStatusAction, setProfileHiddenAction,
  deleteChurchAction, setChurchHiddenAction,
} from './actions'

interface Props {
  profileId: string; status: string; isHidden: boolean
  accountType: 'church' | 'organizer'; churchId: string | null
  churchIsHidden: boolean; displayName: string
}

export default function OrgActions({ profileId, status, isHidden, accountType, churchId, churchIsHidden, displayName }: Props) {
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const suspended = status === 'suspended'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => { await fn(); setOpen(false) })
  }

  const confirmRun = (label: string, fn: () => Promise<void>) => {
    if (window.confirm(`${label}? This cannot be undone.`)) run(fn)
  }

  if (pending) return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-48">
          <button
            onClick={() => run(() => setProfileStatusAction(profileId, suspended ? 'active' : 'suspended'))}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
              suspended ? 'text-green-700 hover:bg-green-50' : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            {suspended ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
            {suspended ? 'Reactivate' : 'Suspend'}
          </button>

          <button
            onClick={() => run(() => setProfileHiddenAction(profileId, !isHidden))}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {isHidden ? 'Show Profile' : 'Hide Profile'}
          </button>

          {accountType === 'church' && churchId && (
            <button
              onClick={() => run(() => setChurchHiddenAction(churchId, !churchIsHidden))}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              {churchIsHidden ? 'Show Church' : 'Hide Church'}
            </button>
          )}

          <div className="border-t border-gray-100" />

          {accountType === 'church' && churchId && (
            <button
              onClick={() => confirmRun(`Delete church record for "${displayName}" (keeps user account)`, () => deleteChurchAction(churchId))}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Church
            </button>
          )}

          <button
            onClick={() => confirmRun(`Permanently delete "${displayName}" and ALL their data`, () => deleteProfileAction(profileId))}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete All Data
          </button>
        </div>
      )}
    </div>
  )
}
