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
      {/* Banner strip */}
      <div className={`relative h-12 bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '14px 14px',
          }}
        />
        {church.is_featured && (
          <div className="absolute top-2.5 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
            <Star className="w-2.5 h-2.5 fill-white" /> Featured
          </div>
        )}
      </div>

      {/* Logo overlapping banner */}
      <div className="px-4 pb-4">
        <div className="relative -mt-9 mb-3 flex items-end justify-between">
          <div>
            {church.logo_url ? (
              <Image src={church.logo_url} alt={church.name} width={72} height={72} className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full object-cover ring-4 ring-white shadow-md" />
            ) : (
              <div className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center ring-4 ring-white shadow-md`}>
                <span className="text-white font-black text-2xl drop-shadow-sm">{initial}</span>
              </div>
            )}
          </div>
          <div className="mb-1">
            {church.verified_badge ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                <ShieldCheck className="w-2.5 h-2.5" />Verified
              </span>
            ) : church.is_claimed ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <CheckCircle className="w-2.5 h-2.5" />Claimed
              </span>
            ) : church.claim_requested_at ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                Pending
              </span>
            ) : (church.created_by_admin && !church.is_claimed) ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                Unverified
              </span>
            ) : church.is_verified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                <CheckCircle className="w-2.5 h-2.5" />Verified
              </span>
            ) : null}
          </div>
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
