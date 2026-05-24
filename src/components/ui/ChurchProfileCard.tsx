import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck, CheckCircle, Calendar, Clock } from 'lucide-react'
import type { Church } from '@/types/database'
import { formatServiceTimes } from '@/lib/utils'

interface Props {
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

export default function ChurchProfileCard({ church, eventCount = 0 }: Props) {
  const gradient = gradientFor(church.name)
  const initial = church.name[0]?.toUpperCase() ?? '?'
  const pastorLine = [church.leader_title, church.pastor_name].filter(Boolean).join(' ')

  return (
    <Link href={`/churches/${church.slug}`} className="group block h-full">
      <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl h-full flex flex-col">

        {/* ── Cover ───────────────────────────────────────────────── */}
        <div className="h-[72px] relative overflow-hidden flex-shrink-0">
          {/* Base gradient always present */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

          {/* If logo exists, blur it as a cover texture */}
          {church.logo_url && !church.banner_url && (
            <div className="absolute inset-0">
              <Image
                src={church.logo_url}
                alt=""
                fill
                className="object-cover scale-150 blur-xl opacity-40"
                sizes="300px"
                unoptimized
              />
            </div>
          )}

          {/* Actual banner if set */}
          {church.banner_url && (
            <Image
              src={church.banner_url}
              alt=""
              fill
              className="object-cover"
              sizes="300px"
            />
          )}

          {/* Featured badge */}
          {church.is_featured && (
            <div className="absolute top-2 right-2 bg-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide">
              Featured
            </div>
          )}
        </div>

        {/* ── Avatar — overlaps cover ──────────────────────────────── */}
        <div className="flex justify-center relative z-10" style={{ marginTop: '-28px' }}>
          <div className="w-14 h-14 rounded-full border-[3px] border-white overflow-hidden shadow-md bg-white flex-shrink-0">
            {church.logo_url ? (
              <Image
                src={church.logo_url}
                alt={church.name}
                width={56}
                height={56}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <span className="text-white font-black text-xl">{initial}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Profile info ─────────────────────────────────────────── */}
        <div className="px-3 pt-2 pb-4 text-center flex flex-col flex-1">

          {/* Name + verification */}
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <h3 className="font-bold text-gray-900 text-[14px] leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
              {church.name}
            </h3>
            {church.verified_badge && (
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-px" />
            )}
            {!church.verified_badge && church.is_claimed && (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-px" />
            )}
          </div>

          {/* Denomination */}
          {church.denomination && (
            <p className="text-[11px] font-semibold text-violet-600 mb-1 truncate">
              {church.denomination}
            </p>
          )}

          {/* Pastor */}
          {pastorLine && (
            <p className="text-[11px] text-gray-500 mb-1 truncate">{pastorLine}</p>
          )}

          {/* Location */}
          <p className="text-[11px] text-gray-400 truncate">
            {[church.city, church.state].filter(Boolean).join(', ')}
          </p>

          {/* ── Stats row ─────────────────────────────────────────── */}
          <div className="mt-auto pt-3 flex items-stretch justify-center gap-0 border-t border-gray-100 mt-3">

            {/* Event count */}
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Calendar className="w-3 h-3 text-indigo-400" />
                <span className="text-sm font-bold text-gray-900 leading-none">{eventCount}</span>
              </div>
              <p className="text-[10px] text-gray-400">events</p>
            </div>

            {/* Service times if available */}
            {church.service_times && (
              <>
                <div className="w-px bg-gray-100 self-stretch mx-2" />
                <div className="flex-1 text-center min-w-0">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Clock className="w-3 h-3 text-violet-400 flex-shrink-0" />
                  </div>
                  <p className="text-[10px] text-gray-600 font-medium truncate leading-snug">
                    {formatServiceTimes(church.service_times)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
