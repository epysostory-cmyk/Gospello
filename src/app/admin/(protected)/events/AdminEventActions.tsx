'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, EyeOff, Eye, Trash2, ExternalLink, Loader2, Pencil } from 'lucide-react'
import Link from 'next/link'
import type { Event } from '@/types/database'
import { approveEvent, rejectEvent, hideEvent, unhideEvent, deleteEvent } from './actions'

type Step = null | 'confirm-approve' | 'reject-form' | 'confirm-delete'

export default function AdminEventActions({ event, hidePreview }: { event: Event; hidePreview?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [step, setStep] = useState<Step>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const run = async (key: string, fn: () => Promise<{ error?: string } | unknown>) => {
    setLoading(key)
    const result = await fn()
    setLoading(null)
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      alert(`Error: ${result.error}`)
      return
    }
    setStep(null)
    router.refresh()
  }

  const cancel = () => {
    setStep(null)
    setRejectionReason('')
  }

  /* ── Approve confirmation ── */
  if (step === 'confirm-approve') {
    return (
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-sm font-medium text-green-800">Approve this event?</p>
          <p className="text-xs text-green-600 mt-0.5">The organiser will be notified by email and the event will go live.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => run('approve', () => approveEvent(event.id))}
            disabled={loading === 'approve'}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
          >
            {loading === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
            Yes, approve
          </button>
          <button onClick={cancel} className="text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  /* ── Reject form ── */
  if (step === 'reject-form') {
    return (
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm font-medium text-red-800">Reject this event?</p>
          <p className="text-xs text-red-600 mt-0.5">The organiser will be notified by email with your reason.</p>
        </div>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Explain why this event is being rejected..."
          rows={3}
          className="w-full px-3 py-2 text-sm text-gray-700 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!rejectionReason.trim()) { alert('Please provide a rejection reason'); return }
              run('reject', () => rejectEvent(event.id, rejectionReason))
            }}
            disabled={loading === 'reject'}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
          >
            {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
            Yes, reject
          </button>
          <button onClick={cancel} className="text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  /* ── Delete confirmation ── */
  if (step === 'confirm-delete') {
    return (
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm font-medium text-red-800">Delete this event?</p>
          <p className="text-xs text-red-600 mt-0.5">This cannot be undone. All attendance records will also be removed.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => run('delete', () => deleteEvent(event.id))}
            disabled={loading === 'delete'}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
          >
            {loading === 'delete' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Yes, delete
          </button>
          <button onClick={cancel} className="text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  /* ── Default button row ── */
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {!hidePreview && (
        <Link
          href={`/admin/events/preview?id=${event.id}`}
          className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Preview
        </Link>
      )}

      <Link
        href={`/admin/events/${event.id}/edit`}
        className="flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        <Pencil className="w-3 h-3" />
        Edit
      </Link>

      {event.status !== 'approved' && (
        <button
          onClick={() => setStep('confirm-approve')}
          className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <CheckCircle className="w-3 h-3" />
          Approve
        </button>
      )}

      {event.status === 'pending' && (
        <button
          onClick={() => setStep('reject-form')}
          className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <XCircle className="w-3 h-3" />
          Reject
        </button>
      )}

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

      <button
        onClick={() => setStep('confirm-delete')}
        className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        Delete
      </button>
    </div>
  )
}
