'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft, MapPin } from 'lucide-react'

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

export default function DiscoverOrganizers({ organizers }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
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

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' })
  }

  if (organizers.length === 0) return null

  return (
    <section className="py-12 border-t border-gray-100">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Organizers</h2>
            <p className="text-gray-500 mt-0.5 text-sm">Ministries and event hosts putting on gospel events</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            <div className="hidden sm:flex items-center gap-1">
              <button onClick={() => scroll('left')} disabled={!canScrollLeft}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm disabled:opacity-30 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={() => scroll('right')} disabled={!canScrollRight}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm disabled:opacity-30 hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <Link href="/organizers" className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:underline">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pl-4 sm:pl-6 lg:pl-8 pr-4 pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {organizers.map((org) => {
          const href = `/organizers/${org.source === 'profile' ? org.id : org.slug}`
          const initials = org.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          return (
            <Link
              key={`${org.source}-${org.id}`}
              href={href}
              className="group flex-shrink-0 snap-start w-[220px] sm:w-[240px] bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all flex flex-col"
            >
              {/* Cover + Avatar */}
              <div className="relative h-[72px] bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #000 1px, transparent 1px), radial-gradient(circle at 80% 20%, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                {/* Avatar — overlapping cover */}
                <div className="absolute -bottom-6 left-4">
                  <div className="w-14 h-14 rounded-full border-[3px] border-white overflow-hidden bg-gray-100 flex items-center justify-center shadow-sm">
                    {org.logo_url ? (
                      <Image src={org.logo_url} alt={org.name} width={56} height={56} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-lg font-bold text-gray-500">{initials}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="pt-9 pb-4 px-4 flex flex-col flex-1">
                {/* Name + verified */}
                <p className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-gray-600 transition-colors">
                  {org.name}
                  {org.verified_badge && (
                    <span className="text-amber-500 ml-1 text-[11px]" title="Verified">✓</span>
                  )}
                </p>

                {/* Ministry type */}
                {org.ministry_type && org.ministry_type.toLowerCase() !== 'other' && (
                  <p className="mt-0.5 text-[11px] text-gray-500 truncate">{org.ministry_type}</p>
                )}

                {/* Bio */}
                {org.description ? (
                  <p className="mt-2 text-[12px] text-gray-500 line-clamp-2 leading-relaxed">
                    {org.description}
                  </p>
                ) : (
                  <p className="mt-2 text-[12px] text-gray-400 italic line-clamp-2 leading-relaxed">
                    Gospel event organizer
                  </p>
                )}

                {/* Location */}
                <div className="mt-auto pt-3 flex items-center gap-1 text-[11px] text-gray-400">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{[org.city, org.state].filter(Boolean).join(', ')}</span>
                </div>
              </div>
            </Link>
          )
        })}
        <div className="flex-shrink-0 w-4" />
      </div>
    </section>
  )
}
