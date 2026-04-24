'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, EyeOff, Eye, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Event } from '@/types/database'
import { approveEvent, rejectEvent, hideEvent, unhideEvent, deleteEvent } from './actions'

export default function AdminEventActions({ event }: { event: Event }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setLoading(key)
    await fn()
    setLoading(null)
    router.refresh()
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-2 min-w-52">
        <span className="text-xs text-gray-500">Delete this event?</span>
        <button
          onClick={() => run('delete', () => deleteEvent(event.id))}
          disabled={loading === 'delete'}
          className="flex items-center gap-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg disabled:opacity-60"
        >
          {loading === 'delete' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Yes, delete
        </button>
        <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">
          Cancel
        </button>
      </div>
    )
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
            onClick={() => {
              if (!rejectionReason.trim()) { alert('Please provide a rejection reason'); return }
              run('reject', () => rejectEvent(event.id, rejectionReason))
              setShowRejectForm(false)
            }}
            disabled={loading === 'reject'}
            className="flex items-center gap-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg disabled:opacity-60"
          >
            {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Reject
          </button>
          <button onClick={() => setShowRejectForm(false)} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Preview */}
      <Link
        href={`/admin/events/preview?id=${event.id}`}
        className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        Preview
      </Link>

      {/* Approve */}
      {event.status !== 'approved' && (
        <button
          onClick={() => run('approve', () => approveEvent(event.id))}
          disabled={loading === 'approve'}
          className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
        >
          {loading === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
          Approve
        </button>
      )}

      {/* Reject */}
      {event.status !== 'rejected' && (
        <button
          onClick={() => setShowRejectForm(true)}
          className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <XCircle className="w-3 h-3" />
          Reject
        </button>
      )}

      {/* Hide / Unhide */}
      {event.status === 'hidden' ? (
        <button
          onClick={() => run('unhide', () => unhideEvent(event.id))}
          disabled={loading === 'unhide'}
          className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
        >
          {loading === 'unhide' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
          Unhide
        </button>
      ) : (
        <button
          onClick={() => run('hide', () => hideEvent(event.id))}
          disabled={loading === 'hide'}
          className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
        >
          {loading === 'hide' ? <Loader2 className="w-3 h-3 animate-spin" /> : <EyeOff className="w-3 h-3" />}
          Hide
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => setConfirmDelete(true)}
        className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        Delete
      </button>
    </div>
  )
}
