'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ModerationActions from './ModerationActions'
import { bulkModerateEvents } from './actions'

interface Event {
  id: string
  title: string
  slug: string | null
  status: string
  created_at: string
  start_date: string
  is_free: boolean
  city: string | null
  profiles: { display_name: string } | { display_name: string }[] | null
}

interface Props {
  events: Event[]
}

export default function ModerationBulkList({ events }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const allIds = events.map(e => e.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }

  const handleBulkApprove = () => {
    startTransition(async () => {
      await bulkModerateEvents(Array.from(selected), 'approved')
      setSelected(new Set())
    })
  }

  const handleBulkReject = () => {
    startTransition(async () => {
      await bulkModerateEvents(Array.from(selected), 'rejected')
      setSelected(new Set())
    })
  }

  if (events.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <CheckCircle className="w-8 h-8 text-green-500/40 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">All caught up! No events pending review.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Select all row */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="rounded border-white/20 bg-white/5 accent-indigo-500 cursor-pointer"
        />
        <span className="text-xs text-gray-500">
          {someSelected ? `${selected.size} of ${events.length} selected` : `Select all ${events.length}`}
        </span>

        {someSelected && (
          <div className="ml-auto flex items-center gap-2">
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
            <button
              onClick={handleBulkApprove}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/20 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve {selected.size}
            </button>
            <button
              onClick={handleBulkReject}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject {selected.size}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Event rows */}
      <div className="divide-y divide-white/5">
        {events.map((event) => {
          const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
          const organizer = (profile as { display_name: string })?.display_name || 'Unknown'

          return (
            <div
              key={event.id}
              className={`px-4 py-4 sm:px-5 transition-colors ${
                selected.has(event.id) ? 'bg-indigo-500/5' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Checkbox + Event info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected.has(event.id)}
                    onChange={() => toggle(event.id)}
                    className="mt-0.5 rounded border-white/20 bg-white/5 accent-indigo-500 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white leading-snug">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <span className="text-xs text-gray-500">By {organizer}</span>
                      {event.city && (
                        <span className="text-xs text-gray-600">📍 {event.city}</span>
                      )}
                      {event.start_date && (
                        <span className="text-xs text-gray-600">
                          📅 {formatDate(event.start_date, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        event.is_free
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {event.is_free ? 'Free' : 'Paid'}
                      </span>
                      <span className="text-xs text-gray-600">
                        Submitted {formatDate(event.created_at, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row actions */}
                <div className="sm:flex-shrink-0 flex items-center gap-2 pl-6 sm:pl-0">
                  <a
                    href={`/admin/events/preview?id=${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Preview
                  </a>
                  <ModerationActions eventId={event.id} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
