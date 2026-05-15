export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate, formatTime, CATEGORY_LABELS } from '@/lib/utils'
import {
  Calendar, MapPin, Clock, ArrowLeft, ExternalLink,
  Eye, Globe, Ticket, Users, Tag, Wifi, Star,
} from 'lucide-react'
import AdminEventActions from '../AdminEventActions'

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string; desc: string }> = {
  pending:  { bg: 'bg-amber-500/10 border-amber-500/20',  dot: 'bg-amber-400',  label: 'Pending Review', desc: 'Awaiting admin approval before going public' },
  approved: { bg: 'bg-green-500/10 border-green-500/20',  dot: 'bg-green-400',  label: 'Approved',       desc: 'Live and visible to the public' },
  rejected: { bg: 'bg-red-500/10   border-red-500/20',    dot: 'bg-red-400',    label: 'Rejected',       desc: 'Not visible to the public' },
  hidden:   { bg: 'bg-gray-500/10  border-gray-500/20',   dot: 'bg-gray-400',   label: 'Hidden',         desc: 'Temporarily removed from public view' },
}

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

  const status = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.hidden
  const profile = event.profiles as any

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/events"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
        <Link
          href={`/events/${event.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View public page
        </Link>
      </div>

      {/* Layout: content + sidebar */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">

        {/* ── Left: event content ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Banner */}
          {event.banner_url ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900">
              <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-full aspect-video rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <p className="text-sm text-gray-600">No banner uploaded</p>
            </div>
          )}

          {/* Title block */}
          <div className="space-y-1.5">
            <span className="inline-block text-xs font-medium text-gray-500 uppercase tracking-wider">
              {CATEGORY_LABELS[event.category] ?? event.category}
            </span>
            <h1 className="text-2xl font-bold text-white leading-tight">{event.title}</h1>
            <p className="text-sm text-gray-400">
              Organised by <span className="text-gray-200 font-medium">{profile?.display_name ?? 'Unknown'}</span>
              {profile?.email && <span className="text-gray-600"> · {profile.email}</span>}
            </p>
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            <Chip icon={<Calendar className="w-3.5 h-3.5" />} label={formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} />
            <Chip icon={<Clock className="w-3.5 h-3.5" />} label={formatTime(event.start_date)} />
            {event.end_date && <Chip icon={<Clock className="w-3.5 h-3.5" />} label={`Ends ${formatTime(event.end_date)}`} />}
            {event.is_online ? (
              <Chip icon={<Wifi className="w-3.5 h-3.5" />} label={event.online_platform ?? 'Online'} />
            ) : (
              event.location_name && <Chip icon={<MapPin className="w-3.5 h-3.5" />} label={`${event.location_name}, ${event.city}`} />
            )}
            {event.is_featured && <Chip icon={<Star className="w-3.5 h-3.5" />} label="Featured" highlight />}
          </div>

          {/* Description */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{event.description}</p>
          </div>

          {/* Extra details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Detail label="Admission" value={event.is_free ? 'Free' : event.price ? `${event.currency} ${event.price}` : 'Paid'} icon={<Ticket className="w-4 h-4" />} />
            <Detail label="Registration" value={event.rsvp_required ? 'Required' : 'Open'} icon={<Users className="w-4 h-4" />} />
            <Detail label="Views" value={String(event.views_count ?? 0)} icon={<Eye className="w-4 h-4" />} />
            {event.capacity && <Detail label="Capacity" value={String(event.capacity)} icon={<Users className="w-4 h-4" />} />}
            {event.external_link && (
              <Detail label="External Link" value="Linked" icon={<Globe className="w-4 h-4" />} href={event.external_link} />
            )}
            {event.tags?.length > 0 && (
              <Detail label="Tags" value={event.tags.join(', ')} icon={<Tag className="w-4 h-4" />} />
            )}
          </div>

          {/* Rejection reason */}
          {event.rejection_reason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Rejection Reason</p>
              <p className="text-sm text-gray-300 leading-relaxed">{event.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* ── Right: action sidebar ── */}
        <div className="w-full xl:w-72 xl:sticky xl:top-6 space-y-4 shrink-0">

          {/* Status card */}
          <div className={`border rounded-2xl p-4 ${status.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
              <span className="text-sm font-semibold text-white">{status.label}</span>
            </div>
            <p className="text-xs text-gray-400 ml-4">{status.desc}</p>
          </div>

          {/* Actions card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</p>
            <AdminEventActions event={event as any} hidePreview />
          </div>

          {/* Meta info card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Info</p>
            <MetaRow label="Event ID" value={event.id.slice(0, 8) + '…'} />
            <MetaRow label="Created" value={formatDate(event.created_at, { month: 'short', day: 'numeric', year: 'numeric' })} />
            {event.approved_at && <MetaRow label="Approved" value={formatDate(event.approved_at, { month: 'short', day: 'numeric', year: 'numeric' })} />}
            <MetaRow label="Admin created" value={event.created_by_admin ? 'Yes' : 'No'} />
          </div>
        </div>

      </div>
    </div>
  )
}

function Chip({ icon, label, highlight }: { icon: React.ReactNode; label: string; highlight?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
      highlight
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
        : 'bg-white/5 border-white/10 text-gray-300'
    }`}>
      {icon}
      {label}
    </span>
  )
}

function Detail({ label, value, icon, href }: { label: string; value: string; icon: React.ReactNode; href?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-gray-500">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:underline truncate block">
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium text-white truncate">{value}</p>
      )}
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-300 font-medium text-right">{value}</span>
    </div>
  )
}
