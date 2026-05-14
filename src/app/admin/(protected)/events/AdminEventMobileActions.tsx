'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, EyeOff, Eye, Trash2, ExternalLink, Loader2, Pencil } from 'lucide-react'
import Link from 'next/link'
import { approveEvent, rejectEvent, hideEvent, unhideEvent, deleteEvent } from './actions'

interface EventRow { id: string; status: string }

export default function AdminEventMobileActions({ event }: { event: EventRow }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [reason, setReason] = useState('')

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setLoading(key)
    await fn()
    setLoading(null)
    router.refresh()
  }

  if (showDelete) {
    return (
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-gray-500">Delete this event?</span>
        <button onClick={() => run('delete', () => deleteEvent(event.id))}
          className="text-xs font-semibold text-white bg-red-600 px-3 py-1.5 rounded-lg">
          {loading === 'delete' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, delete'}
        </button>
        <button onClick={() => setShowDelete(false)} className="text-xs text-gray-400 px-2 py-1.5">Cancel</button>
      </div>
    )
  }

  if (showReject) {
    return (
      <div className="space-y-2 pt-1">
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Reason for rejection..."
          rows={2}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
        />
        <div className="flex gap-2">
          <button onClick={() => { if (!reason.trim()) return; run('reject', () => rejectEvent(event.id, reason)); setShowReject(false) }}
            className="text-xs font-semibold text-white bg-red-500 px-3 py-1.5 rounded-lg">
            {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reject'}
          </button>
          <button onClick={() => setShowReject(false)} className="text-xs text-gray-400 px-2 py-1.5">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap border-t border-gray-50 pt-3">
      <Link href={`/admin/events/preview?id=${event.id}`}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors">
        <ExternalLink className="w-3 h-3" /> Preview
      </Link>
      <Link href={`/admin/events/${event.id}/edit`}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors">
        <Pencil className="w-3 h-3" /> Edit
      </Link>
      {event.status !== 'approved' && (
        <button onClick={() => run('approve', () => approveEvent(event.id))} disabled={loading === 'approve'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-60 transition-colors">
          {loading === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
          Approve
        </button>
      )}
      {event.status === 'pending' && (
        <button onClick={() => setShowReject(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors">
          <XCircle className="w-3 h-3" /> Reject
        </button>
      )}
      {event.status === 'hidden' ? (
        <button onClick={() => run('unhide', () => unhideEvent(event.id))} disabled={loading === 'unhide'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60 transition-colors">
          {loading === 'unhide' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
          Unhide
        </button>
      ) : (
        <button onClick={() => run('hide', () => hideEvent(event.id))} disabled={loading === 'hide'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-60 transition-colors">
          {loading === 'hide' ? <Loader2 className="w-3 h-3 animate-spin" /> : <EyeOff className="w-3 h-3" />}
          Hide
        </button>
      )}
      <button onClick={() => setShowDelete(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors ml-auto">
        <Trash2 className="w-3 h-3" /> Delete
      </button>
    </div>
  )
}
