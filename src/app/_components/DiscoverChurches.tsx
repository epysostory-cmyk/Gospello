'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'

interface ChurchCard {
  id: string
  name: string
  slug: string
  logo_url: string | null
  denomination: string | null
  city: string
  state: string
  verified_badge: boolean
}

interface Props {
  churches: ChurchCard[]
}

export default function DiscoverChurches({ churches }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [stateFilter, setStateFilter] = useState<string | null>(null)
  const [denomFilter, setDenomFilter] = useState<string | null>(null)

  // Derive unique states and denominations from the data
  const states = [...new Set(churches.map(c => c.state).filter(Boolean))].sort()
  const denoms = [...new Set(churches.map(c => c.denomination).filter(Boolean))].sort() as string[]

  const filtered = churches.filter(c => {
    if (stateFilter && c.state !== stateFilter) return false
    if (denomFilter && c.denomination !== denomFilter) return false
    return true
  })

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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
  }, [filtered])

  // Reset scroll when filters change
  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0 })
  }, [stateFilter, denomFilter])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'right' ? 380 : -380, behavior: 'smooth' })
  }

  if (churches.length === 0) return null

  return (
    <section ref={sectionRef} className="py-16">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Find Your Church Family</h2>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Discover churches near you and across Nigeria</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm transition-opacity disabled:opacity-30"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm transition-opacity disabled:opacity-30"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <Link href="/churches" className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Filter chips */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex gap-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none' } as React.CSSProperties}
      >
        {/* State filters */}
        {states.map(s => (
          <button
            key={s}
            onClick={() => setStateFilter(stateFilter === s ? null : s)}
            className="flex-shrink-0 h-8 px-3 rounded-full text-[13px] font-medium transition-all whitespace-nowrap"
            style={{
              background: stateFilter === s ? '#111827' : '#F3F4F6',
              color: stateFilter === s ? 'white' : '#374151',
              border: '1px solid transparent',
            }}
          >
            📍 {s}
          </button>
        ))}

        {/* Divider */}
        {states.length > 0 && denoms.length > 0 && (
          <div className="flex-shrink-0 w-px bg-gray-200 mx-1 self-stretch" />
        )}

        {/* Denomination filters */}
        {denoms.map(d => (
          <button
            key={d}
            onClick={() => setDenomFilter(denomFilter === d ? null : d)}
            className="flex-shrink-0 h-8 px-3 rounded-full text-[13px] font-medium transition-all whitespace-nowrap"
            style={{
              background: denomFilter === d ? '#7C3AED' : '#F3F4F6',
              color: denomFilter === d ? 'white' : '#374151',
              border: '1px solid transparent',
            }}
          >
            {d}
          </button>
        ))}

        {/* Clear */}
        {(stateFilter || denomFilter) && (
          <button
            onClick={() => { setStateFilter(null); setDenomFilter(null) }}
            className="flex-shrink-0 h-8 px-3 rounded-full text-[13px] font-medium text-gray-500 bg-white border border-gray-200 whitespace-nowrap transition-colors hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400 text-sm">
          No churches found for that filter.
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pl-4 sm:pl-6 lg:pl-8 pr-4 pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {filtered.map((church, i) => (
            <div
              key={church.id}
              className="flex-shrink-0 snap-start w-[160px] md:w-[180px]"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.4s ease ${i * 50}ms, transform 0.4s ease ${i * 50}ms`,
              }}
            >
              <div
                className="flex flex-col items-center text-center p-4"
                style={{
                  height: 200,
                  borderRadius: '20px',
                  background: 'white',
                  border: '0.5px solid #E5E7EB',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center mb-2"
                  style={{ background: church.logo_url ? undefined : 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)' }}
                >
                  {church.logo_url ? (
                    <Image src={church.logo_url} alt={church.name} width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-2xl">⛪</span>
                  )}
                </div>

                <div className="flex items-center gap-1 justify-center mb-1 w-full">
                  <p className="text-[14px] font-medium text-[#111827] line-clamp-2 leading-tight">{church.name}</p>
                  {church.verified_badge && (
                    <span className="text-amber-500 text-xs flex-shrink-0" title="Verified">✓</span>
                  )}
                </div>

                {church.denomination && (
                  <span className="inline-block bg-purple-100 text-purple-700 text-[11px] font-medium px-2 py-0.5 rounded-full mb-1 truncate max-w-full">
                    {church.denomination}
                  </span>
                )}

                <p className="text-[12px] text-[#6B7280] text-center">
                  {[church.city, church.state].filter(Boolean).join(', ')}
                </p>

                <div className="flex-1" />

                <Link
                  href={`/churches/${church.slug}`}
                  className="w-full h-8 flex items-center justify-center text-[12px] font-medium text-gray-700 bg-white transition-colors rounded-lg"
                  style={{ border: '1.5px solid #E5E7EB' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = '#7C3AED'
                    el.style.color = 'white'
                    el.style.borderColor = '#7C3AED'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = 'white'
                    el.style.color = '#374151'
                    el.style.borderColor = '#E5E7EB'
                  }}
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
          <div className="flex-shrink-0 w-4" />
        </div>
      )}
    </section>
  )
}
