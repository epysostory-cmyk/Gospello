export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate, formatTime, CATEGORY_LABELS } from '@/lib/utils'
import { Calendar, MapPin, Clock, ArrowLeft, ExternalLink } from 'lucide-react'

export default async function AdminEventPreview({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  if (!id) notFound()

  const admin = createAdminClient()
  const { data: event } = await admin
    .from('events')
    .select('*, profiles(display_name, email)')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const statusColor: Record<string, string> = {
    pending:  'bg-amber-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/moderation"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Moderation
        </Link>
        <Link
          href={`/events/${event.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View live page
        </Link>
      </div>

      {/* Status banner */}
      <div className={`${statusColor[event.status] ?? 'bg-gray-500'} text-white text-sm font-semibold px-4 py-2.5 rounded-xl`}>
        ⚠️ Admin Preview — This event is <span className="uppercase">{event.status}</span> and not visible to the public
      </div>

      {/* Banner */}
      {event.banner_url && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900">
          <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
        </div>
      )}

      {/* Details */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">{CATEGORY_LABELS[event.category] ?? event.category}</span>
          <h1 className="text-2xl font-bold text-white mt-1">{event.title}</h1>
          <p className="text-sm text-gray-400 mt-1">By {(event.profiles as any)?.display_name ?? 'Unknown'}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-500" />
            {formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {event.start_date && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-500" />
              {formatTime(event.start_date)}
            </span>
          )}
          {event.location_name && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-500" />
              {event.location_name}, {event.city}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{event.description}</p>

        {event.rejection_reason && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Rejection Reason</p>
            <p className="text-sm text-gray-300">{event.rejection_reason}</p>
          </div>
        )}
      </div>
    </div>
  )
}
