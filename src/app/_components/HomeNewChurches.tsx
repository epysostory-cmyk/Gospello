'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'

interface NewChurch {
  id: string
  name: string
  slug: string
  logo_url: string | null
  denomination: string | null
  city: string | null
  state: string | null
  verified_badge: boolean
}

interface Props {
  churches: NewChurch[]
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

export default function HomeNewChurches({ churches }: Props) {
  if (churches.length === 0) return null

  return (
    <section className="pt-10 pb-2 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">New on Gospello</h2>
            <p className="text-sm text-gray-400 mt-0.5">Churches that just joined this month</p>
          </div>
          <Link
            href="/churches?sort=newest"
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            See all
          </Link>
        </div>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pl-4 sm:pl-6 lg:pl-8 pr-4 pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {churches.map((church) => {
          const gradient = gradientFor(church.name)
          const initial = church.name[0]?.toUpperCase() ?? '?'

          return (
            <Link
              key={church.id}
              href={`/churches/${church.slug}`}
              className="group flex-shrink-0 snap-start w-[150px] bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-sm active:scale-[0.98] transition-all"
            >
              {/* Logo / gradient */}
              <div className="relative w-full h-[90px]">
                {church.logo_url ? (
                  <Image
                    src={church.logo_url}
                    alt={church.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <span className="text-white font-black text-3xl opacity-80">{initial}</span>
                  </div>
                )}

                {/* NEW badge */}
                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                  NEW
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <p className="text-[12px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors flex-1">
                    {church.name}
                  </p>
                  {church.verified_badge && (
                    <ShieldCheck className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                  )}
                </div>
                {church.denomination && (
                  <p className="text-[10px] text-violet-600 font-medium truncate mb-0.5">{church.denomination}</p>
                )}
                <p className="text-[10px] text-gray-400 truncate">
                  {[church.city, church.state].filter(Boolean).join(', ') || 'Nigeria'}
                </p>
              </div>
            </Link>
          )
        })}

        {/* End cap */}
        <Link
          href="/churches?sort=newest"
          className="group flex-shrink-0 snap-start w-[130px] border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-4 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-all"
        >
          <p className="text-[13px] font-semibold text-gray-600 leading-snug">
            See all new churches
          </p>
        </Link>

        <div className="flex-shrink-0 w-4" />
      </div>
    </section>
  )
}
