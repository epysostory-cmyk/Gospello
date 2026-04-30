'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, CheckCircle, Star, ShieldCheck } from 'lucide-react'
import type { Church } from '@/types/database'

interface ChurchCardProps {
  church: Church
}

// Deterministic gradient from church name initial
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

export default function ChurchCard({ church }: ChurchCardProps) {
  const gradient = gradientFor(church.name)
  const initial = church.name[0]?.toUpperCase() ?? '?'

  return (
    <Link
      href={`/churches/${church.slug}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(99,102,241,0.12)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      {/* Banner */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {church.banner_url ? (
          <Image
            src={church.banner_url}
            alt={church.name}
            fill
            className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <>
            {/* Dot pattern on gradient */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '16px 16px',
              }}
            />
          </>
        )}

        {/* Badges top-right */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {church.is_featured && (
            <span className="flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <Star className="w-3 h-3 fill-white" /> Featured
            </span>
          )}
        </div>

        {/* Subtle gradient at bottom for logo overlap area */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/8 to-transparent" />
      </div>

      {/* Logo overlapping banner */}
      <div className="px-4 pb-4">
        <div className="relative -mt-8 mb-3 flex items-end justify-between">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex-shrink-0 flex items-center justify-center">
            {church.logo_url ? (
              <Image src={church.logo_url} alt={church.name} width={64} height={64} className="object-cover w-full h-full" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <span className="text-white font-black text-xl">{initial}</span>
              </div>
            )}
          </div>
          {church.verified_badge ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 mb-1">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </div>
          ) : church.is_claimed ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 mb-1">
              <CheckCircle className="w-3 h-3" />
              Claimed
            </div>
          ) : church.claim_requested_at ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 mb-1">
              Pending
            </div>
          ) : (church.created_by_admin && !church.is_claimed) ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full mb-1">
              Unverified
            </div>
          ) : church.is_verified ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 mb-1">
              <CheckCircle className="w-3 h-3 fill-indigo-600 text-white" />
              Verified
            </div>
          ) : null}
        </div>

        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2 text-[15px]">
          {church.name}
        </h3>

        <div className="mt-2 space-y-1.5">
          {(church.address || church.city) && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
              <span className="truncate">{church.address ? `${church.address}, ` : ''}{church.city}</span>
            </div>
          )}
          {church.service_times && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              <span className="truncate">{church.service_times}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
