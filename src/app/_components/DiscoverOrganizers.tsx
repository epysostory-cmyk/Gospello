'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'

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
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 380 : -380, behavior: 'smooth' })
  }

  if (organizers.length === 0) return null

  return (
    <section className="py-12 border-t border-gray-100">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Organizers</h2>
          <p className="text-gray-500 mt-0.5 text-sm">Ministries and event hosts putting on gospel events</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm disabled:opacity-30 hover:bg-gray-50 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm disabled:opacity-30 hover:bg-gray-50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <Link href="/organizers" className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pl-4 sm:pl-6 lg:pl-8 pr-4 pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {organizers.map((org) => (
          <Link
            key={`${org.source}-${org.id}`}
            href={`/organizers/${org.source === 'profile' ? org.id : org.slug}`}
            className="group flex-shrink-0 snap-start w-[160px] md:w-[176px] bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center hover:border-gray-300 hover:shadow-sm transition-all"
          >
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center mb-3 flex-shrink-0">
              {org.logo_url ? (
                <Image src={org.logo_url} alt={org.name} width={56} height={56} className="object-cover w-full h-full" />
              ) : (
                <span className="text-2xl">🎤</span>
              )}
            </div>

            {/* Name */}
            <p className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug mb-1 group-hover:text-indigo-700 transition-colors">
              {org.name}
              {org.verified_badge && <span className="text-amber-500 ml-0.5 text-xs" title="Verified">✓</span>}
            </p>

            {org.ministry_type && (
              <span className="inline-block bg-indigo-50 text-indigo-700 text-[11px] font-medium px-2 py-0.5 rounded-full mb-1 truncate max-w-full">
                {org.ministry_type}
              </span>
            )}

            <p className="text-[11px] text-gray-400 mt-auto pt-2">
              {[org.city, org.state].filter(Boolean).join(', ')}
            </p>
          </Link>
        ))}
        <div className="flex-shrink-0 w-4" />
      </div>
    </section>
  )
}
