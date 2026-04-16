'use client'

import { useTransition } from 'react'
import {
  ShieldOff, ShieldCheck, EyeOff, Eye, Trash2, Loader2, Building2,
} from 'lucide-react'
import {
  deleteProfileAction,
  setProfileStatusAction,
  setProfileHiddenAction,
  deleteChurchAction,
  setChurchHiddenAction,
} from './actions'

interface Props {
  profileId: string
  status: string
  isHidden: boolean
  accountType: 'church' | 'organizer'
  churchId: string | null
  churchIsHidden: boolean
  displayName: string
}

export default function OrgActions({
  profileId,
  status,
  isHidden,
  accountType,
  churchId,
  churchIsHidden,
  displayName,
}: Props) {
  const [pending, startTransition] = useTransition()
  const suspended = status === 'suspended'

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => { await fn() })
  }

  const confirmDelete = (label: string, action: () => void) => {
    if (window.confirm(`Delete "${label}" permanently? This cannot be undone.`)) {
      action()
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">

      {/* ── Suspend / Reactivate ── */}
      <button
        disabled={pending}
        onClick={() =>
          run(() => setProfileStatusAction(profileId, suspended ? 'active' : 'suspended'))
        }
        title={suspended ? 'Reactivate account' : 'Suspend account'}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
          suspended
            ? 'bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400'
            : 'bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 text-amber-400'
        }`}
      >
        {pending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : suspended ? (
          <ShieldCheck className="w-3 h-3" />
        ) : (
          <ShieldOff className="w-3 h-3" />
        )}
        {suspended ? 'Reactivate' : 'Suspend'}
      </button>

      {/* ── Hide / Show (profile — organizers page) ── */}
      <button
        disabled={pending}
        onClick={() => run(() => setProfileHiddenAction(profileId, !isHidden))}
        title={isHidden ? 'Show on public site' : 'Hide from public site'}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
          isHidden
            ? 'bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 text-indigo-400'
            : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400'
        }`}
      >
        {pending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isHidden ? (
          <Eye className="w-3 h-3" />
        ) : (
          <EyeOff className="w-3 h-3" />
        )}
        {isHidden ? 'Show' : 'Hide'}
      </button>

      {/* ── Hide / Show church listing (only for churches) ── */}
      {accountType === 'church' && churchId && (
        <button
          disabled={pending}
          onClick={() => run(() => setChurchHiddenAction(churchId, !churchIsHidden))}
          title={churchIsHidden ? 'Show church page publicly' : 'Hide church page publicly'}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
            churchIsHidden
              ? 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 text-purple-400'
              : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400'
          }`}
        >
          {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Building2 className="w-3 h-3" />}
          {churchIsHidden ? 'Show Church' : 'Hide Church'}
        </button>
      )}

      {/* ── Delete church record only ── */}
      {accountType === 'church' && churchId && (
        <button
          disabled={pending}
          onClick={() =>
            confirmDelete(`${displayName} (church record)`, () =>
              run(() => deleteChurchAction(churchId)),
            )
          }
          title="Delete church record (keeps user account)"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/30 text-orange-400 transition-colors disabled:opacity-50"
        >
          {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          Del Church
        </button>
      )}

      {/* ── Delete profile + auth user (permanent) ── */}
      <button
        disabled={pending}
        onClick={() =>
          confirmDelete(`${displayName} account (ALL DATA)`, () =>
            run(() => deleteProfileAction(profileId)),
          )
        }
        title="Permanently delete user + all their data"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 transition-colors disabled:opacity-50"
      >
        {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        Delete All
      </button>

    </div>
  )
}
