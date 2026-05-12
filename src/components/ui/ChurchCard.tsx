'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, Calendar, ShieldCheck, Star } from 'lucide-react'
import type { Church } from '@/types/database'

interface ChurchCardProps {
  church: Church
  eventCount?: number
}

const GRADIENTS = [
  'from-violet-600 to-indigo-700',
  'from-blue-600 to-cyan-700',
  'from-emerald-600 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-pink-600 to-rose-700',
  'from-indigo-600 to-purple-700',
]

function gradientFor(name: string) {
  return GRADIENTS[(name.charCodeAt(0) ?? 0) % GRADIENTS.length]
}

function StatusBadge({ church }: { church: Church }) {
  if (church.verified_badge) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 whitespace-nowrap">
      <ShieldCheck className="w-2.5 h-2.5" /> Verified
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
      Unclaimed
    </span>
  )
}

export default function ChurchCard({ church, eventCount }: ChurchCardProps) {
  const gradient = gradientFor(church.name)
  const initial = church.name[0]?.toUpperCase() ?? '?'

  return (
    <Link href={`/churches/${church.slug}`} className="group block">

      {/* ── MOBILE: horizontal card ──────────────────────────────── */}
      <div className="sm:hidden flex gap-3 bg-white rounded-2xl overflow-hidden border border-gray-100 active:bg-gray-50 transition-colors" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        {/* Square photo */}
        <div className="flex-shrink-0 w-24 h-24 relative">
          {church.logo_url ? (
            <Image src={church.logo_url} alt={church.name} fill className="object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-white font-black text-3xl">{initial}</span>
            </div>
          )}
          {church.is_featured && (
            <div className="absolute top-1.5 left-1.5 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Star className="w-2 h-2 fill-white" /> Top
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1 mb-0.5">
              <h3 className="font-bold text-gray-900 text-[14px] leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {church.name}
              </h3>
              <StatusBadge church={church} />
            </div>
            {church.denomination && (
              <span className="inline-block text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-medium mb-1">
                {church.denomination}
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            {(church.city || church.state) && (
              <div className="flex items-center gap-1 text-[12px] text-gray-500">
                <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                <span className="truncate">{[church.city, church.state].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {eventCount != null && eventCount > 0 && (
              <div className="flex items-center gap-1 text-[12px] text-gray-500">
                <Calendar className="w-3 h-3 text-violet-400 flex-shrink-0" />
                <span>{eventCount} event{eventCount === 1 ? '' : 's'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TABLET / DESKTOP: vertical card ─────────────────────── */}
      <div
        className="hidden sm:flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-200 group-hover:-translate-y-1 h-full"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(99,102,241,0.13)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)' }}
      >
        {/* Photo area — tall enough to actually see */}
        <div className="relative h-36 flex-shrink-0">
          {church.logo_url ? (
            <Image src={church.logo_url} alt={church.name} fill className="object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-white font-black text-5xl opacity-80">{initial}</span>
            </div>
          )}
          {/* Gradient overlay so text sits on photo cleanly */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {church.is_featured && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded-full">
              <Star className="w-2.5 h-2.5 fill-white" /> Featured
            </div>
          )}

          {/* Status badge floated top-right */}
          <div className="absolute top-3 right-3">
            <StatusBadge church={church} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2 text-[15px] mb-1.5">
            {church.name}
          </h3>

          {church.denomination && (
            <span className="inline-block self-start text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-medium mb-2">
              {church.denomination}
            </span>
          )}

          <div className="mt-auto space-y-1.5 pt-2">
            {(church.city || church.state) && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                <span className="truncate">{[church.city, church.state].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {church.service_times && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                <span className="truncate">{church.service_times}</span>
              </div>
            )}
            {eventCount != null && eventCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar className="w-3 h-3 text-violet-400 flex-shrink-0" />
                <span>{eventCount} upcoming event{eventCount === 1 ? '' : 's'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

    </Link>
  )
}
