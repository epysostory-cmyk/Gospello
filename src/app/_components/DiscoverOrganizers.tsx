'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft, MapPin, BadgeCheck } from 'lucide-react'

export interface OrganizerCard {
  id: string
  name: string
  slug: string
  logo_url: string | null
  ministry_type: string | null
  city: string
  state: string
  verified_badge: boolean
  source: 'profile' | 'seeded'
  description: string | null
}

interface Props {
  organizers: OrganizerCard[]
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
]

export default function DiscoverOrganizers({ organizers }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft]   = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    updateScrollState()
    return () => el.removeEventListener('scroll', updateScrollState)
  }, [])

  const scroll = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' })

  if (organizers.length === 0) return null

  return (
    <section className="py-12 border-t border-gray-100">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Organizers</h2>
            <p className="text-sm text-gray-400 mt-0.5">Ministries and event hosts putting on gospel events</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1">
              <button onClick={() => scroll('left')} disabled={!canScrollLeft}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white disabled:opacity-25 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={() => scroll('right')} disabled={!canScrollRight}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white disabled:opacity-25 hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <Link href="/organizers" className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
              See all
            </Link>
          </div>
        </div>
      </div>

      {/* Cards — Instagram/TikTok style */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pl-4 sm:pl-6 lg:pl-8 pr-4 pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {organizers.map((org, idx) => {
          const href = `/organizers/${org.source === 'profile' ? org.id : org.slug}`
          const initials = org.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]
          const location = [org.city, org.state].filter(Boolean).join(', ')

          return (
            <Link
              key={`${org.source}-${org.id}`}
              href={href}
              className="group flex-shrink-0 snap-start w-[148px] sm:w-[160px] bg-white rounded-2xl p-4 flex flex-col items-center text-center hover:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              <div className="relative mb-3">
                <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${org.logo_url ? '' : avatarColor}`}>
                  {org.logo_url ? (
                    <Image src={org.logo_url} alt={org.name} width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xl font-bold">{initials}</span>
                  )}
                </div>
                {org.verified_badge && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <BadgeCheck className="w-4 h-4 text-indigo-500" fill="currentColor" />
                  </div>
                )}
              </div>

              {/* Name */}
              <p className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors w-full">
                {org.name}
              </p>

              {/* Ministry type */}
              {org.ministry_type && org.ministry_type.toLowerCase() !== 'other' && (
                <p className="mt-1 text-[11px] text-gray-400 truncate w-full">{org.ministry_type}</p>
              )}

              {/* Location */}
              {location && (
                <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-gray-400">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}
            </Link>
          )
        })}
        <div className="flex-shrink-0 w-2" />
      </div>
    </section>
  )
}
