'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, XCircle, EyeOff, Eye, Trash2, ExternalLink,
  Loader2, Pencil, MoreHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { approveEvent, rejectEvent, hideEvent, unhideEvent, deleteEvent } from './actions'

interface EventRow {
  id: string
  status: string
}

export default function AdminEventActionsMenu({ event }: { event: EventRow }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [reason, setReason] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowReject(false)
        setShowDelete(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setLoading(key)
    setOpen(false)
    await fn()
    setLoading(null)
    router.refresh()
  }

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
  }

  if (showDelete) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Delete?</span>
        <button
          onClick={() => run('delete', () => deleteEvent(event.id))}
          className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg"
        >
          Yes
        </button>
        <button onClick={() => setShowDelete(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1">
          No
        </button>
      </div>
    )
  }

  if (showReject) {
    return (
      <div className="flex items-start gap-2 min-w-[220px]">
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason..."
          rows={2}
          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
        />
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              if (!reason.trim()) return
              run('reject', () => rejectEvent(event.id, reason))
              setShowReject(false)
            }}
            className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg"
          >
            Send
          </button>
          <button onClick={() => setShowReject(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1 py-1">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-44">
          <Link
            href={`/admin/events/preview?id=${event.id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" /> Preview
          </Link>
          <Link
            href={`/admin/events/${event.id}/edit`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-gray-400" /> Edit
          </Link>

          {event.status !== 'approved' && (
            <button
              onClick={() => run('approve', () => approveEvent(event.id))}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
          )}

          {event.status === 'pending' && (
            <button
              onClick={() => { setShowReject(true); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          )}

          {event.status === 'hidden' ? (
            <button
              onClick={() => run('unhide', () => unhideEvent(event.id))}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Unhide
            </button>
          ) : (
            <button
              onClick={() => run('hide', () => hideEvent(event.id))}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" /> Hide
            </button>
          )}

          <div className="border-t border-gray-100" />
          <button
            onClick={() => { setShowDelete(true); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}
